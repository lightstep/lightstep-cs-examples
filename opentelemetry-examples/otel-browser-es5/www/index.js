import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/tracing';
import { WebTracerProvider } from '@opentelemetry/web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
// if you already have zone.js
// import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { parseTraceParent } from '@opentelemetry/core';
import * as opentelemetry from '@opentelemetry/api';

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
  DocumentLoadInstrumentation,
  FetchInstrumentation,
  opentelemetry,
  parseTraceParent
};


// make all available globally on window
Object.keys(OTEL).forEach(key => {
  window[key] = OTEL[key];
});
