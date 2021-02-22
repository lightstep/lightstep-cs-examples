let schedule = require('node-schedule')
let moment = require('moment')
let async = require('async')
let logger = require('./logger')
let api = require('./api')

const INTERVAL_MINUTES = 1

function syncServices() {
  logger.info('Syncing Services')
  api
    .getServices()
    .then((res) => {
      logger.info(res)
    })
    .catch((err) => {
      logger.error(err)
    })
}

function startScheduler() {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, INTERVAL_MINUTES)

  schedule.scheduleJob(rule, () => {
    syncServices()
  })
  logger.info('Started scheduler')
}

module.exports = {
  startScheduler
}
