const constants = require('./constants')

// OpenTelemetry
const { lightstep } = require('lightstep-opentelemetry-launcher-node')

const startScript = './server'

const sdk = lightstep.configureOpenTelemetry({
  accessToken: constants.LS_ACCESS_TOKEN,
  serviceName: 'super'
})

sdk.start().then(() => {
  require(startScript)
})

function shutdown() {
  sdk
    .shutdown()
    .then(
      () => console.log('shutdown complete'),
      (err) => console.log('error shutting down', err)
    )
    .finally(() => process.exit(0))
}

process.on('beforeExit', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
