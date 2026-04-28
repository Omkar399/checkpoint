"""Tests for the /api/v1/auth/* endpoints."""

from __future__ import annotations

import uuid


def _email(prefix: str = "auth") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:6]}@test.com"


def _username(prefix: str = "auth") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:6]}"


def test_register_returns_token(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": _email("reg"),
            "username": _username("reg"),
            "password": "testpass123",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "access_token" in body
    assert isinstance(body["access_token"], str) and body["access_token"]
    assert body.get("token_type") == "bearer"


def test_login_with_correct_credentials(client):
    email = _email("login_ok")
    username = _username("login_ok")
    password = "supersecret"

    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert reg.status_code == 200, reg.text

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert resp.status_code == 200, resp.text
    assert "access_token" in resp.json()


def test_login_with_wrong_password_401(client):
    email = _email("login_bad")
    username = _username("login_bad")

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": "rightpass"},
    )

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpass"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    # Without auth header -> 401
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401

    # With a valid token -> 200 and returns the user
    email = _email("me")
    username = _username("me")
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": "testpass123"},
    )
    token = reg.json()["access_token"]

    me = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200, me.text
    assert me.json()["email"] == email
    assert me.json()["username"] == username
