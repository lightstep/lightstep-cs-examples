const schedule = require('node-schedule'),
  async = require('async')
const logger = require('./logger'),
  constants = require('./constants'),
  api = require('./api')

const { startSpan } = require('./tracer')

function scheduleJob() {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, constants.SCHEDULE_RULE_MINUTES)
  schedule.scheduleJob(rule, () => {
    startJob()
  })
  logger.info('Started scheduler')
}

function startJob() {
  const span = startSpan('startJob')
  async.waterfall(
    [
      function (cb) {
        const getServicesSpan = startSpan('getServices', { parent: span })
        api
          .getServices()
          .then((res) => {
            // Preprocess
            let services = res.data.items.map((s) => {
              return s.attributes.name
            })

            getServicesSpan.addEvent(`Found ${services.length} services`)
            getServicesSpan.end()
            cb(null, services)
          })
          .catch((err) => {
            getServicesSpan.setAttribute('error', true)
            getServicesSpan.end()
            cb(err, null)
          })
      },
      function (services, cb) {
        const getStreamsSpan = startSpan('getStreams', { parent: span })
        api
          .getStreams()
          .then((res) => {
            // Preprocess
            let streams = res.data.map((s) => {
              return s.attributes.query
            })

            getStreamsSpan.addEvent(`Found ${streams.length} services`)
            getStreamsSpan.end()
            cb(null, services, streams)
          })
          .catch((err) => {
            getStreamsSpan.setAttribute('error', true)
            getStreamsSpan.end()
            cb(err, null)
          })
      },
      // TODO: Maybe also create dashboards for a service
      // function (services, streams, cb) {
      //   const getDashboardsSpan = startSpan('getDashboards', { parent: span })
      //   api
      //     .getDashboards()
      //     .then((res) => {
      //       let dashboards = res.data
      //       getDashboardsSpan.addEvent(`Found ${dashboards.length} services`)
      //       getDashboardsSpan.end()
      //       cb(null, services, streams, dashboards)
      //     })
      //     .catch((err) => {
      //       console.log(err)
      //       getDashboardsSpan.setAttribute('error', true)
      //       getDashboardsSpan.end()
      //       cb(err, null)
      //     })
      // },
      function (services, streams, cb) {
        // Check if a stream exists for each service. If not, create one.
        async.each(
          services,
          function (svc, callback) {
            let tmpstreams = streams.filter((strm) => {
              return strm.includes(`service IN ("${svc}")`)
            })
            if (tmpstreams.length == 0) {
              // create the stream

              // Check if we're doing a dry run
              if (!constants.DRY_RUN) {
                // Actually create
                logger.info(`Creating stream for 'service IN ${svc}'`)
                api
                  .createStream(`service IN ("${svc}")`, `Service: ${svc}`)
                  .then((res) => {
                    callback()
                  })
                  .catch((err) => {
                    callback(err)
                  })
              } else {
                logger.info(`Will create stream for 'service IN ${svc}'`)
                callback()
              }
            } else {
              callback()
            }
          },
          function (err) {
            if (err) {
              cb(err, null)
            } else {
              cb(null, 'Successfully synced streams for services')
            }
          }
        )
      }
    ],
    function (err, result) {
      if (err) {
        logger.error(err)
        span.setAttribute('error', true)
        span.end()
      } else {
        logger.info(result)
        span.end()
      }
    }
  )
}

module.exports = {
  startJob,
  scheduleJob
}
