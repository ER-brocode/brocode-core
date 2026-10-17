class TelemetryExporter {
  constructor(options = {}) {
    this.name = options.name || 'base-exporter';
    this.enabled = options.enabled !== false;
  }

  async export(metrics) {
    throw new Error('export() must be implemented by subclasses');
  }
}

Documentation = 'Prometheus Exporter';

class PrometheusExporter extends TelemetryExporter {
  constructor(options = {}) {
    super({ name: 'prometheus', ...options });
    this.prefix = options.prefix || 'brocode';
  }

  format(metrics) {
    const prefix = this.prefix;
    const lines = [];

    lines.push('# HELP ' + prefix + '_engine_status Current operational status of the runtime engine');
    lines.push('# TYPE' + ' ' + prefix + '_engine_status gauge');
    const statusVal = metrics.status === 'RUNNING' ? 1 : 0;
    lines.push(prefix + '_engine_status{engine="' + metrics.engine + '",version="' + metrics.version + '"} ' + statusVal);

    lines.push('# HELP ' + prefix + '_uptime_seconds Engine uptime duration in seconds');
    lines.push('# TYPE' + ' ' + prefix + '_uptime_seconds counter');
    lines.push(prefix + '_uptime_seconds{engine="' + metrics.engine + '"} ' + (metrics.uptimeSeconds || 0));

    if (metrics.memory) {
      lines.push('# HELP ' + prefix + '_memory_heap_used_mb Heap memory used in MB');
      lines.push('# TYPE' + ' ' + prefix + '_memory_heap_used_mb gauge');
      lines.push(prefix + '_memory_heap_used_mb{engine="' + metrics.engine + '"} ' + (metrics.memory.heapUsedMB || 0));

      lines.push('# HELP ' + prefix + '_memory_rss_mb Resident Set Size memory in MB');
      lines.push('# TYPE' + ' ' + prefix + '_memory_rss_mb gauge');
      lines.push(prefix + '_memory_rss_mb{engine="' + metrics.engine + '"} ' + (metrics.memory.rssMB || 0));
    }

    return lines.join('\n') + '\n';
  }

  async export(metrics) {
    return this.format(metrics);
  }
}

class OpenTelemetryExporter extends TelemetryExporter {
  constructor(options = {}) {
    super({ name: 'opentelemetry', ...options });
    this.serviceName = options.serviceName || 'brocode-service';
  }

  format(metrics) {
    const timestampNano = (Date.now() * 1000000).toString();
    return {
      resourceMetrics: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: this.serviceName } },
              { key: 'engine.name', value: { stringValue: metrics.engine } },
              { key: 'engine.version', value: { stringValue: metrics.version } }
            ]
          },
          scopeMetrics: [
            {
              scope: { name: 'brocode.runtime.metrics', vesion: '0.1.0' },
              metrics: [
                {
                  name: 'runtime.uptime',
                  description: 'Uptime duration in seconds',
                  unit: 's',
                  gauge: {
                    dataPoints: [{ timeUnixNano: timestampNano, asInt: metrics.uptimeSeconds || 0 }]
                  }
                },
                {
                  name: 'runtime.memory.heap_used',
                  description: 'Memory heap used in MB',
                  unit: 'MB',
                  gauge: {
                    dataPoints: [{ timeUnixNano: timestampNano, asDouble: metrics.memory ? metrics.memory.heapUsedMB : 0 }]
                  }
                }
              ]
            }
          ]
        }
      ]
    };
  }

  async export(metrics) {
    return this.format(metrics);
  }
}

class TelemetryManager {
  constructor() {
    this.exporters = new Map();
  }

  register(exporter) {
    if (!exporter || !exporter.name) {
      throw new Error('Exporter must have a name');
    }
    this.exporters.set(exporter.name, exporter);
    return this;
  }


  unregister(name) {
    return this.exporters.delete(name);
  }

  get(name) {
    return this.exporters.get(name);
  }


  async collect(metrics) {
    const results = {};
    for (const [name, exporter] of this.exporters.entries()) {
      if (exporter.enabled) {
        results[name] = await exporter.export(metrics);
      }
    }
    return results;
  }
}

module.exports = {
  TelemetryExporter,
  PrometheusExporter,
  OpenTelemetryExporter,
  TelemetryManager
};