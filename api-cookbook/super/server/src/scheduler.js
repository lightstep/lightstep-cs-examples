let schedule = require('node-schedule')
let moment = require('moment')
let async = require('async')
let logger = require('./logger')
let api = require('./api')
let Service = require('./models/service')

redis = require('redis')
let publisher = redis.createClient()

const INTERVAL_MINUTES = 1

function syncStreams() {
  // This function finds all streams created on a component or service
  // Then gets their last 10 minutes of exemplar traces
  // And adds them to a queue ot be processed for service diagram
  logger.info('Syncing Streams')
  api.getStreams().then((res) => {
    logger.info(`Streams found: ${res.data.length}`)
    let streams = res.data.filter((s) => {
      return (
        s.attributes.name.includes('component:') ||
        s.attributes.name.includes('service IN')
      )
    })
    logger.info(`Streams filtered: ${streams.length}`)

    streams = streams.slice(0, 1) // FIXME: Remove this

    let count = 0
    streams.forEach((s) => {
      api.getStreamTimeseries(s.id).then((r) => {
        if (r.data.attributes.exemplars) {
          r.data.attributes.exemplars.forEach((e) => {
            publisher.publish('traces', e.span_guid, () => {
              count += 1
            })
          })
        }
      })
    })
  })
}

function syncServices() {
  // This function keeps an upd to date list of services from Service Directory
  logger.info('Syncing Services')
  api
    .getServices()
    .then((res) => {
      let services = res.data.items
      let bulkOps = []
      services.forEach((s) => {
        let upsertDoc = {
          updateOne: {
            filter: { name: s.attributes.name },
            update: {
              $set: {
                name: s.attributes.name,
                lastSeen: Date.parse(s.attributes.last_seen)
              }
            },
            upsert: true
          }
        }
        bulkOps.push(upsertDoc)
      })
      Service.collection
        .bulkWrite(bulkOps)
        .then((result) => {
          logger.info(JSON.stringify(result, null, 2))
        })
        .catch((err) => {
          logger.error(JSON.stringify(err, null, 2))
        })
    })
    .catch((err) => {
      logger.error(err)
    })
}

function startScheduler() {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, INTERVAL_MINUTES)

  // schedule.scheduleJob(rule, () => {
  //   syncServices()
  // })
  syncStreams()
  logger.info('Started scheduler')
}

module.exports = {
  startScheduler
}
