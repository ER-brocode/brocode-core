const test = require('node:test');
const assert = require('node:assert');
const { CircuitBreaker } = require('../src/resilience/circuit-breaker');

test('CircuitBreaker stays CLOSED on successful calls', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2 });
  const result = await breaker.execute(() => 'success');
  assert.strictEqual(result, 'success');
  assert.strictEqual(breaker.getState(), 'CLOSED');
});

test('CircuitBreaker trips to OPEN after reaching threshold', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 100 });
  const failingOp = () => { throw new Error('failure'); };

  await assert.rejects(() => breaker.execute(failingOp));
  assert.strictEqual(breaker.getState(), 'CLOSED');

  await assert.rejects(() => breaker.execute(failingOp));
  assert.strictEqual(breaker.getState(), 'OPEN');

  await assert.rejects(
    () => breaker.execute(() => 'wont run'),
    /CircuitBreaker is OPEN/
  );
});
