"""Tests for server + channel creation flows."""

from __future__ import annotations

from tests.conftest import make_user


def _create_server(client, headers, name: str = "Test Server") -> dict:
    resp = client.post(
        "/api/v1/servers",
        headers=headers,
        json={"name": name, "description": "for tests"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_create_server_and_default_channel_kind(client):
    user = make_user(client)
    headers = user["headers"]

    server = _create_server(client, headers, "Default Kind Server")

    # Create a channel without specifying kind -> should default to "numeric"
    resp = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=headers,
        json={"name": "general", "description": "default kind"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "general"
    assert body["kind"] == "numeric"
    assert body["server_id"] == server["id"]


def test_create_channel_requires_owner(client):
    owner = make_user(client, suffix="owner")
    other = make_user(client, suffix="other")

    server = _create_server(client, owner["headers"], "Owner Only Server")

    # `other` is not a member at all -> 403
    resp = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=other["headers"],
        json={"name": "no-go"},
    )
    assert resp.status_code == 403


def test_create_channel_with_kind_binary(client):
    user = make_user(client)
    server = _create_server(client, user["headers"], "Binary Server")

    resp = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=user["headers"],
        json={"name": "did-you-meditate", "kind": "binary"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["kind"] == "binary"


def test_create_channel_checklist_requires_items(client):
    user = make_user(client)
    server = _create_server(client, user["headers"], "Checklist Server")

    # Missing items -> 400
    resp_missing = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=user["headers"],
        json={"name": "morning", "kind": "checklist"},
    )
    assert resp_missing.status_code == 400

    # Empty list -> 400
    resp_empty = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=user["headers"],
        json={"name": "morning2", "kind": "checklist", "items": []},
    )
    assert resp_empty.status_code == 400

    # With items -> success
    resp_ok = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=user["headers"],
        json={
            "name": "morning3",
            "kind": "checklist",
            "items": ["water", "stretch", "journal"],
        },
    )
    assert resp_ok.status_code == 200, resp_ok.text
    assert resp_ok.json()["kind"] == "checklist"
    assert resp_ok.json()["items"] == ["water", "stretch", "journal"]
