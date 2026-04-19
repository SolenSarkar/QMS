# Fix: Questions Not Showing in Admin Panel

## Approved Plan Steps:

### 1. ✅ Create TODO.md (Done)

### 2. ✅ Backend/server.js - Fix ObjectId filtering in GET /api/questions  
   - Parse query params classId/subjectId to mongoose.Types.ObjectId ✓  
   - Add console logging for queries and results ✓  
   - POST endpoint logging + ObjectId conversion ✓

### 3. ✅ Frontend/src/Questions.jsx - Improve data fetching & error handling  
   - Replace optimistic updates with refetch after POST/DELETE success ✓  
   - Add try-catch + toast error notifications ✓  
   - Add console logs for debugging ✓  
   - Fixed both main handler and AddQuestionPopup ✓

### 4. 🧪 Test API endpoints
- Restart backend server: `cd backend && node server.js`
- Test GET /api/questions?classId=...&subjectId=...
- Test in frontend admin panel

### 5. 🧪 Frontend testing
- Navigate to Admin → Questions
- Add new question → verify appears after refetch
- Delete question → verify disappears

### 6. ✅ Deploy & final verification

---

**Next Step: Test backend API + frontend functionality**

- Create/run test script to verify questions API
- Check if questions exist in DB for selected class/subject

---

**Next Step: Edit src/Questions.jsx**

- Replace optimistic updates with refetch after POST/DELETE success
- Add try-catch + toast error notifications
- Add console logs for debugging

### 4. 🧪 Test API endpoints
- Create/run test script to verify questions API
- Check if questions exist in DB for selected class/subject

### 5. 🧪 Frontend testing
- Navigate to Admin → Questions
- Add new question → verify it appears after refetch
- Delete question → verify it disappears

### 6. ✅ Deploy & final verification
- Push to Vercel/Render
- Test live admin panel

---

**Next Step: Edit backend/server.js**

