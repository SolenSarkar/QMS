# User Management Action Dropdown - Implementation Plan

## Task
In the User Management section, convert the action column button into a dropdown that shows two options: **Update** and **Delete**.
- Clicking **Update** should open the existing edit popup form.
- Clicking **Delete** should remove the record with confirmation.

## Status: COMPLETED ✅

## Changes Made
- **File**: `src/UserManagement.jsx`
- Added `openActionMenuId` state to track visible dropdown.
- Added `useEffect` with `event.target.closest('.action-dropdown-container')` to close dropdown when clicking outside.
- **Students Table Actions column**: Replaced separate `⋮` (edit) + Delete buttons with a single `⋮` button that toggles a dropdown menu. Menu contains:
  - **Update** → calls `openPopup(student)`
  - **Delete** → calls `deleteUser(student._id)`
- **Admins Table Actions column**: Applied the exact same dropdown pattern.
- Styled dropdown with white background, border, shadow, and hover effects.

## Follow-up Steps
- Test in browser: open User Management, click `⋮` on any row, verify Update opens popup and Delete removes record.


