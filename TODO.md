# TODO: Auto-mark test as 0 when time expires (unless permit deleted by admin)

## Task Analysis
When a student's test time expires and they haven't submitted answers, automatically mark the test with 0 score and set the review accordingly. BUT if the admin has deleted the permit for that question paper, do NOT mark it as 0 (student shouldn't be penalized for a removed permit).

## Implementation Plan - COMPLETED ✅

### Step 1: Backend - Add auto-submitted flag to TestRecord schema ✅
- `isAutoSubmitted` boolean field (default: false) - ALREADY EXISTS in backend/server.js
- `status` field - ALREADY EXISTS in backend/server.js

### Step 2: Backend - Add permit existence check API ✅
- GET /api/question-paper-permits/check/:permitId endpoint - ALREADY EXISTS in backend/server.js

### Step 3: Frontend (StudentDashboard.jsx) - Auto-submit on timer expiry with permit check ✅
- Added `handleTimeExpired` function that:
  1. Calls permit check API to verify permit still exists
  2. If permit deleted → closes test without saving, shows toast "Test closed without penalty"
  3. If permit exists → auto-submits test with `isAutoSubmitted: true`
- Modified `handleSubmitTest` to accept `isAutoSubmit` parameter
- Added `isAutoSubmitted: isAutoSubmit` to JSON submission payload

### Step 4: Results.jsx - Show auto-submitted status ✅
- Added orange "Auto-Submitted" badge next to student name in results table

## Changes Made
1. `src/StudentDashboard.jsx` - Timer expiry logic, permit check, auto-submit with flag
2. `src/Results.jsx` - Visual indicator for auto-submitted tests
3. `backend/server.js` - Already had required schema and API (no changes needed)

