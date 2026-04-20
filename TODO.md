# Fix 401 Login Error - Student Roll 07

## Steps:
- [ ] 1. Check current students: \`node backend/test_students.js\`
- [ ] 2. Create test student if missing: \`node backend/create_test_student_07.js\` 
- [ ] 3. Activate student 07: \`node backend/activate_student_07.js\`
- [ ] 4. Test login against Render: Update test_login_api.js to Render URL, \`node backend/test_login_api.js\`
- [ ] 5. Verify frontend login works

**Expected student data:**
- rollNumber: '07'
- name: 'SOLEN SARKAR'
- dateOfBirth: '30-10-2001'
- status: 'Active'
- classId: '6984cd3af7f0537e982f6753' (Class 7)
- boardId: '69837ab63543a682105bd51e' (ICSE)

Prod DB: mongodb+srv://...cluster0.../qms (scripts connect directly)

