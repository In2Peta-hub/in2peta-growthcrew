"""Shared JSON data layer for the unified GrowthCrew backend.

Both product surfaces persist through this module so read/write, atomic
replace and locking live in exactly one place instead of being reinvented per
feature:

* Social studio queue / channels / settings -> ``data/data.json``
* Outreach leads / messages / settings      -> ``data/outreach.json``
"""

from __future__ import annotations

import copy
import json
import os
import threading
from pathlib import Path
from typing import Any, Callable

DATA_DIR = Path(os.getenv("GROWTHCREW_DATA_DIR") or Path(__file__).resolve().parent / "data")


class JsonStore:
    """A small thread-safe JSON document store backed by a single file."""

    def __init__(self, filename: str, defaults: dict[str, Any] | None = None, *, env_var: str | None = None):
        override = os.getenv(env_var) if env_var else None
        self.path = Path(override) if override else DATA_DIR / filename
        self.defaults = defaults or {}
        self._lock = threading.RLock()

    def _with_defaults(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, dict):
            return copy.deepcopy(self.defaults)
        for key, value in self.defaults.items():
            data.setdefault(key, copy.deepcopy(value))
        return data

    def read(self) -> dict[str, Any]:
        with self._lock:
            if not self.path.exists():
                return copy.deepcopy(self.defaults)
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
            except Exception:
                return copy.deepcopy(self.defaults)
            return self._with_defaults(data)

    def write(self, data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.path.with_suffix(self.path.suffix + ".tmp")
            tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
            tmp.replace(self.path)
            return data

    def update(self, mutate: Callable[[dict[str, Any]], Any]) -> dict[str, Any]:
        """Read, apply ``mutate(data)`` (which may mutate in place or return a
        replacement dict), persist and return the resulting document."""
        with self._lock:
            data = self.read()
            replacement = mutate(data)
            if isinstance(replacement, dict):
                data = replacement
            return self.write(data)
