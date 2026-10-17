class TaskScheduler {
  constructor() {
    this.tasks = new Map();
  }

  registerTask(taskId, taskFn) {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task ${taskId} already registered`);
    }
    this.tasks.set(taskId, {
      id: taskId,
      fn: taskFn,
      runCount: 0,
      lastRunAt: null
    });
  }

  async runTask(taskId, context = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    task.runCount += 1;
    task.lastRunAt = new Date().toISOString();
    return await task.fn(context);
  }

  listTasks() {
    return Array.from(this.tasks.values()).map(({ id, runCount, lastRunAt }) => ({
      id,
      runCount,
      lastRunAt
    }));
  }
}

module.exports = { TaskScheduler };
