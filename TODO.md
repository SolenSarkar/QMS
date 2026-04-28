# ✅ COMPLETED: Auto-mark test as 0 when time expires (unless permit deleted by admin)

## Task Analysis
When a student's test time expires and they haven't submitted answers, automatically mark the test with 0 score and set the review accordingly. BUT if the admin has deleted the permit for that question paper, do NOT mark it as 0 (student shouldn't be penalized for a removed permit).

## Implementation Summary - ALL COMPLETE ✅

### 1. Backend — `backend/server.js` ✅
- `TestRecord` schema includes:
  - `isAutoSubmitted: { type: Boolean, default: false }`
  - `status: { type: String, default: 'completed' }`
- New endpoint: `GET /api/question-paper-permits/check/:permitId` → returns `{ exists: boolean }`
- `POST /api/test-records` accepts `isAutoSubmitted` from JSON payload

### 2. Frontend — `src/StudentDashboard.jsx` ✅
- `handleTimeExpired()` (called when timer hits 0):
  1. Calls `/api/question-paper-permits/check/:permitId`
  2. If permit deleted → shows toast "Test closed without penalty" + closes test without saving
  3. If permit exists → calls `handleSubmitTest(true)` to auto-submit with 0 score
- `handleSubmitTest(isAutoSubmit = false)` accepts optional flag
- JSON payload includes `isAutoSubmitted: isAutoSubmit`

### 3. Admin Results — `src/Results.jsx` ✅
- Orange "Auto-Submitted" badge displayed next to student name in results table when `record.isAutoSubmitted === true`

## Files Changed
- `src/StudentDashboard.jsx` — Timer expiry logic, permit check, auto-submit with flag
- `src/Results.jsx` — Visual indicator for auto-submitted tests
- `backend/server.js` — Schema fields + permit check endpoint

## How It Works
| Scenario | Behavior |
|----------|----------|
| Timer expires + permit still exists | Auto-submits with score 0, `isAutoSubmitted: true` |
| Timer expires + permit deleted by admin | Test closes, no record saved, no penalty |
| Student manually submits | Normal submission, `isAutoSubmitted: false` (default) |

