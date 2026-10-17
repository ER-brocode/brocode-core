const test = require('node:test');
const assert = require('node:assert');
const { TaskScheduler } = require('../src/orchestration/scheduler');

test('TaskScheduler registers and executes tasks', async () => {
  const scheduler = new TaskScheduler();
  scheduler.registerTask('compute', async ({ a, b }) => a + b);

  const result = await scheduler.runTask('compute', { a: 10, b: 20 });
  assert.strictEqual(result, 30);

  const tasks = scheduler.listTasks();
  assert.strictEqual(tasks.length, 1);
  assert.strictEqual(tasks[0].id, 'compute');
  assert.strictEqual(tasks[0].runCount, 1);
});

test('TaskScheduler throws error on duplicate task registration or missing task', async () => {
  const scheduler = new TaskScheduler();
  scheduler.registerTask('task1', () => true);

  assert.throws(() => scheduler.registerTask('task1', () => false), /already registered/);
  await assert.rejects(() => scheduler.runTask('non-existent'), /not found/);
});
