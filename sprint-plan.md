# Checkpoint — Sprint Plan

**Team:** 2
**Team Members:** Omkar Podey, Anmol Rastogi
**Course:** CS161
**Semester:** Spring 2026

---

## Overview

This document outlines the development plan for Checkpoint, a social accountability platform. The project is divided into three sprints, each building incrementally toward a complete MVP. Each sprint produces a functional, demonstrable deliverable.

---

## Sprint 1 — Foundation & Infrastructure

**Objective:** Establish the core platform — authentication, community structure, and real-time communication.

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| 1.1 | As a new user, I can register an account with email and password so that I have a persistent identity. | Must Have |
| 1.2 | As a registered user, I can log in and log out securely. | Must Have |
| 1.3 | As a logged-in user, I can create a Server with a name, description, and icon. | Must Have |
| 1.4 | As a Server Owner, I can generate a unique invite code so that others can join my server. | Must Have |
| 1.5 | As a user, I can enter an invite code to join an existing server. | Must Have |
| 1.6 | As a Server Owner, I can create channels within my server, each with a name, description, and a target unit (e.g., "Miles Run," "Pages Read," "Done/Not Done"). | Must Have |
| 1.7 | As a server member, I can join or leave specific channels within a server. | Must Have |
| 1.8 | As a channel member, I can send and receive text messages in real-time via WebSockets. | Must Have |
| 1.9 | As a user, I see a sidebar listing my servers and their channels for easy navigation. | Must Have |

### Technical Tasks

- Design and implement the database schema (Users, Servers, Channels, Messages, Memberships).
- Set up the backend API framework with RESTful endpoints for auth, servers, and channels.
- Implement WebSocket layer for real-time messaging with a polling fallback (10-second interval) for unreliable networks.
- Build the frontend layout: server sidebar, channel list panel, and message feed area.
- Implement JWT-based authentication with secure password hashing.

### Deliverable

A fully functional group chat application. Users can register, create and join servers via invite codes, create goal-oriented channels, and communicate in real-time.

### Definition of Done

- All user stories are implemented and manually tested.
- A user can complete the full onboarding flow: Register → Create Server → Generate Invite → Share Code → Second User Joins → Both Chat in Real-Time.
- Messages appear to other users within 500ms.

---

## Sprint 2 — Check-ins & Progress Tracking

**Objective:** Implement the core accountability feature — structured check-ins with data visualization.

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| 2.1 | As a channel member, I can post a structured Check-in by entering a value that matches the channel's target unit (e.g., "5 km") and an optional note. | Must Have |
| 2.2 | As a channel member, I can visually distinguish Check-in Cards from regular chat messages in the feed. | Must Have |
| 2.3 | As a server member, I can view a Daily Dashboard showing which members have checked in today (green) and who has not (gray). | Must Have |
| 2.4 | As a user, I can view any member's profile to see a Monthly/Yearly Heatmap of their check-in history. | Must Have |
| 2.5 | As a user, I can see my current streak count (consecutive days with a check-in) for each channel. | Should Have |
| 2.6 | As a server member, I can click on any user's avatar in the member list to view their profile and heatmap. | Must Have |
| 2.7 | As a non-member of a server, I am denied access to its channels and check-in data by the API. | Must Have |

### Technical Tasks

- Extend the database schema to include a Check-ins table (user, channel, value, note, server-side timestamp).
- Build API endpoints for creating, retrieving, and aggregating check-in data.
- Implement server-side timestamping for all check-ins to ensure data integrity.
- Design and build the Check-in Card UI component, visually distinct from standard chat bubbles.
- Build the Daily View dashboard component with per-member status indicators.
- Build the Heatmap component (GitHub-style calendar grid) for monthly and yearly views.
- Implement the member list panel with clickable profile modals.
- Add API-level authorization middleware to enforce server membership on all data endpoints.

### Deliverable

The application now supports its core differentiator: structured accountability tracking. Users can log check-ins against channel goals, and the group can visualize individual and collective progress over time.

### Definition of Done

- All user stories are implemented and manually tested.
- A user can complete the check-in flow: Navigate to Channel → Tap Check-in → Enter Value → Card Appears in Feed → Daily Dashboard Updates → Heatmap Reflects New Data.
- Check-in timestamps are generated server-side; client-submitted timestamps are ignored.
- API returns 403 Forbidden for any request to a server the user has not joined.

---

## Sprint 3 — Social, Gamification & Polish

**Objective:** Add engagement features, automate nudges, and prepare the application for final submission.

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| 3.1 | As a new server member, I receive an automated welcome message from the Coach Bot upon joining. | Must Have |
| 3.2 | As a server member, I see a daily summary message from the Coach Bot showing the server's check-in stats for the previous day. | Must Have |
| 3.3 | As a server member who has not checked in for 48 hours, I receive a nudge message from the Coach Bot. | Must Have |
| 3.4 | As a channel member, I can react to any check-in with an emoji to encourage my peers. | Should Have |
| 3.5 | As a channel member, I can view a Leaderboard ranking members by their total check-ins for the current month. | Should Have |
| 3.6 | As a member of a boolean ("Done/Not Done") channel, I can complete a One-Tap Check-in without entering a value. | Should Have |
| 3.7 | As a user, I see appropriate empty states and loading indicators throughout the application. | Must Have |

### Technical Tasks

- Implement the Coach Bot as a rule-based background service (cron job or scheduled task).
  - Welcome message trigger: fires on new membership creation.
  - Daily summary trigger: fires once per day per server, aggregates previous day's data.
  - Inactivity nudge trigger: fires for any user with no check-in in the last 48 hours.
- Build the emoji reaction system for check-in cards (data model, API, and UI).
- Build the Leaderboard component with monthly ranking logic.
- Implement the One-Tap Check-in shortcut for boolean-type channels.
- UI polish pass: loading skeletons, error toasts, empty state illustrations, and responsive layout adjustments.
- Conduct performance testing to validate <500ms latency and 50 concurrent users per server.
- End-to-end QA and bug fixes.

### Deliverable

A complete, polished MVP of Checkpoint ready for final demonstration. The application supports the full accountability lifecycle: onboarding, goal setting, daily check-ins, progress visualization, social encouragement, and automated nudging.

### Definition of Done

- All user stories are implemented and manually tested.
- Coach Bot successfully delivers welcome messages, daily summaries, and inactivity nudges without manual intervention.
- The application handles 50 concurrent users per server with message latency under 500ms.
- No critical or high-severity bugs remain open.
- The application is deployed and accessible via a public URL for demonstration.

---

## Sprint Summary

| Sprint | Focus | Key Outcome |
|--------|-------|-------------|
| Sprint 1 | Foundation & Infrastructure | Working group chat with servers, channels, and real-time messaging. |
| Sprint 2 | Check-ins & Progress Tracking | Structured check-ins, daily dashboards, and heatmap visualizations. |
| Sprint 3 | Social, Gamification & Polish | Coach Bot, leaderboards, reactions, and submission-ready polish. |

---

## Risk Mitigation Across Sprints

| Risk | Sprint | Mitigation |
|------|--------|------------|
| WebSocket reliability on campus Wi-Fi | 1 | Implement polling fallback from day one. |
| Check-in friction causing user drop-off | 2 | Design minimal-click check-in flow; add One-Tap in Sprint 3. |
| Empty server syndrome | 3 | Coach Bot auto-welcomes and prompts first check-in. |
| Scope creep | All | Features out of scope (mobile apps, voice/video, payments, AI coaching, public discovery) are deferred to future versions. |
