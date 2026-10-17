const { EventEmitter } = require('node:events');

class Engine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'brocode-core-engine';
    this.version = options.version || '0.1.0';
    this.status = 'STOPPED';
    this.uptimeStart = null;
  }

  async start() {
    if (this.status === 'RUNNING') {
      return this;
    }
    this.status = 'STARTING';
    this.emit('starting');
    this.uptimeStart = Date.now();
    this.status = 'RUNNING';
    this.emit('started', { timestamp: this.uptimeStart, engine: this.name });
    return this;
  }

  async stop() {
    if (this.status === 'STOPPED') {
      return this;
    }
    this.status = 'STOPPING';
    this.emit('stopping');
    this.status = 'STOPPED';
    this.uptimeStart = null;
    this.emit('stopped');
    return this;
  }

  getHealth() {
    return {
      status: this.status,
      engine: this.name,
      version: this.version,
      uptimeSeconds: this.uptimeStart ? Math.floor((Date.now() - this.uptimeStart) / 1000) : 0
    };
  }
}

module.exports = { Engine };
