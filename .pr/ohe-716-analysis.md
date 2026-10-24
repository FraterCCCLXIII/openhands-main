# OHE-716 Analysis: Monitoring Tasks UI Tab

**Issue:** OHE-716 - [Design] Create a separate UI tab for monitoring tasks
**Status:** Ready for QA (reported as STUCK - 3 months since Jul 2026)
**Analysis Date:** October 24, 2026

---

## Executive Summary

**Implementation Status: ✅ COMPLETE**

The Monitoring Tasks UI Tab feature is **fully implemented and functional**. It was created as part of the initial frontend port (commit `1c239d73a9` on April 24, 2026) and has been refined through multiple subsequent commits.

**Recommendation:** **Close as DONE** - The feature is complete, accessible, and tested.

---

## Technical Implementation

### Files Implemented

| File | Purpose | Status |
|------|---------|--------|
| `src/routes/task-list-tab.tsx` | Main TaskListTab component | ✅ Complete |
| `src/hooks/use-task-list.ts` | Hook to extract task list from events | ✅ Complete |
| `src/components/features/chat/task-tracking/task-item.tsx` | Individual task item rendering | ✅ Complete |
| `__tests__/routes/task-list-tab.test.tsx` | Component tests | ✅ 8 test cases |
| `__tests__/hooks/use-task-list.test.ts` | Hook tests | ✅ 7 test cases |

### UI Accessibility

The task list tab is **conditionally visible** in the right panel tab bar. It appears:
- When a conversation contains `TaskTrackerObservation` events with `command: "plan"`
- After the "Files" and "Commits" tabs (position index 2)
- With a double-checkmark icon (`DoubleCheckIcon`)

**Key Code Reference** (`conversation-tabs.tsx` lines 151-162):
```typescript
if (hasTaskList) {
  // Insert after the file-related tabs.
  tabs.splice(2, 0, {
    tabValue: "tasklist",
    isActive: isTabActive("tasklist"),
    icon: DoubleCheckIcon,
    onClick: () => selectTab("tasklist"),
    // ...
  });
}
```

### Feature Behavior

1. **Empty State:** Shows "No tasks yet" message with a check-circle icon when no tasks exist
2. **Task Display:** Lists all tasks from the most recent `TaskTrackerObservation` event
3. **Status Indicators:**
   - Todo: Circle outline icon, contrast text
   - In Progress: Half-filled circle icon, contrast text, raised background
   - Done: Filled check icon, muted text
4. **Task Notes:** Displayed below task title when present

### i18n Support

All UI strings are fully internationalized:
- `COMMON$TASK_LIST` - Tab label
- `COMMON$NO_TASKS` - Empty state message
- `TASK_TRACKING_OBSERVATION$TASK_NOTES` - Notes prefix

---

## Why This May Have Appeared "Stuck"

### Likely Reasons for QA Delay

1. **Conditional Visibility:** The tab only appears when task tracking events exist in a conversation. QA may not have realized they need to run a conversation that produces `TaskTrackerObservation` events.

2. **Event Dependency:** Requires the agent to use the `task_tracker` tool with `command: "plan"`. Not all agents or configurations produce these events.

3. **Misunderstanding of Scope:** The tab monitors *agent task tracking*, not user-defined to-do lists. It's read-only and reflects the agent's internal task decomposition.

### Test Coverage Verification

The tests demonstrate the feature works correctly:
- Empty state renders properly
- Tasks display with correct status icons
- In-progress tasks are highlighted
- Notes display when present
- Latest plan event is used when multiple exist

---

## How to Verify the Feature

### Prerequisites
1. Start a conversation with an agent configured to use task tracking
2. Give the agent a multi-step task (e.g., "Create a simple web server with tests")
3. The agent should produce `TaskTrackerObservation` events

### Expected Behavior
1. After task tracking events appear, a "Task List" tab should appear in the right panel
2. Clicking it shows the current task breakdown
3. Tasks should show appropriate status icons
4. In-progress task should have raised background

---

## Conclusion

**The feature is fully implemented.** No code changes are required.

The 3-month "stuck" status is likely due to:
- Conditional visibility requiring specific agent behavior
- QA setup not producing task tracking events
- Potential documentation gap about how to trigger the feature

**Action Items:**
1. Close OHE-716 as complete
2. Consider adding user documentation about task tracking visibility conditions
3. Optionally add a tooltip explaining when the tab appears

---

## Screenshots

*Note: Screenshots could not be captured in this analysis environment. To capture:*
1. Run a dev stack: `npm run dev`
2. Start a conversation with task tracking enabled
3. Screenshot the right panel showing the Task List tab

---

## Commit History

```
380fd839d6 - refactor(shadcn-lint): agentic linting
8e90704a51 - chore: remove redundant styling assertions
f37cd5bd17 - Improve UI consistency: themes, tokens
e1f5a6662f - design: cool-grey palette, runtime theme switcher
8bfae71939 - Namespace library i18n resources
1c239d73a9 - Port OpenHands frontend (INITIAL IMPLEMENTATION)
```
