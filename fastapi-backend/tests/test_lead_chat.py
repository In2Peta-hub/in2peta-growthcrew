import asyncio
import json
from contextlib import asynccontextmanager
from types import SimpleNamespace

import duckdb
import pytest
from fastapi.testclient import TestClient

from config import CONFIG
from growthcrew import lead_chat, leadsdb
from growthcrew.errors import GrowthcrewError
from main import app


def result(rows=(), **overrides):
    payload = {"success": True, "columns": leadsdb.RESULT_COLUMNS, "rows": list(rows)}
    payload.update(overrides)
    return SimpleNamespace(isError=False, structuredContent=payload, content=[])


def row(email="person@example.com"):
    return ["contacts", "Jane Smith", "", "Founder", "Acme", "", "", "Austin", "Texas", "", "Software", email, ""]


def test_query_requires_each_filter_and_never_interpolates_sql():
    filters = lead_chat.LeadFilters(query="software", title="Founder'; DROP TABLE contacts;--", location="Austin Texas")
    sql = lead_chat.build_query(leadsdb.SOURCES[0], filters)
    assert "LIKE '%austin%' AND lower(location_text) LIKE '%texas%'" in sql
    assert "DROP TABLE" not in sql
    # Execute the generated query against a local table with the actual source schema.
    con = duckdb.connect()
    import re
    columns = set(re.findall(r'"([^"\n]+)"', leadsdb.SOURCES[0]["inner"])) - {"contacts"}
    con.execute('CREATE TABLE contacts (' + ', '.join(f'"{c}" VARCHAR' for c in columns) + ')')
    assert con.execute(sql).fetchall() == []
    con.close()


@pytest.mark.parametrize("payload", [{"success": False}, {"columns": []}, {"rows": [["bad"]]}])
def test_malformed_results_are_rejected(payload):
    with pytest.raises(ValueError):
        lead_chat.query_rows(result(**payload))


def test_text_content_results():
    response = result([row()])
    response.content = [SimpleNamespace(type="text", text=json.dumps(response.structuredContent))]
    response.structuredContent = None
    assert lead_chat.query_rows(response)[0]["email_a"] == "person@example.com"


def test_mcp_uses_only_read_query_and_deduplicates(monkeypatch):
    calls = []
    @asynccontextmanager
    async def transport(url, **kwargs):
        assert url == lead_chat.MCP_URL
        yield None, None, None
    class Session:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def initialize(self): pass
        async def call_tool(self, name, arguments):
            calls.append((name, arguments))
            return result([row(), row()])
    monkeypatch.setattr(lead_chat, "streamable_http_client", transport)
    monkeypatch.setattr(lead_chat, "ClientSession", Session)
    leads, queries = asyncio.run(lead_chat.search_mcp(lead_chat.LeadFilters(query="software", maxResults=2)))
    assert len(leads) == 1
    assert len(queries) == 3
    assert all(name == "query" and args["database"] == CONFIG.MOTHERDUCK_DATABASE for name, args in calls)


def test_missing_token_is_actionable(monkeypatch):
    monkeypatch.setattr(CONFIG, "MOTHERDUCK_TOKEN", "")
    with pytest.raises(GrowthcrewError) as error:
        asyncio.run(lead_chat.chat_search(lead_chat.LeadChatBody(message="Find founders"), {}))
    assert error.value.status == 503


def test_mcp_failure_does_not_expose_provider_details(monkeypatch):
    monkeypatch.setattr(leadsdb, "is_configured", lambda: True)
    monkeypatch.setattr(lead_chat, "plan_search", lambda *args: lead_chat.SearchPlan(query="software"))
    async def fail(filters):
        raise RuntimeError("sensitive provider response")
    monkeypatch.setattr(lead_chat, "search_mcp", fail)
    with TestClient(app) as client:
        response = client.post("/api/growthcrew/leads/chat", json={"message": "Find software businesses"})
    assert response.status_code == 502
    assert response.json()["code"] == "MOTHERDUCK_MCP_FAILED"
    assert "sensitive" not in response.text


