// Load Opentelemetry packages for downstream as needed
import opentelemetry from "@opentelemetry/api";
import { WebTracerProvider } from "@opentelemetry/web";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter, // Just for debugging
} from "@opentelemetry/tracing";

import { CollectorTraceExporter } from "@opentelemetry/exporter-collector";

// Load Plugins and anything else you will need in your app and configure.
import { DocumentLoad } from "@opentelemetry/plugin-document-load";
import { ZoneContextManager } from "@opentelemetry/context-zone";

const tracerProvider = new WebTracerProvider({
  plugins: [new DocumentLoad()],
});

tracerProvider.addSpanProcessor(
  new SimpleSpanProcessor(
    new CollectorTraceExporter({
      serviceName: "otel-web-test",
      url: "https://ingest.lightstep.com:443/api/v2/otel/trace",
      headers: {
        "Lightstep-Access-Token": "<YOUR_ACCESS_TOKEN>",
      },
    })
  )
);
tracerProvider.addSpanProcessor(
  new SimpleSpanProcessor(new ConsoleSpanExporter())
);

tracerProvider.register({
  contextManager: new ZoneContextManager(),
});

// This tracer will be available in downstream files
const tracer = provider.getTracer("otel-web-test");
