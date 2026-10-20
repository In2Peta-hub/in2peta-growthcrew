"""Optional testing login uses the real session and never a default credential."""
import hashlib
import json

import pytest
from starlette.requests import Request
from growthcrew.errors import GrowthcrewError
from routers import finder_router

from config import CONFIG
from growthcrew import finder, finder_store
class LocalClient:
    """Exercise router handlers without an optional HTTP test transport."""
    def post(self, path, json):
        routes = {
            "/api/finder/sessions/password": (finder_router.password_session, finder_router.PasswordBody, True),
            "/api/finder/accounts": (finder_router.create_account, finder_router.AccountBody, True),
            "/api/finder/sessions": (finder_router.create_session, finder_router.SessionBody, True),
            "/api/finder/sessions/verify": (finder_router.verify_session, finder_router.VerifyBody, False),
        }
        handler, model, needs_request = routes[path]
        try:
            args = [model(**json)]
            if needs_request:
                args.append(Request({"type": "http", "client": ("127.0.0.1", 1234), "headers": []}))
            result = handler(*args)
            if isinstance(result, dict):
                result = finder_router._json(200, result)
            return result
        except GrowthcrewError as error:
            return finder_router._json(error.status, {"message": str(error), "code": error.code})



@pytest.fixture
def password_login(tmp_path, monkeypatch):
    monkeypatch.setattr(finder_store._STORE, "path", tmp_path / "finder.json")
    salt = bytes.fromhex("64d8d5523d69147526daf5fd9a45f2a3")
    digest = hashlib.pbkdf2_hmac("sha256", b"fixture-password", salt, 600000).hex()
    monkeypatch.setattr(CONFIG, "FINDER_TEST_EMAIL", "tester@example.com")
    monkeypatch.setattr(CONFIG, "FINDER_TEST_PASSWORD_HASH", f"pbkdf2_sha256$600000${salt.hex()}${digest}")
    finder._RATE_EVENTS.clear()
    yield LocalClient()
    finder._RATE_EVENTS.clear()


def test_password_login_creates_real_account_and_reuses_it(password_login):
    client = password_login
    body = {"email": "Tester@Example.COM", "password": "fixture-password"}
    response = client.post("/api/finder/sessions/password", json=body)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    result = json.loads(response.body)
    request = Request({"type": "http", "headers": [(b"x-finder-token", result["token"].encode())]})
    assert finder_router.me(request)["account"]["email"] == "tester@example.com"
    assert finder_router.leads(request) == {"leads": []}
    assert finder_router.export_csv(request).status_code == 200
    assert json.loads(client.post("/api/finder/sessions/password", json=body).body)["token"] != result["token"]
    assert len(finder_store.list_accounts()) == 1
    assert "fixture-password" not in str(finder_store.load())


def test_wrong_password_and_other_email_are_generic(password_login):
    wrong = password_login.post("/api/finder/sessions/password", json={"email": "tester@example.com", "password": "wrong"})
    other = password_login.post("/api/finder/sessions/password", json={"email": "other@example.com", "password": "fixture-password"})
    assert wrong.status_code == other.status_code == 401
    assert json.loads(wrong.body) == json.loads(other.body)
    assert finder_store.list_accounts() == []


@pytest.mark.parametrize("configured_hash", ["", "invalid", "pbkdf2_sha256$999999999999$00$00"])
def test_disabled_or_malformed_config_rejects_login(password_login, monkeypatch, configured_hash):
    monkeypatch.setattr(CONFIG, "FINDER_TEST_PASSWORD_HASH", configured_hash)
    assert password_login.post("/api/finder/sessions/password", json={"email": "tester@example.com", "password": "fixture-password"}).status_code == 401


def test_password_attempts_are_rate_limited(password_login):
    body = {"email": "tester@example.com", "password": "wrong"}
    for _ in range(5):
        assert password_login.post("/api/finder/sessions/password", json=body).status_code == 401
    assert password_login.post("/api/finder/sessions/password", json=body).status_code == 429


def test_reserved_account_cannot_be_claimed_through_signup(password_login):
    assert password_login.post("/api/finder/accounts", json={"email": "tester@example.com"}).status_code == 409
    assert finder_store.get_account("tester@example.com") is None


def test_magic_link_still_works(password_login, monkeypatch):
    monkeypatch.setattr(finder, "_send_sign_in_email", lambda *args: True)
    account = finder.create_account("ordinary@example.com")
    assert account["token"]
    assert password_login.post("/api/finder/sessions", json={"email": "ordinary@example.com"}).status_code == 202
    finder_store.save_code("ordinary@example.com", hashlib.sha256(b"test-code").hexdigest(), "2099-01-01T00:00:00+00:00")
    response = password_login.post("/api/finder/sessions/verify", json={"email": "ordinary@example.com", "code": "test-code"})
    assert response.status_code == 200
    assert json.loads(response.body)["account"]["email"] == "ordinary@example.com"


def test_only_configured_testing_account_bypasses_batch_quota(password_login):
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date().isoformat()
    testing = {"email": "tester@example.com", "batchCounts": {today: 20}}
    finder._consume_batch_quota(testing)
    with pytest.raises(GrowthcrewError, match="today's limit"):
        finder._consume_batch_quota({"email": "other@example.com", "batchCounts": {today: 20}})
