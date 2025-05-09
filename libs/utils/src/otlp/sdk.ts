/*instrumentation.ts*/
import * as opentelemetry from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import otlp, { Span } from '@opentelemetry/api';
const OTLP = process.env.OTLP_URL || 'http://localhost:4318';

console.log('OTLP_URL', OTLP);
const sdk = new opentelemetry.NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'nest-test-app',
    [ATTR_SERVICE_VERSION]: '1.0.1',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${OTLP}/v1/traces`,
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${OTLP}/v1/metrics`,
      headers: {},
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();

export const tracer = otlp.trace.getTracer('example-tracer');

export async function trace(name: string, call: (span: Span) => Promise<void>) {
  const span = tracer.startSpan(name);
  return call(span).finally(() => {
    span.end();
  });
}
