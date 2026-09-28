const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

const createTask = async (overrides = {}) => {
  const response = await request(app)
    .post('/tasks')
    .send({ title: 'Test task', ...overrides });

  expect(response.status).toBe(201);
  return response.body;
};

describe('Task API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('returns all tasks', async () => {
      await createTask({ title: 'Task 1' });
      await createTask({ title: 'Task 2' });

      const response = await request(app).get('/tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('filters tasks by status', async () => {
      await createTask({ title: 'Todo', status: 'todo' });
      await createTask({ title: 'Done', status: 'done' });

      const response = await request(app).get('/tasks?status=todo');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('todo');
    });

    test('supports one-based pagination', async () => {
      for (let i = 1; i <= 12; i += 1) {
        await createTask({ title: `Task ${i}` });
      }

      const response = await request(app).get('/tasks?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
      expect(response.body[0].title).toBe('Task 1');
      expect(response.body[9].title).toBe('Task 10');
    });
  });

  describe('POST /tasks', () => {
    test('creates a task with supplied fields', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Write tests',
          description: 'Cover the API',
          priority: 'high',
          status: 'in_progress',
          dueDate: '2030-01-01T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        title: 'Write tests',
        description: 'Cover the API',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2030-01-01T00:00:00.000Z',
        completedAt: null,
      }));
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.createdAt).toEqual(expect.any(String));
    });

    test('applies defaults when optional fields are omitted', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Minimal task' });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('todo');
      expect(response.body.priority).toBe('medium');
      expect(response.body.description).toBe('');
      expect(response.body.dueDate).toBeNull();
    });

    test('rejects a missing or blank title', async () => {
      const missing = await request(app).post('/tasks').send({});
      const blank = await request(app).post('/tasks').send({ title: '   ' });

      expect(missing.status).toBe(400);
      expect(blank.status).toBe(400);
      expect(missing.body.error).toMatch(/title/i);
    });

    test('rejects invalid status, priority, and due date', async () => {
      const invalidStatus = await request(app)
        .post('/tasks')
        .send({ title: 'Task', status: 'invalid' });
      const invalidPriority = await request(app)
        .post('/tasks')
        .send({ title: 'Task', priority: 'urgent' });
      const invalidDate = await request(app)
        .post('/tasks')
        .send({ title: 'Task', dueDate: 'not-a-date' });

      expect(invalidStatus.status).toBe(400);
      expect(invalidPriority.status).toBe(400);
      expect(invalidDate.status).toBe(400);
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates an existing task', async () => {
      const task = await createTask({ priority: 'low' });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated task', priority: 'high' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated task');
      expect(response.body.priority).toBe('high');
    });

    test('returns 404 for an unknown task', async () => {
      const response = await request(app)
        .put('/tasks/missing-id')
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('rejects invalid update fields', async () => {
      const task = await createTask();

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes an existing task with 204', async () => {
      const task = await createTask();

      const response = await request(app).delete(`/tasks/${task.id}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      const list = await request(app).get('/tasks');
      expect(list.body).toHaveLength(0);
    });

    test('returns 404 for an unknown task', async () => {
      const response = await request(app).delete('/tasks/missing-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks a task as completed', async () => {
      const task = await createTask({ priority: 'high' });

      const response = await request(app).patch(`/tasks/${task.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).toEqual(expect.any(String));
    });

    test('returns 404 for an unknown task', async () => {
      const response = await request(app).patch('/tasks/missing-id/complete');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /tasks/stats', () => {
    test('returns status counts and overdue count', async () => {
      await createTask({ status: 'todo' });
      await createTask({ status: 'in_progress' });
      await createTask({ status: 'done' });
      await createTask({
        status: 'todo',
        dueDate: '2000-01-01T00:00:00.000Z',
      });

      const response = await request(app).get('/tasks/stats');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        todo: 2,
        in_progress: 1,
        done: 1,
        overdue: 1,
      });
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('assigns a task to a user', async () => {
      const task = await createTask({ title: 'Assign this' });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '  Shubham Kumar  ' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(task.id);
      expect(response.body.assignee).toBe('Shubham Kumar');
    });

    test('returns 404 when assigning a missing task', async () => {
      const response = await request(app)
        .patch('/tasks/missing-id/assign')
        .send({ assignee: 'Shubham' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test.each([
      [{}, 'missing assignee'],
      [{ assignee: '' }, 'empty assignee'],
      [{ assignee: '   ' }, 'whitespace assignee'],
      [{ assignee: 123 }, 'non-string assignee'],
      [{ assignee: null }, 'null assignee'],
    ])('rejects %s', async (body) => {
      const task = await createTask();

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/assignee/i);
    });

    test('allows reassignment to another user', async () => {
      const task = await createTask();

      await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'First User' });

      const response = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Second User' });

      expect(response.status).toBe(200);
      expect(response.body.assignee).toBe('Second User');
    });
  });
});
