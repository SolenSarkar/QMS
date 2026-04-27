# TODO - Fix TestCard Counts

## Plan
- [x] Step 1: Fix `backend/server.js` `/api/test-records-summary/:studentId` to correctly count total, completed, and pending tests
- [x] Step 2: Fixed corrupted `backend/server.js` file (restored missing routes: `/api/students/class/:classId`, `/api/students/board/:boardId`, `/api/test-records/:studentId`)
- [x] Step 3: Backend fix verified - syntax check passed

## Summary of Changes

### `backend/server.js` - `/api/test-records-summary/:studentId` (FIXED)
**Problem:** The `completed` count was incorrectly filtering to only tests for papers with active permits, and `pending` was calculated as `total - completed` using this wrong count. This caused incorrect display like "Total=1, Completed=1, Pending=0" when a test was taken for an expired paper.

**Root Cause:** 
- Old code: `completed = TestRecord.countDocuments({ studentId, questionPaperId: { $in: activePermitPaperIds } })`
- This missed tests taken for expired papers, making `completed` appear lower than actual.

**Fix:**
1. `completed`: Count ALL test records for the student (regardless of permit status) via `TestRecord.find({ studentId })`
2. `pending`: Count available papers (with active permits) that have NOT been attempted yet by comparing `availablePaperIds` vs `attemptedPaperIds`
3. `total`: Total available papers with active permits (unchanged logic)

This ensures accurate counts:
- If 1 test available, 1 completed: **Total=1, Completed=1, Pending=0**
- If 1 test available, 0 completed: **Total=1, Completed=0, Pending=1**
- If 0 tests available, 2 completed (expired): **Total=0, Completed=2, Pending=0**

