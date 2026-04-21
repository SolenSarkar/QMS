# QMS Project TODO

## Previous Task: Fix \"Cannot GET /api/students/login\"
- [x] Plan approved by user
- [x] Create TODO.md with steps
- [x] Edit backend/server.js to add GET /api/students/login handler (405 Method Not Allowed)
- [x] Test GET request returns 405 (not 404)
- [x] Verify POST login still works via frontend
- [x] Restart server and test full flow
- [x] attempt_completion

## Current Task: Fix \"Cast to ObjectId failed for value \\\"login\\\" at path \\\"_id\\\" for model \\\"Student\\\"\"
**Status: ✅ COMPLETED**

### Steps Completed:
- [x] Step 1: Create/update TODO.md with detailed plan
- [x] Step 2: Add ObjectId validation helper function to backend/server.js  
- [x] Step 3: Wrap all Student :id routes (GET/PUT/DELETE/status/score) with validation in backend/server.js
- [x] Step 4: Apply same changes to backend/fixed_server.js
- [x] Step 5: Test invalid ID returns 400, valid IDs work normally (`node backend/test_students.js` shows students, curl tests confirm 405/400)
- [x] Step 6: Verify frontend login/user management unaffected
- [x] Step 7: Server ready with protection against invalid ObjectIds like \"login\"

**Root Cause Fixed**: Added `validateObjectId(id)` to all `/api/students/:id` routes. Invalid IDs (e.g. \"login\") now return clean 400 error instead of MongoDB CastError.

**Validation Coverage**:
- GET /api/students/:id
- PUT /api/students/:id  
- DELETE /api/students/:id
- PUT /api/students/:id/status
- PUT /api/students/:id/score

Login (`/api/students/login`) unchanged (uses rollNumber, not _id).

**Next Steps**: Deploy changes, test production. No further action needed.

