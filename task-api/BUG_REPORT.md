# Bug Report: Pagination Skips the First Page of Results

Location: `src/services/taskService.js`, `getPaginated()`

Severity: Medium. Pagination was shifted forward by one page, so page 1 skipped the first `limit` tasks.

## What was going wrong

The API uses one-based pagination (page 1 is the first page), but `getPaginated()` calculated the offset as if pages started at 0. So `GET /tasks?page=1&limit=10` began at the 11th task instead of the 1st.

For example, with enough tasks to fill multiple pages, the results looked like this:

| Request | Expected | Actual (before fix) |
|---|---|---|
| `GET /tasks?page=1&limit=10` | Tasks 1-10 | Tasks 11-20 |
| `GET /tasks?page=2&limit=10` | Tasks 11-20 | Tasks 21-30 |

With smaller datasets, later pages could simply come back empty. Either way, the first page could not be reached correctly.

## Root cause

Page numbers start at 1, but array indexes start at 0. The original code used the page number directly:

    const offset = page * limit; // page=1, limit=10 -> offset 10 (wrong)

## Fix

The offset was changed to:

    const offset = (page - 1) * limit; // page=1, limit=10 -> offset 0 (correct)

Subtracting 1 converts the one-based page number into the correct zero-based array offset.

## How I found it

I wrote a test that creates 12 tasks and requests page 1 with `limit=10`. The original implementation returned the wrong set of tasks, which exposed the pagination issue.

## Regression tests

The fix is covered at two levels:

- `tests/taskService.test.js` tests the pagination logic directly.
- `tests/tasks.test.js` tests pagination through the API.

The full test suite completed with 39 tests passed and 0 failed.

| Statements | Branches | Functions | Lines |
|---|---|---|---|
| 95.45% | 89.53% | 93.33% | 95% |

---

# Feature: Task Assignment

## Endpoint

`PATCH /tasks/:id/assign`

Request body:

    {
      "assignee": "Shubham"
    }

## How it behaves

| Case | Result |
|---|---|
| Valid string | Task is updated, and the name is trimmed before saving |
| Missing, empty (`""`) or whitespace-only (`"   "`) assignee | `400 Bad Request` |
| Non-string assignee | `400 Bad Request` |
| Task doesn't exist | `404 Not Found` |
| Task already assigned | Allowed and reassigned |

## Reassignment decision

I decided to allow reassignment, so a task assigned to one user can later be assigned to another. The assignment does not specify that assignments must be permanent, so reassignment keeps the behavior simple and practical.

If the requirements change later and assignments need to be locked, this can be handled in the service layer.

## Tests

The endpoint is covered by tests for:

- Successful assignment
- Missing assignee
- Empty assignee
- Whitespace-only assignee
- Invalid assignee type
- Nonexistent task
- Reassignment

## Scope

I followed the existing route and service structure and avoided unrelated changes to the codebase.