"""Tests for the reaction endpoints."""

from __future__ import annotations

from tests.conftest import make_user


def _setup_checkin(client, headers) -> int:
    """Create a server, channel, and a check-in. Return checkin id."""
    server = client.post(
        "/api/v1/servers",
        headers=headers,
        json={"name": "Reaction Server"},
    ).json()
    channel = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=headers,
        json={"name": "general", "kind": "numeric"},
    ).json()
    checkin = client.post(
        f"/api/v1/channels/{channel['id']}/checkins",
        headers=headers,
        json={"value": 1.0, "note": "first"},
    )
    assert checkin.status_code == 200, checkin.text
    return checkin.json()["id"]


def test_add_reaction_to_checkin(client):
    user = make_user(client)
    checkin_id = _setup_checkin(client, user["headers"])

    resp = client.post(
        f"/api/v1/checkins/{checkin_id}/reactions",
        headers=user["headers"],
        json={"emoji": "fire"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["emoji"] == "fire"
    assert body["checkin_id"] == checkin_id

    # Confirm via the GET listing
    listing = client.get(
        f"/api/v1/checkins/{checkin_id}/reactions", headers=user["headers"]
    )
    assert listing.status_code == 200
    summary = listing.json()
    assert any(s["emoji"] == "fire" and s["count"] == 1 for s in summary)


def test_remove_reaction(client):
    user = make_user(client)
    checkin_id = _setup_checkin(client, user["headers"])

    add = client.post(
        f"/api/v1/checkins/{checkin_id}/reactions",
        headers=user["headers"],
        json={"emoji": "clap"},
    )
    assert add.status_code == 200, add.text

    delete = client.delete(
        f"/api/v1/checkins/{checkin_id}/reactions/clap",
        headers=user["headers"],
    )
    assert delete.status_code == 204

    # Re-deletion should now 404
    delete_again = client.delete(
        f"/api/v1/checkins/{checkin_id}/reactions/clap",
        headers=user["headers"],
    )
    assert delete_again.status_code == 404

    listing = client.get(
        f"/api/v1/checkins/{checkin_id}/reactions", headers=user["headers"]
    )
    assert listing.status_code == 200
    assert all(s["emoji"] != "clap" for s in listing.json())
