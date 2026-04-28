"""Tests for the check-in endpoints (create, streak, dashboard)."""

from __future__ import annotations

from tests.conftest import make_user


def _server_and_channel(client, headers, kind: str = "numeric", items=None) -> tuple[int, int]:
    server = client.post(
        "/api/v1/servers",
        headers=headers,
        json={"name": "Checkin Server", "description": "for tests"},
    ).json()

    payload = {"name": "general", "kind": kind}
    if items is not None:
        payload["items"] = items
    channel = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=headers,
        json=payload,
    )
    assert channel.status_code == 200, channel.text
    return server["id"], channel.json()["id"]


def test_create_checkin_numeric(client):
    user = make_user(client)
    _, channel_id = _server_and_channel(client, user["headers"], kind="numeric")

    resp = client.post(
        f"/api/v1/channels/{channel_id}/checkins",
        headers=user["headers"],
        json={"value": 7.5, "note": "good run"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["value"] == 7.5
    assert body["note"] == "good run"
    assert body["channel_id"] == channel_id
    assert body["user"]["username"] == user["username"]


def test_create_checkin_with_checked_items(client):
    user = make_user(client)
    items = ["water", "stretch", "journal"]
    _, channel_id = _server_and_channel(
        client, user["headers"], kind="checklist", items=items
    )

    resp = client.post(
        f"/api/v1/channels/{channel_id}/checkins",
        headers=user["headers"],
        json={"checked_items": [0, 2], "note": "did 2 of 3"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["checked_items"] == [0, 2]
    assert body["note"] == "did 2 of 3"


def test_streak_includes_today(client):
    user = make_user(client)
    _, channel_id = _server_and_channel(client, user["headers"], kind="numeric")

    # No check-ins yet -> streak 0
    pre = client.get(
        f"/api/v1/channels/{channel_id}/streak", headers=user["headers"]
    )
    assert pre.status_code == 200
    assert pre.json()["streak"] == 0

    # One check-in today -> streak 1
    client.post(
        f"/api/v1/channels/{channel_id}/checkins",
        headers=user["headers"],
        json={"value": 1.0},
    )

    resp = client.get(
        f"/api/v1/channels/{channel_id}/streak", headers=user["headers"]
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["streak"] == 1


def test_dashboard_marks_member_as_checked_in(client):
    user = make_user(client)
    _, channel_id = _server_and_channel(client, user["headers"], kind="numeric")

    # Before check-in: dashboard has the user with checked_in=False
    pre = client.get(
        f"/api/v1/channels/{channel_id}/dashboard", headers=user["headers"]
    )
    assert pre.status_code == 200, pre.text
    pre_entries = pre.json()
    me_pre = next((e for e in pre_entries if e["username"] == user["username"]), None)
    assert me_pre is not None
    assert me_pre["checked_in"] is False

    # After a check-in: same user shows up with checked_in=True
    client.post(
        f"/api/v1/channels/{channel_id}/checkins",
        headers=user["headers"],
        json={"value": 3.0, "note": "done"},
    )

    post = client.get(
        f"/api/v1/channels/{channel_id}/dashboard", headers=user["headers"]
    )
    assert post.status_code == 200
    me_post = next(
        (e for e in post.json() if e["username"] == user["username"]), None
    )
    assert me_post is not None
    assert me_post["checked_in"] is True
    assert me_post["last_checkin_at"] is not None
