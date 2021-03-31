const logger = require('./logger')
const constants = require('./constants')

if (constants.LIGHTSTEP_ACCESS_TOKEN != '') {
  logger.info('Starting Lightstep OTEL Launcher')
  // OpenTelemetry
  const { lightstep } = require('lightstep-opentelemetry-launcher-node')

  const sdk = lightstep.configureOpenTelemetry({
    accessToken: constants.LIGHTSTEP_ACCESS_TOKEN,
    serviceName: '@auto-streams'
  })
  sdk.start().then(() => {
    logger.info('Node OTEL SDK initialized')
    require('./job').scheduleJob()
  })
  function shutdown() {
    sdk
      .shutdown()
      .then(
        () => logger.info('shutdown complete'),
        (err) => logger.error('error shutting down', err)
      )
      .finally(() => process.exit(0))
  }
  process.on('beforeExit', shutdown)
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
} else {
  require(startScript)
}
