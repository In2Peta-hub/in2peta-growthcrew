#!/usr/bin/env python3
"""Configure one testing login without storing or printing its plaintext password."""
import getpass
import hashlib
import os
import re
from pathlib import Path

email = input("Testing email: ").strip().lower()
if not re.fullmatch(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", email):
    raise SystemExit("Enter a valid email address.")
password = getpass.getpass("Testing password: ")
if len(password) < 10:
    raise SystemExit("Use at least 10 characters.")
if password != getpass.getpass("Confirm password: "):
    raise SystemExit("Passwords do not match.")
salt = os.urandom(16)
digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 600000).hex()
values = {
    "FINDER_TEST_EMAIL": email,
    "FINDER_TEST_PASSWORD_HASH": f"pbkdf2_sha256$600000${salt.hex()}${digest}",
}
env = Path(__file__).resolve().parents[1] / ".env"
lines = env.read_text().splitlines() if env.exists() else []
lines = [line for line in lines if not any(line.startswith(f"{key}=") for key in values)]
lines.extend(f"{key}='{value}'" for key, value in values.items())
env.write_text("\n".join(lines) + "\n")
env.chmod(0o600)
print("Testing login configured in the ignored backend .env. Restart the backend.")
