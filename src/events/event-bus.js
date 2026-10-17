class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  subscribe(topic, handler) {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic).add(handler);
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic, handler) {
    if (this.handlers.has(topic)) {
      this.handlers.get(topic).delete(handler);
    }
  }

  async publish(topic, payload) {
    const listeners = this.handlers.get(topic);
    if (!listeners || listeners.size === 0) {
      return [];
    }
    const promises = Array.from(listeners).map(fn => Promise.resolve(fn(payload)));
    return Promise.all(promises);
  }

  listenerCount(topic) {
    return this.handlers.has(topic) ? this.handlers.get(topic).size : 0;
  }
}

module.exports = { EventBus };
