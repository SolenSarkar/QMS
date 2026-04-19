# QMS Fix: Question Papers & Test Card Issues

## Plan Status: ✅ Approved

### Steps:
- [x] 1. Created backend/test_paper_permits.js to diagnose DB data  
- [x] 2. Ran diagnostic → Confirmed: Papers exist, **0 active permits**
- [x] 3. Created backend/seed_test_data.js 
- [x] 4. Ran seed → **✅ Added ACTIVE permit + test record**
- [ ] 5. Re-run diagnostic (expect Active:1, Records:2) 
- [ ] 6. **TEST: Login SOLEN 05** → My Test tab → ✅ Math paper + TestCard 2/2/0
- [x] 7. attempt_completion when verified

**Next: Test frontend (refresh app, login SOLEN rollno '05')**

