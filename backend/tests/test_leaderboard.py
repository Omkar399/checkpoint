"""Tests for the leaderboard endpoint."""

from __future__ import annotations

from tests.conftest import make_user


def _server_and_channel(client, headers) -> tuple[int, int]:
    server = client.post(
        "/api/v1/servers",
        headers=headers,
        json={"name": "Leaderboard Server"},
    ).json()
    channel = client.post(
        f"/api/v1/servers/{server['id']}/channels",
        headers=headers,
        json={"name": "general", "kind": "numeric"},
    ).json()
    return server["id"], channel["id"]


def test_empty_leaderboard_for_new_channel(client):
    user = make_user(client)
    _, channel_id = _server_and_channel(client, user["headers"])

    resp = client.get(
        f"/api/v1/channels/{channel_id}/leaderboard", headers=user["headers"]
    )
    assert resp.status_code == 200, resp.text
    assert resp.json() == []


def test_leaderboard_orders_users_by_checkin_count(client):
    owner = make_user(client, suffix="lbowner")
    server_id, channel_id = _server_and_channel(client, owner["headers"])

    # Second user joins via invite
    # NOTE: We deliberately omit `expires_in_hours` here. Setting it triggers a
    # known bug in invite_service.use_invite: SQLite stores `expires_at` as a
    # naive datetime, but use_invite compares it against
    # `datetime.now(timezone.utc)` (offset-aware), which raises TypeError. See
    # the test report for details. Per task scope, we document the bug rather
    # than fix the app from inside the test suite.
    invite = client.post(
        f"/api/v1/servers/{server_id}/invites",
        headers=owner["headers"],
        json={"max_uses": 5},
    )
    assert invite.status_code == 200, invite.text
    code = invite.json()["code"]

    other = make_user(client, suffix="lbother")
    join = client.post(
        f"/api/v1/invites/{code}/join", headers=other["headers"]
    )
    assert join.status_code == 200, join.text

    # Other user joins the channel
    join_ch = client.post(
        f"/api/v1/channels/{channel_id}/join", headers=other["headers"]
    )
    assert join_ch.status_code == 200, join_ch.text

    # Owner: 3 check-ins. Other: 1 check-in.
    for _ in range(3):
        r = client.post(
            f"/api/v1/channels/{channel_id}/checkins",
            headers=owner["headers"],
            json={"value": 1.0},
        )
        assert r.status_code == 200, r.text

    r = client.post(
        f"/api/v1/channels/{channel_id}/checkins",
        headers=other["headers"],
        json={"value": 1.0},
    )
    assert r.status_code == 200, r.text

    resp = client.get(
        f"/api/v1/channels/{channel_id}/leaderboard", headers=owner["headers"]
    )
    assert resp.status_code == 200, resp.text
    rows = resp.json()
    assert len(rows) == 2
    assert rows[0]["username"] == owner["username"]
    assert rows[0]["checkin_count"] == 3
    assert rows[0]["rank"] == 1
    assert rows[1]["username"] == other["username"]
    assert rows[1]["checkin_count"] == 1
    assert rows[1]["rank"] == 2
