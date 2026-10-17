const test = require('node:test');
const assert = require('node:assert');
const {
  TelemetryExporter,
  PrometheusExporter,
  OpenTelemetryExporter,
  TelemetryManager
} = require('../src/telemetry');

test('PrometheusExporter formats metrics into Prometheus exposition format', async () => {
  const exporter = new PrometheusExporter({ prefix: 'test_brocode' });
  const metrics = {
    status: 'RUNNING',
    engine: 'engine-1',
    version: '0.1.0',
    uptimeSeconds: 120,
    memory: {
      heapUsedMB: 45.5,
      heapTotalMB: 60.0,
      rssMB: 85.2
    }
  };

  const output = await exporter.export(metrics);
  assert.ok(output.includes('# HELP test_brocode_engine_status'));
  assert.ok(output.includes('test_brocode_engine_status{engine="engine-1",version="0.1.0"} 1'));
  assert.ok(output.includes('test_brocode_uptime_seconds{engine="engine-1"} 120'));
  assert.ok(output.includes('test_brocode_memory_heap_used_mb{engine="engine-1"} 45.5'));
});

test('OpenTelemetryExporter produces compliant OTel ResourceMetrics payload', async () => {
  const exporter = new OpenTelemetryExporter({ serviceName: 'custom-service' });
  const metrics = {
    status: 'RUNNING',
    engine: 'engine-1',
    version: '0.1.0',
    uptimeSeconds: 60,
    memory: { heapUsedMB: 30 }
  };

  const output = await exporter.export(metrics);
  assert.ok(output.resourceMetrics);
  const resource = output.resourceMetrics[0].resource;
  const serviceAttr = resource.attributes.find(a => a.key === 'service.name');
  assert.strictEqual(serviceAttr.value.stringValue, 'custom-service');

  const metricList = output.resourceMetrics[0].scopeMetrics[0].metrics;
  const uptimeMetric = metricList.find(m => m.name === 'runtime.uptime');
  assert.strictEqual(uptimeMetric.gauge.dataPoints[0].asInt, 60);
});

test('TelemetryManager registers, retrieves, and collects across multiple exporters', async () => {
  const manager = new TelemetryManager();
  const prom = new PrometheusExporter();
  const otel = new OpenTelemetryExporter();

  manager.register(prom);
  manager.register(otel);

  assert.strictEqual(manager.get('prometheus'), prom);
  assert.strictEqual(manager.get('opentelemetry'), otel);

  const metrics = {
    status: 'STOPPED',
    engine: 'kernel',
    version: '0.1.0',
    uptimeSeconds: 0
  };

  const collected = await manager.collect(metrics);
  assert.ok(collected.prometheus);
  assert.ok(collected.opentelemetry);
  assert.ok(collected.prometheus.includes('brocode_engine_status{engine="kernel",version="0.1.0"} 0'));
});
