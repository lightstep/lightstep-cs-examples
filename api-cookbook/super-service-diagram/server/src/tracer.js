const opentelemetry = require('@opentelemetry/api')
const tracer = opentelemetry.trace.getTracer('@super/server')
module.exports = {
  tracer
}
