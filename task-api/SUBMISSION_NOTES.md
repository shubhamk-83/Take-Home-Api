# Submission Notes

## What I would test next

If I had more time, I would add tests for:

- Malformed JSON requests and Express error responses
- Boundary values for pagination (`page=0`, negative values, zero/negative limits, and very large limits)
- Exact status-filter behavior for unsupported or partial status values
- Update attempts that include immutable fields such as `id` and `createdAt`
- Repeated completion of an already completed task
- Stricter ISO 8601 date validation if the API contract requires it
- Concurrent requests if the in-memory store were replaced with a persistent data store

## What surprised me

The codebase is intentionally small, but the lack of tests makes small assumptions important.

The pagination implementation is a good example. The route treats pages as one-based, while the service used the page number directly as an array offset. This caused page 1 to skip the first set of tasks.

## Questions I would ask before production

1. Should `PUT` be a true full replacement, or is the current partial-update behavior intentional?

2. Should task IDs, `createdAt`, and `completedAt` be immutable through the update endpoint?

3. Should status filtering require exact matches rather than partial matches?

4. What are the allowed ranges and validation rules for `page` and `limit`?

5. Is task reassignment always allowed, or should completed or already-assigned tasks have restrictions?

6. What persistence layer and concurrency guarantees are expected in production?

7. Should authentication and authorization determine who can create, update, assign, complete, and delete tasks?

8. What API error format and logging/observability requirements should clients and operators rely on?