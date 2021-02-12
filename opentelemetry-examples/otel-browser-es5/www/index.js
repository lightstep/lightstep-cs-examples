import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/tracing';
import { WebTracerProvider } from '@opentelemetry/web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { DocumentLoad } from '@opentelemetry/plugin-document-load';

const OTEL = {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  BatchSpanProcessor,
  WebTracerProvider,
  ZoneContextManager,
  registerInstrumentations,
  CollectorTraceExporter,
  XMLHttpRequestInstrumentation,
  UserInteractionInstrumentation,
  DocumentLoad,
};

// make all available globally on window
Object.keys(OTEL).forEach(key => {
  window[key] = OTEL[key];
});