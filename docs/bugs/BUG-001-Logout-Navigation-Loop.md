# BUG-001 — Logout Navigation Loop

## Status

Open

## Priority

High (Non-blocking for feature development)

## First Observed

June 2026

---

# Summary

The application functions correctly until the user logs out.

Immediately after logout, authentication state is cleared successfully, but React Navigation enters an infinite update loop resulting in:

Maximum update depth exceeded

---

# Current Behaviour

Owner Login
↓

Owner Dashboard
↓

Logout
↓

Authentication cleared
↓

Navigation begins
↓

Infinite update loop

↓

Application crashes

---

# What Works

✅ Owner setup

✅ Owner login

✅ Worker login

✅ Session restore

✅ SecureStore

✅ Session invalidation

✅ Splash routing

✅ Role selection

---

# Known Errors

## Error 1 (Resolved)

The action 'REPLACE' with payload { name: 'index' } was not handled by any navigator.

Resolution:
Removed router.replace("/") from LogoutButton.

Status:
Fixed.

---

## Error 2 (Current)

Maximum update depth exceeded

Occurs immediately after logout.

Stack trace points into:

- React Navigation
- Expo Router
- useSyncState()
- StackClient

---

# Investigation Summary

Investigated:

- AuthContext
- LogoutButton
- Splash Screen
- Session Restore
- SecureStore
- Router configuration
- Owner Layout
- Worker Layout
- useRequireAuth()

No single component was found to be solely responsible.

Issue appears to originate from interaction between:

- Expo Router
- React Navigation
- Authentication state transition
- Protected layouts

---

# Files Investigated

app/\_layout.tsx

app/index.tsx

app/(owner)/\_layout.tsx

app/(worker)/\_layout.tsx

hooks/useRequireAuth.tsx

context/AuthContext.tsx

components/auth/LogoutButton.tsx

---

# Fixes Attempted

Attempt 1

Removed router.replace("/") from LogoutButton

Result:

✅ Removed navigation REPLACE error

❌ Maximum update depth remained

---

Attempt 2

Prevent duplicate redirects inside useRequireAuth

Result:

No improvement

---

Attempt 3

Investigated AuthContext

Result:

No recursive state updates found

---

# Remaining Hypothesis

The issue likely results from a navigation lifecycle interaction between:

AuthProvider

↓

Protected Layout

↓

Expo Router

↓

React Navigation state synchronization

↓

Repeated layout effects

rather than a simple application logic bug.

---

# Recommendation

Pause investigation.

Continue feature development.

Return after V8.6 feature completion with a focused reproduction.

Avoid further architectural changes until a reproducible minimal example is created.

---

# Current Project Status

Authentication System:
≈95% complete

Remaining issue:
Logout navigation loop only.
