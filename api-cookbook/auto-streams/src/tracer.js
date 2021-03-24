const opentelemetry = require('@opentelemetry/api')
const tracer = opentelemetry.trace.getTracer('@auto-streams')
const { context, setSpan } = require('@opentelemetry/api')

/**
 * Create a new span decorated with optional attributes and parent span context.
 * @param name Span operation name
 * @param options Additional span decoration options
 *
 * @example
 * startSpan('operation_name')
 *
 * @example
 * startSpan('operation_name', {
 *   // Optional attributes
 *   attributes: {
 *     span_attribute: 10000
 *   },
 *   // Optional span parent
 *   parent: parentSpan
 * })
 */
function startSpan(name, options) {
  options = options ? options : {}
  const { parent, ...spanOptions } = options
  return tracer.startSpan(
    name,
    spanOptions,
    // OTel uses a generated Context for connecting spans
    parent ? setSpan(context.active(), parent) : undefined
  )
}
module.exports = {
  tracer,
  startSpan
}
