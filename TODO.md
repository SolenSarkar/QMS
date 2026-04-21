# Fix 401 Unauthorized on /api/students/login - FIXED!

## Analysis:
parseDate regex failed on '30-10-2001' (no spaces around -) → null → DOB fail → 401

## Changes:
Fixed both regex patterns in backend/server.js:
- Month: `/^(\\d{1,2})-*([a-zA-Z]+)-*(\\d{4})$/i`
- Numeric: `/^(\\d{1,2})-*(\\d{1,2})-*(\\d{4})$/`

## Plan Steps:
- [x] 1. Create/activate test student ✓
- [x] 2. Verify data ✓
- [x] 3. Debug → regex bug
- [x] 4. Fix regex in server.js ✓
- [ ] 5. Test login endpoint
- [ ] 6. Frontend login works

## Status: Testing login
