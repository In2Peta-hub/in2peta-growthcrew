"""Single-use, origin-bound sign-in handoffs between the site and app."""
import hashlib
import secrets
import time
from urllib.parse import urlsplit

from growthcrew import finder, finder_store
from growthcrew.errors import GrowthcrewError
from growthcrew.frontend_urls import frontend_origins
from storage import JsonStore

_STORE = JsonStore('session-handoffs.json', {'codes': {}})


def _origins(source: str, destination: str) -> bool:
    try:
        configured = set(frontend_origins())
        if source in configured and destination in configured:
            return True
        src, dest = urlsplit(source), urlsplit(destination)
        if any(url.path or url.query or url.fragment or url.username or url.password for url in (src, dest)):
            return False
        return (src.scheme == dest.scheme == 'http' and src.port == dest.port
                and src.hostname in {'localhost', 'app.localhost', '127.0.0.1'}
                and dest.hostname in {'localhost', 'app.localhost', '127.0.0.1'})
    except ValueError:
        return False


def create(account: dict, source: str, destination: str) -> str:
    if not _origins(source, destination):
        raise GrowthcrewError('Unknown app origin.', 400, 'INVALID_ORIGIN')
    code = secrets.token_urlsafe(32)
    key = hashlib.sha256(code.encode()).hexdigest()
    now = time.time()

    def save(data):
        data['codes'] = {k: v for k, v in data['codes'].items() if v['expires'] > now}
        data['codes'][key] = {'email': account['email'], 'origin': destination, 'expires': now + 60}

    _STORE.update(save)
    return code


def consume(code: str, origin: str) -> dict:
    key = hashlib.sha256(code.encode()).hexdigest()
    matched = []

    def take(data):
        record = data['codes'].get(key)
        if record and record['origin'] == origin and record['expires'] > time.time():
            matched.append(data['codes'].pop(key))

    _STORE.update(take)
    if not matched:
        raise GrowthcrewError('The workspace link expired. Sign in to continue.', 401, 'INVALID_HANDOFF')
    account = finder_store.get_account(matched[0]['email'])
    if not account:
        raise GrowthcrewError('Sign in to continue.', 401, 'UNAUTHORIZED')
    token = secrets.token_urlsafe(32)
    finder_store.save_token(hashlib.sha256(token.encode()).hexdigest(), account['email'])
    return {'account': finder.public_account(account), 'token': token}
