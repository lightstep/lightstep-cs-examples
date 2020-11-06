let schedule = require('node-schedule')

let differ = require('./differ')
let logger = require('./logger')

let QueryModel = require('./models/query')

const SNAPSHOT_INTERVAL_MINUTES = 10

let startScheduler = function () {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, SNAPSHOT_INTERVAL_MINUTES) // Every 10 minutes

  QueryModel.find((err, queries) => {
    if (err) {
      logger.error(err)
    } else {
      queries.forEach((q) => {
        // Schedule checking of snapshots every 10 minutes and then create a new snapshot
        schedule.scheduleJob(rule, function () {
          differ.diffLatestSnapshotsForQuery(q)
          // Possible race condition here, bypass it with a sleep
          setTimeout(function () {
            differ.createSnapshotForQuery(q)
          }, 5000)
        })
      })
    }
  })
}

module.exports = {
  startScheduler
}
