# TODO - Performance Section in Side Panel

## Task
Add a performance section to the narrow side panel showing:
- Average score including all subject marks
- Percentage bar showing all subjects with their scores
- Highlight best performing subjects

## Steps
1. [x] Read and understand SidePanel.jsx and StudentDashboard.jsx
2. [x] Update SidePanel.jsx to accept performance data props (optional reusable component)
3. [x] Add performance section UI with average score and percentage bars in StudentDashboard
4. [x] Update StudentDashboard.jsx to calculate and pass performance data to SidePanel
5. [x] Test the implementation

## Implementation Details
- Added performance section to the dashboard-side-panel in StudentDashboard
- Calculates subject-wise performance from testRecords
- Shows average score with color-coded percentage bar
- Displays individual subject scores with percentage bars
- Highlights best performing subjects (70%+ score) with badges
- Only displays when student has attempted tests (testRecords.length > 0)

