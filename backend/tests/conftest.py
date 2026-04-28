"""Pytest fixtures for the Checkpoint API test suite.

Each test gets an isolated in-memory SQLite database. We use a single shared
connection (via StaticPool) so that the FastAPI request-scoped sessions all
see the same in-memory DB.
"""

from __future__ import annotations

import os
import sys
import uuid
from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make sure the backend root is on sys.path so `import app` / `import main` work
# regardless of where pytest is invoked from.
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app.database import Base  # noqa: E402
from app.dependencies import get_db  # noqa: E402
from app.migrations import run_startup_migrations  # noqa: E402
import app.models  # noqa: E402,F401  (registers all ORM models on Base)
from main import app as fastapi_app  # noqa: E402


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """Yield a TestClient backed by a fresh in-memory SQLite database."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    run_startup_migrations(engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    try:
        with TestClient(fastapi_app) as test_client:
            yield test_client
    finally:
        fastapi_app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def _unique_suffix() -> str:
    return uuid.uuid4().hex[:8]


def make_user(
    client: TestClient,
    *,
    suffix: str | None = None,
    email: str | None = None,
    username: str | None = None,
    password: str = "testpass123",
) -> dict:
    """Register a fresh user via the API and return a dict with token + creds."""
    sfx = suffix or _unique_suffix()
    email = email or f"u_{sfx}@test.com"
    username = username or f"user_{sfx}"
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert resp.status_code == 200, f"register failed: {resp.status_code} {resp.text}"
    token = resp.json()["access_token"]
    return {
        "email": email,
        "username": username,
        "password": password,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def auth_headers(client: TestClient):
    """Return a callable that registers a user and gives back auth headers.

    Usage:
        headers = auth_headers()                    # random user
        headers = auth_headers(suffix="alice")     # deterministic suffix
    """
    def _factory(
        suffix: str | None = None,
        email: str | None = None,
        username: str | None = None,
        password: str = "testpass123",
    ) -> dict:
        return make_user(
            client,
            suffix=suffix,
            email=email,
            username=username,
            password=password,
        )["headers"]

    return _factory


@pytest.fixture()
def make_user_fixture(client: TestClient):
    """Fixture wrapper around make_user for tests that need full creds."""
    def _factory(**kwargs) -> dict:
        return make_user(client, **kwargs)
    return _factory
