const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create and retrieval', () => {
    test('creates a task with defaults and generated metadata', () => {
      const task = taskService.create({ title: 'Write tests' });

      expect(task).toEqual(expect.objectContaining({
        title: 'Write tests',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        completedAt: null,
      }));
      expect(typeof task.id).toBe('string');
      expect(() => new Date(task.createdAt).toISOString()).not.toThrow();
      expect(taskService.getAll()).toHaveLength(1);
    });

    test('finds a task by id and returns undefined for an unknown id', () => {
      const task = taskService.create({ title: 'Find me' });

      expect(taskService.findById(task.id)).toEqual(task);
      expect(taskService.findById('missing-id')).toBeUndefined();
    });

    test('returns a copy from getAll so the array itself cannot be mutated externally', () => {
      taskService.create({ title: 'Immutable list' });
      const tasks = taskService.getAll();

      tasks.pop();

      expect(taskService.getAll()).toHaveLength(1);
    });
  });

  describe('filtering and pagination', () => {
    test('filters tasks by status', () => {
      taskService.create({ title: 'Todo task', status: 'todo' });
      taskService.create({ title: 'Progress task', status: 'in_progress' });
      taskService.create({ title: 'Done task', status: 'done' });

      expect(taskService.getByStatus('todo')).toHaveLength(1);
      expect(taskService.getByStatus('todo')[0].title).toBe('Todo task');
    });

    test('returns the first page from page 1', () => {
      for (let i = 1; i <= 12; i += 1) {
        taskService.create({ title: `Task ${i}` });
      }

      const pageOne = taskService.getPaginated(1, 10);
      const pageTwo = taskService.getPaginated(2, 10);

      expect(pageOne).toHaveLength(10);
      expect(pageOne[0].title).toBe('Task 1');
      expect(pageOne[9].title).toBe('Task 10');
      expect(pageTwo).toHaveLength(2);
      expect(pageTwo[0].title).toBe('Task 11');
    });

    test('returns an empty page when the offset is past the end', () => {
      taskService.create({ title: 'Only task' });

      expect(taskService.getPaginated(3, 10)).toEqual([]);
    });
  });

  describe('update and deletion', () => {
    test('updates an existing task and preserves unspecified fields', () => {
      const task = taskService.create({
        title: 'Original',
        description: 'Keep this',
        priority: 'high',
      });

      const updated = taskService.update(task.id, { title: 'Updated' });

      expect(updated).toEqual(expect.objectContaining({
        id: task.id,
        title: 'Updated',
        description: 'Keep this',
        priority: 'high',
      }));
    });

    test('returns null when updating a missing task', () => {
      expect(taskService.update('missing-id', { title: 'Updated' })).toBeNull();
    });

    test('removes an existing task and reports false for a missing task', () => {
      const task = taskService.create({ title: 'Delete me' });

      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
      expect(taskService.remove(task.id)).toBe(false);
    });
  });

  describe('completion and assignment', () => {
    test('marks an existing task as done with a completion timestamp', () => {
      const task = taskService.create({ title: 'Complete me', priority: 'high' });

      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).toEqual(expect.any(String));
      expect(new Date(completed.completedAt).toString()).not.toBe('Invalid Date');
    });

    test('returns null when completing a missing task', () => {
      expect(taskService.completeTask('missing-id')).toBeNull();
    });

    test('assigns and trims an assignee name', () => {
      const task = taskService.create({ title: 'Assign me' });

      const updated = taskService.assignTask(task.id, '  Shubham Kumar  ');

      expect(updated.assignee).toBe('Shubham Kumar');
      expect(taskService.findById(task.id).assignee).toBe('Shubham Kumar');
    });

    test('allows reassignment of an existing task', () => {
      const task = taskService.create({ title: 'Reassign me' });

      taskService.assignTask(task.id, 'First User');
      const reassigned = taskService.assignTask(task.id, 'Second User');

      expect(reassigned.assignee).toBe('Second User');
    });

    test('returns null when assigning a missing task', () => {
      expect(taskService.assignTask('missing-id', 'Shubham')).toBeNull();
    });
  });

  describe('statistics', () => {
    test('counts statuses and overdue unfinished tasks', () => {
      taskService.create({ title: 'Todo', status: 'todo' });
      taskService.create({ title: 'Progress', status: 'in_progress' });
      taskService.create({ title: 'Done', status: 'done' });
      taskService.create({
        title: 'Overdue',
        status: 'todo',
        dueDate: '2000-01-01T00:00:00.000Z',
      });
      taskService.create({
        title: 'Completed overdue',
        status: 'done',
        dueDate: '2000-01-01T00:00:00.000Z',
      });

      expect(taskService.getStats()).toEqual({
        todo: 2,
        in_progress: 1,
        done: 2,
        overdue: 1,
      });
    });

    test('starts with zero counts', () => {
      expect(taskService.getStats()).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });
  });
});
