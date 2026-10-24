"""The redesign's existing flow must actually use MCP, not just expose a new API."""
from unittest.mock import patch

from config import CONFIG
from growthcrew import finder, lead_chat, leadsdb, service


def test_finder_candidates_use_mcp_and_preserve_country_normalization(monkeypatch):
    calls = []
    async def execute(queries, max_results):
        calls.append((queries, max_results))
        return [{"name": "Jane Smith", "email": "jane@example.com", "company": "Example Software", "title": "Founder", "category": "Software", "city": "Austin", "raw": {}}], queries
    monkeypatch.setattr(lead_chat, "execute_source_queries", execute)
    monkeypatch.setattr(leadsdb, "is_configured", lambda: True)
    records = finder._collect_records({"who": "SaaS founders", "where": "USA"}, 5)
    assert records
    assert calls[0][1] >= 5
    assert all("%usa%" not in sql.lower() for sql in calls[0][0])
    assert any("%founder%" in sql.lower() for sql in calls[0][0])


def test_gateway_prefers_configured_kimi_over_old_stored_model(monkeypatch):
    monkeypatch.setattr(CONFIG, "LITELLM_MODEL", "kimi-k3")
    monkeypatch.setattr(CONFIG, "LITELLM_MASTER_KEY", "test")
    monkeypatch.setattr(CONFIG, "LITELLM_BASE_URL", "https://example.com/v1")
    monkeypatch.setattr(service, "get_settings", lambda: {"ai": {"provider": "gateway", "model": "gpt-oss-120b"}})
    monkeypatch.setattr(finder, "list_gateway_models", lambda *args: [])
    with patch.object(finder, "chat_via_openai", return_value='{"ready":true}') as completion:
        assert finder._ai_text("test") == '{"ready":true}'
    assert completion.call_args.args[2] == "kimi-k3"


def test_chat_gateway_prefers_configured_kimi(monkeypatch):
    monkeypatch.setattr(CONFIG, "LITELLM_MODEL", "kimi-k3")
    with patch.object(lead_chat.ai, "chat_via_openai", return_value='{"query":"software"}') as completion:
        lead_chat.plan_search(lead_chat.LeadChatBody(message="Find software companies"), {"ai": {"provider": "gateway", "model": "gpt-oss-120b", "endpoint": "https://example.com/v1", "apiKey": "test"}})
    assert completion.call_args.args[2] == "kimi-k3"


def test_conversational_search_also_preserves_usa_coverage():
    sql = lead_chat.build_query(leadsdb.SOURCES[0], lead_chat.LeadFilters(query="software", location="Austin, USA"))
    assert "%austin%" in sql.lower()
    assert "%usa%" not in sql.lower()
