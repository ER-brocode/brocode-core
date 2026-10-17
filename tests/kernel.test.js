const test = require('node:test');
const assert = require('node:assert');
const { Engine } = require('../src/kernel/engine');

test('Engine initializes with default state', () => {
  const engine = new Engine();
  assert.strictEqual(engine.status, 'STOPPED');
  const health = engine.getHealth();
  assert.strictEqual(health.status, 'STOPPED');
});

test('Engine starts and stops correctly with lifecycle events', async () => {
  const engine = new Engine({ name: 'test-engine' });
  let startedFired = false;
  let stoppedFired = false;

  engine.on('started', () => { startedFired = true; });
  engine.on('stopped', () => { stoppedFired = true; });

  await engine.start();
  assert.strictEqual(engine.status, 'RUNNING');
  assert.strictEqual(startedFired, true);

  await engine.stop();
  assert.strictEqual(engine.status, 'STOPPED');
  assert.strictEqual(stoppedFired, true);
});

test('Engine returns system memory and runtime metrics', async () => {
  const engine = new Engine({ name: 'metrics-engine' });
  await engine.start();
  const metrics = engine.getMetrics();

  assert.strictEqual(metrics.status, 'RUNNING');
  assert.strictEqual(metrics.engine, 'metrics-engine');
  assert.strictEqual(typeof metrics.uptimeSeconds, 'number');
  assert.strictEqual(typeof metrics.memory.heapUsedMB, 'number');
  assert.ok(metrics.memory.heapUsedMB > 0);

  await engine.stop();
});
