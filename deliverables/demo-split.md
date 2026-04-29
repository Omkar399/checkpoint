---
title: Checkpoint — Demo Split
subtitle: Anmol & Omkar
date: April 28, 2026
geometry: margin=0.9in
fontsize: 11pt
---

# Demo flow & feature split

~10 minutes, single account (`demo@example.com`) in one browser tab.
**Anmol opens** by setting up the world — auth, app shell, server, invites,
channel creation. **Omkar takes over** to actually use it: check-ins,
real-time, Coach Bot, leaderboard.

\bigskip

## Anmol — set up the world

1. **Auth + Mission Control dashboard**
   Split-screen login with the live product preview pane; sign in. Land on
   the dashboard: greeting, **Coach Bot quote card** with 100 attributed
   quotes (Marcus Aurelius, Seneca, Confucius, etc.) that rotate every five
   minutes plus a cycle button. Today's progress ring, pending check-in
   list, stats bento, week pulse, year heatmap.

2. **Sidebar + servers**
   Discord-style server rail with a sliding green indicator pill — channel
   column slides in only when you pick a server. Walk through the seeded
   servers (Run, College, Social), then create a fresh server live to
   show the create-server dialog and the new tile dropping into the
   library grid.

3. **Invites + welcome-on-join**
   Open the invite dialog on the new server: generate an invite with
   optional max-uses + expiry, copy the share URL. Explain the
   invite-accept flow triggers a Coach Bot **welcome message** on the
   server's first channel — point at the welcome cards already visible
   on the seeded servers as examples.

4. **Channel kinds (creation)**
   Open the create-channel dialog. Walk through the four shapes a
   channel can take: **numeric** (km, minutes), **binary** (done / not
   done), **freeform** (note-only), and **checklist** with per-item
   types — binary checkboxes mixed with numeric inputs in the same
   channel (e.g. morning routine: [x] made bed, [x] stretched,
   # meditation 30 min). Build a mixed checklist live. **Hand off to
   Omkar — channel ready, time to use it.**

\bigskip

## Omkar — use the channel

1. **Check-in flow across kinds**
   Live demo on the seeded channels: log a 5 km run on `#Daily running`,
   mark `#garbage-day` done, tick a few `#midterm-daa` chapters in the
   mixed checklist, write a freeform reflection. Cards adapt per kind —
   numeric value, "Marked done" pill, chapter list with strikethroughs,
   note-only entry. Streak badge warms with length (gray to amber to
   green-glow at 30+); daily dashboard pills light green for today's
   done members.

2. **Real-time round-trip & feed dynamics**
   Type a chat message in the composer and send — it lands in the feed
   instantly via WebSocket (no refresh, no polling). Add an emoji
   reaction to a check-in card; the pill updates live with the
   reacted-by-me highlight. Toggle the **Today / All time filter** at
   the top of the feed; auto-scroll-to-bottom kicks in. Sonner toast
   fires on success.

3. **Coach Bot in the feed + scheduler**
   Walk through the **CoachMessage cards** already threaded into the
   feed (every channel has 7-9 — welcomes, daily summaries, inactivity
   nudges). Show the parsing: progress bar from "X of Y members in",
   flame pill for top streak, amber card for nudges, mention pills.
   APScheduler crons fire automatically — daily summary 21:00 UTC,
   nudges 09:00 UTC, welcome on invite-accept (Anmol's flow). On the
   **Today** filter the most recent summary stays pinned at the top.

4. **Leaderboard, profile, year heatmap**
   Right-rail monthly leaderboard ranks members; gold/silver/bronze for
   the top three. Click a peer (e.g. anmol) — profile dialog with
   avatar, joined date, and a year-long activity heatmap scoped to the
   channel. Compare with demo's heatmap, then back to the **dashboard
   year heatmap** for the global view.

\bigskip

## Cheat sheet

- **Demo login:** `demo@example.com` / `demo1234`
- **Servers seeded:** Run, College, Social
- **Channels covering all kinds:** `#Daily running` (numeric), `#midterm-daa`
  (mixed checklist), `#garbage-day` (binary), plus four more
- **Each channel has 7-9 Coach Bot messages** — pick any to point at
- **Hard-refresh** if anything looks stale: Cmd-Shift-R
