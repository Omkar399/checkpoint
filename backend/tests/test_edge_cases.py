"""Additional edge-case tests beyond the core happy-path coverage.

Targets a few common failure modes that the audit flagged: duplicate auth,
missing auth, idempotent join, non-member access.
"""

from __future__ import annotations

from tests.conftest import make_user


def test_register_duplicate_email_returns_400(client):
    """A second registration with the same email must be rejected."""
    user = make_user(client)
    # Re-register with same email but different username
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": user["email"],
            "username": user["username"] + "_alt",
            "password": "anotherpass",
        },
    )
    assert resp.status_code == 400
    assert "already" in resp.json()["detail"].lower()


def test_create_server_without_auth_returns_401(client):
    """All write endpoints must require a Bearer token."""
    resp = client.post(
        "/api/v1/servers",
        json={"name": "Anonymous Server", "description": None},
    )
    assert resp.status_code == 401


def test_get_channels_for_non_member_returns_403(client):
    """A user not in the server cannot list its channels."""
    owner = make_user(client, suffix="owner")
    outsider = make_user(client, suffix="outsider")

    server_resp = client.post(
        "/api/v1/servers",
        json={"name": "Private Crew", "description": "members only"},
        headers=owner["headers"],
    )
    assert server_resp.status_code == 200, server_resp.text
    server_id = server_resp.json()["id"]

    resp = client.get(
        f"/api/v1/servers/{server_id}/channels", headers=outsider["headers"]
    )
    assert resp.status_code == 403


def test_join_channel_is_idempotent(client):
    """Joining a channel twice should not error or duplicate membership."""
    owner = make_user(client, suffix="own")

    server_resp = client.post(
        "/api/v1/servers",
        json={"name": "Idem Server"},
        headers=owner["headers"],
    )
    server_id = server_resp.json()["id"]

    channel_resp = client.post(
        f"/api/v1/servers/{server_id}/channels",
        json={"name": "general"},
        headers=owner["headers"],
    )
    assert channel_resp.status_code == 200, channel_resp.text
    channel_id = channel_resp.json()["id"]

    # First join (owner is auto-joined on create, this re-joins)
    first = client.post(
        f"/api/v1/channels/{channel_id}/join", headers=owner["headers"]
    )
    assert first.status_code == 200, first.text

    # Second join — must succeed without creating a duplicate row
    second = client.post(
        f"/api/v1/channels/{channel_id}/join", headers=owner["headers"]
    )
    assert second.status_code == 200, second.text

    # Members list should contain the owner exactly once
    members = client.get(
        f"/api/v1/channels/{channel_id}/members", headers=owner["headers"]
    )
    assert members.status_code == 200
    owner_count = sum(
        1 for m in members.json() if m["user"]["email"] == owner["email"]
    )
    assert owner_count == 1, members.json()
