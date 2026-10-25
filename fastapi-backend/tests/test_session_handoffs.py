import json

import pytest
from starlette.requests import Request

from config import CONFIG
from growthcrew import finder, finder_store, session_handoffs
from growthcrew.errors import GrowthcrewError
from routers import finder_router


def request(origin='http://localhost:5173', token=None):
    headers = [(b'origin', origin.encode())]
    if token:
        headers.append((b'x-finder-token', token.encode()))
    return Request({'type': 'http', 'headers': headers, 'client': ('127.0.0.1', 1234)})


@pytest.fixture
def account(tmp_path, monkeypatch):
    monkeypatch.setattr(finder_store._STORE, 'path', tmp_path / 'finder.json')
    monkeypatch.setattr(session_handoffs._STORE, 'path', tmp_path / 'handoffs.json')
    monkeypatch.setattr(CONFIG, 'FRONTEND_URL', 'https://growthcrew.example.com')
    finder._RATE_EVENTS.clear()
    yield finder.create_account('routing@example.com')
    finder._RATE_EVENTS.clear()


def test_authenticated_handoff_preserves_account_and_is_single_use(account):
    response = finder_router.create_handoff(
        finder_router.HandoffBody(origin='http://app.localhost:5173'), request(token=account['token']))
    assert response.headers['cache-control'] == 'no-store'
    code = json.loads(response.body)['code']
    assert code not in session_handoffs._STORE.path.read_text()
    response = finder_router.consume_handoff(
        finder_router.ConsumeHandoffBody(code=code), request('http://app.localhost:5173'))
    result = json.loads(response.body)
    assert response.headers['cache-control'] == 'no-store'
    assert finder.account_for_token(result['token'])['email'] == 'routing@example.com'
    with pytest.raises(GrowthcrewError, match='expired'):
        session_handoffs.consume(code, 'http://app.localhost:5173')


def test_handoff_requires_authentication(account):
    with pytest.raises(GrowthcrewError) as error:
        finder_router.create_handoff(finder_router.HandoffBody(origin='http://app.localhost:5173'), request())
    assert error.value.status == 401


def test_handoff_is_origin_bound_and_expires(account, monkeypatch):
    now = session_handoffs.time.time()
    code = session_handoffs.create(account['account'], 'http://localhost:5173', 'http://app.localhost:5173')
    with pytest.raises(GrowthcrewError):
        session_handoffs.consume(code, 'https://evil.example.com')
    monkeypatch.setattr(session_handoffs.time, 'time', lambda: now + 61)
    with pytest.raises(GrowthcrewError):
        session_handoffs.consume(code, 'http://app.localhost:5173')


@pytest.mark.parametrize('source,destination', [
    ('http://localhost:5173', 'https://evil.example.com'),
    ('https://evil.example.com', 'https://app.growthcrew.example.com'),
    ('http://localhost:5173', 'http://app.localhost:5174'),
    ('http://localhost:5173', 'http://app.localhost:invalid'),
    ('http://localhost:5173', 'http://app.localhost:5173/other'),
])
def test_unknown_origin_is_rejected(account, source, destination):
    with pytest.raises(GrowthcrewError):
        session_handoffs.create(account['account'], source, destination)


def test_configured_domain_pair(account):
    code = session_handoffs.create(account['account'], 'https://growthcrew.example.com', 'https://app.growthcrew.example.com')
    assert session_handoffs.consume(code, 'https://app.growthcrew.example.com')['account']['email'] == 'routing@example.com'


@pytest.mark.parametrize('base,expected', [
    ('http://localhost:5173', 'http://app.localhost:5173/social'),
    ('https://growthcrew.example.com', 'https://app.growthcrew.example.com/social'),
    ('https://preview.vercel.app', 'https://preview.vercel.app/app/social'),
])
def test_server_links_target_dashboard(monkeypatch, base, expected):
    from growthcrew.frontend_urls import dashboard_url
    monkeypatch.setattr(CONFIG, 'FRONTEND_URL', base)
    assert dashboard_url('/social') == expected
