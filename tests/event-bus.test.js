const test = require('node:test');
const assert = require('node:assert');
const { EventBus } = require('../src/events/event-bus');

test('EventBus publishes and delivers messages to listeners', async () => {
  const bus = new EventBus();
  const received = [];

  const unsubscribe = bus.subscribe('task:completed', (msg) => {
    received.push(msg);
  });

  await bus.publish('task:completed', { id: 1 });
  assert.strictEqual(received.length, 1);
  assert.strictEqual(received[0].id, 1);

  unsubscribe();
  await bus.publish('task:completed', { id: 2 });
  assert.strictEqual(received.length, 1);
});

test('EventBus tracks listener counts accurately', () => {
  const bus = new EventBus();
  assert.strictEqual(bus.listenerCount('events'), 0);
  const unsub1 = bus.subscribe('events', () => {});
  const unsub2 = bus.subscribe('events', () => {});
  assert.strictEqual(bus.listenerCount('events'), 2);
  unsub1();
  assert.strictEqual(bus.listenerCount('events'), 1);
  unsub2();
  assert.strictEqual(bus.listenerCount('events'), 0);
});
