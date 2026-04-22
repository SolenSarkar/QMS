# Fix 401 Unauthorized - Diagnosis & Fix in progress

## Progress
- [x] Server running port 5000 ✓
- [x] Student 07: Active, DOB was '30-10-2001'
- [x] API test: 401 DOB mismatch (frontend sends month name)
- [ ] Fix DOB format + retest API
- [ ] Frontend test

**Root Cause:** DOB format mismatch (DB numeric vs frontend month name)

**Next:** Fix DB DOB → '30-October-2001'

