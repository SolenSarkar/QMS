# Auto-Submit & Unanswered Zero Plan

## Steps
- [ ] 1. Edit `src/StudentDashboard.jsx`
  - Modify `handleTimeExpired` to always call `handleSubmitTest(true)` when time is up (remove early `closeTest()` on missing permit).
  - Ensure `isAutoSubmitted` is included in the FormData submission path inside `handleSubmitTest`.
  - Change `formatAnswer` in the review modal to return `'0'` instead of `'Not Answered'`.
- [ ] 2. Edit `src/Results.jsx`
  - Change `formatAnswer` in the admin review modal to return `'0'` instead of `'Not Answered'`.