def test_missing_ai_credentials_does_not_call_provider():
    with pytest.raises(GrowthcrewError) as error:
        lead_chat.plan_search(lead_chat.LeadChatBody(message="Find founders"), {"ai": {"provider": "gateway", "apiKey": "", "endpoint": "https://example.com"}})
    assert error.value.code == "LEAD_CHAT_AI_NOT_CONFIGURED"


def test_mcp_trial_error_is_actionable(monkeypatch):
    import httpx
    monkeypatch.setattr(leadsdb, "is_configured", lambda: True)
    monkeypatch.setattr(lead_chat, "plan_search", lambda *args: lead_chat.SearchPlan(query="software"))
    async def fail(filters):
        response = httpx.Response(500, request=httpx.Request("POST", lead_chat.MCP_URL))
        raise ExceptionGroup("MCP failed", [httpx.HTTPStatusError("Internal server error", request=response.request, response=response)])
    monkeypatch.setattr(lead_chat, "search_mcp", fail)
    monkeypatch.setattr(lead_chat, "_diagnose_connection", lambda: lead_chat._account_error(RuntimeError("Your MotherDuck trial has ended. sensitive details")))
    with TestClient(app) as client:
        response = client.post("/api/growthcrew/leads/chat", json={"message": "Find software businesses"})
    assert response.status_code == 503
    assert response.json()["code"] == "MOTHERDUCK_ACCOUNT_INACTIVE"
    assert "organization admin" in response.json()["error"]
    assert "sensitive" not in response.text


def test_tool_result_trial_failure_is_classified():
    with pytest.raises(GrowthcrewError) as error:
        lead_chat.query_rows(result(success=False, error="Your MotherDuck trial has ended."))
    assert error.value.code == "MOTHERDUCK_ACCOUNT_INACTIVE"


def test_clarification_does_not_query_and_keeps_previous_filters(monkeypatch):
    monkeypatch.setattr(leadsdb, "is_configured", lambda: True)
    monkeypatch.setattr(lead_chat, "plan_search", lambda *args: lead_chat.SearchPlan(clarification="Revenue is unavailable. Search by industry instead?"))
    previous = lead_chat.LeadFilters(query="software")
    answer = asyncio.run(lead_chat.chat_search(lead_chat.LeadChatBody(message="Only over $1M revenue", previousFilters=previous), {}))
    assert answer["needsClarification"]
    assert answer["filters"]["query"] == "software"


def test_followup_context_reaches_planner(monkeypatch):
    captured = {}
    def completion(endpoint, key, model, prompt, **kwargs):
        captured["prompt"] = prompt
        return '{"query":"software","location":"Boston","maxResults":10}'
    monkeypatch.setattr(lead_chat.ai, "chat_via_openai", completion)
    body = lead_chat.LeadChatBody(message="Now Boston", previousFilters=lead_chat.LeadFilters(query="software", location="Austin", maxResults=10))
    plan = lead_chat.plan_search(body, {"ai": {"provider": "gateway", "endpoint": "https://example.com/v1", "apiKey": "test", "model": "test"}})
    assert '"location":"Austin"' in captured["prompt"]
    assert plan.location == "Boston" and plan.query == "software"


def test_chat_route_returns_existing_lead_shape(monkeypatch):
    monkeypatch.setattr(leadsdb, "is_configured", lambda: True)
    monkeypatch.setattr(lead_chat, "plan_search", lambda *args: lead_chat.SearchPlan(query="software"))
    async def search(filters):
        return [leadsdb._row_to_lead(dict(zip(leadsdb.RESULT_COLUMNS, row())), 0)], ["SELECT ..."]
    monkeypatch.setattr(lead_chat, "search_mcp", search)
    with TestClient(app) as client:
        answer = client.post("/api/growthcrew/leads/chat", json={"message": "Find software businesses"})
    assert answer.status_code == 200
    assert answer.json()["leads"][0]["source"] == "lead-database"
    assert answer.json()["count"] == 1


@pytest.mark.parametrize("body", [{"message": ""}, {"message": "a" * 2001}, {"message": "find", "previousFilters": {"maxResults": 101}}])
def test_route_bounds_inputs(body):
    with TestClient(app) as client:
        assert client.post("/api/growthcrew/leads/chat", json=body).status_code == 422
