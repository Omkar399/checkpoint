# frontend-legacy (reference-only)

This is the original React 19 + Vite SPA. It has been retired in favor of the
Next.js app at `../frontend/`. **Do not run or deploy this.**

## Why it's kept

- Source of truth for the REST + WebSocket contracts until every surface is
  reimplemented in the Next.js app. See:
  - `src/api/*.js` — endpoint shapes
  - `src/hooks/useWebSocket.js` — WS + polling fallback
  - `src/context/AuthContext.jsx` — localStorage auth flow

- Reference for behavior when porting a specific feature (dashboard, check-in
  flow, heatmap, etc.). Read for logic, not for UI — the new frontend uses a
  different design system.

## When to delete

Safe to delete once the Next.js app reaches parity on all routes and the team
no longer needs a second opinion on API shapes. Until then, keep it around.
