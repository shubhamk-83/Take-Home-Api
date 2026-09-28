# Task Manager API: Take-Home Assignment

A Node.js + Express REST API for managing tasks, with Jest and Supertest tests.

> **Note:** The project uses an in-memory data store, so all data resets whenever the server restarts.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Run](#run)
- [Testing](#testing)
- [API Endpoints](#api-endpoints)
- [Bug Fix](#bug-fix)
- [Documentation](#documentation)
- [Data Storage](#data-storage)

## Tech Stack

- Node.js
- Express.js
- Jest
- Supertest
- In-memory data store

## Setup

Install dependencies:

```bash
npm install
```

## Run

Start the API:

```bash
npm start
```

The API runs at:

```
http://localhost:3000
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

### Current Test Results

| Metric | Result |
| --- | --- |
| Tests passed | 39 |
| Tests failed | 0 |
| Statement coverage | 95.45% |
| Branch coverage | 89.53% |
| Function coverage | 93.33% |
| Line coverage | 95% |

### What the Tests Cover

- Unit tests for `taskService.js`
- Integration tests for task routes
- Happy-path scenarios
- Validation and edge cases
- Pagination behavior
- Task assignment and reassignment
- Missing task handling

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks?status=todo` | Filter tasks by status |
| GET | `/tasks?page=1&limit=10` | Paginate tasks |
| GET | `/tasks/stats` | Get task statistics |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| PATCH | `/tasks/:id/complete` | Mark a task as complete |
| PATCH | `/tasks/:id/assign` | Assign a task to someone |

**Supported statuses:** `todo`, `in_progress`, `done`

### Example Requests

Filter tasks by status:

```bash
curl "http://localhost:3000/tasks?status=in_progress"
```

Paginate tasks (page numbers start at 1):

```bash
curl "http://localhost:3000/tasks?page=1&limit=10"
```

Mark a task as complete:

```bash
curl -X PATCH http://localhost:3000/tasks/1/complete
```

Assign a task:

```bash
curl -X PATCH http://localhost:3000/tasks/1/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee": "Shubham"}'
```

### Task Assignment Rules

`PATCH /tasks/:id/assign` expects this request body:

```json
{
  "assignee": "Shubham"
}
```

Validation rules:

- `assignee` must be a string.
- Empty or whitespace-only values are rejected.
- A missing task returns `404 Not Found`.
- Reassigning an already-assigned task is allowed.

## Bug Fix

During testing, a pagination bug was found in `getPaginated()`.

The original implementation calculated the offset like this:

```js
const offset = page * limit;
```

Because the API uses one-based page numbers, page 1 skipped the first set of tasks. The fix:

```js
const offset = (page - 1) * limit;
```

Full details are in [`BUG_REPORT.md`](./BUG_REPORT.md).

## Documentation

| File | Contents |
| --- | --- |
| [`BUG_REPORT.md`](./BUG_REPORT.md) | Bug discovered, root cause, fix, and regression tests |
| [`SUBMISSION_NOTES.md`](./SUBMISSION_NOTES.md) | Additional testing ideas and production questions |

## Data Storage

The API intentionally uses an in-memory data store, so all tasks are lost when the server restarts.

A production system would need a persistent database and appropriate concurrency handling.