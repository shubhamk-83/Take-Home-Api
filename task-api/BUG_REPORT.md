# Bug Report: Pagination Skips the First Page of Results

Location: `src/services/taskService.js`, `getPaginated()`

Severity: Medium. Pagination was shifted forward by one page, so page 1 quietly dropped the first `limit` tasks.

## What was going wrong

The API uses one-based pagination (page 1 is the first page), but `getPaginated()` calculated the offset as if pages started at 0. So `GET /tasks?page=1&limit=10` began at the 11th task instead of the 1st.

For example, with enough tasks to fill multiple pages, the results looked like this:

| Request | Expected | Actual (before fix) |
|---|---|---|
| `GET /tasks?page=1&limit=10` | Tasks 1-10 | Tasks 11-20 |
| `GET /tasks?page=2&limit=10` | Tasks 11-20 | Tasks 21-30 |

With smaller datasets, the later pages could simply come back empty. Either way, the first page could never be reached correctly.

## Root cause

Page numbers start at 1, but array indexes start at 0. The original code used the page number directly:

```js
const offset = page * limit;   // page=1, limit=10 -> offset 10 (wrong)