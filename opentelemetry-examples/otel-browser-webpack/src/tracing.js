// Load Opentelemetry packages for downstream as needed
// import * as api from "@opentelemetry/api";
import { WebTracerProvider } from '@opentelemetry/web';
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter, // Just for debugging
} from '@opentelemetry/tracing';

import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';

// Load Plugins and anything else you will need in your app and configure.
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const tracerProvider = new WebTracerProvider({
  plugins: [new DocumentLoadInstrumentation()],
});

tracerProvider.addSpanProcessor(
  new SimpleSpanProcessor(
    new CollectorTraceExporter({
      serviceName: 'otel-web-test',
      url: 'https://ingest.lightstep.com:443/api/v2/otel/trace',
      headers: {
        'Lightstep-Access-Token': '<YOUR ACCESS TOKEN>',
      },
    }),
  ),
);
// For debugging
tracerProvider.addSpanProcessor(
  new SimpleSpanProcessor(new ConsoleSpanExporter()),
);

tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

// This tracer will be available in downstream files
const tracer = tracerProvider.getTracer('otel-web-test');
