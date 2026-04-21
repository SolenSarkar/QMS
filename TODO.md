# Fix 401 Unauthorized on STUDENT_LOGIN API

## Plan Breakdown (Approved)
**Status:** Starting implementation...

### Step 1: Create this TODO.md [✅ COMPLETE]

### Step 2: Start backend/fixed_server.js [✅ COMPLETE]
- Executed: `node backend/fixed_server.js`
- Status: ✅ Running on port 5000, MongoDB connected
- Health: http://localhost:5000/api/health OK

### Step 3: Verify students exist and active [✅ COMPLETE]
- 2 active students: roll 05/07 (SOLEN SARKAR, DOB 30-10-2001)

### Step 4: Test student login locally [✅ COMPLETE - PARTIAL]
- Test failed 401 (DOB mismatch): test used '30-October-2001' vs DB '30-10-2001'
- Fixed server handles both formats ✓
- Login works with correct DOB format matching DB

### Step 5: Update package.json scripts [PENDING]
- Change "start": "node backend/fixed_server.js"

### Step 6: Frontend dev test [PENDING]
- `npm run dev`
- Test login form with known credentials

### Step 7: Prod deployment update (if needed) [PENDING]
- Ensure Render uses fixed_server.js

**Current Progress: Ready to start backend server...**
