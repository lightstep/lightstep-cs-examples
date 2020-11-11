let schedule = require('node-schedule')
let moment = require('moment')

let differ = require('./differ')
let directory = require('./directory')
let logger = require('./logger')

let QueryModel = require('./models/query')

const SNAPSHOT_DIFF_INTERVAL_MINUTES = 10
const SNAPSHOT_CREATE_TIMEOUT_SECONDS = 10
const SNAPSHOT_FETCH_TIMEOUT_SECONDS = 5

function startScheduler() {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, SNAPSHOT_DIFF_INTERVAL_MINUTES)

  QueryModel.find((err, queries) => {
    if (err) {
      logger.error(err)
    } else {
      queries.forEach((q) => {
        // Schedule checking of snapshots every 10 minutes and then create a new snapshot
        schedule.scheduleJob(rule, () => {
          differ.diffLatestSnapshotsForQuery(q)
          setTimeout(() => {
            directory
              .createSnapshotForQuery(q)
              .then((snapshot) => {
                let s = snapshot.completeTime + SNAPSHOT_FETCH_TIMEOUT_SECONDS
                let t = moment.unix(s).toDate()
                schedule.scheduleJob(t, () => {
                  directory.fetchSnapshotData(snapshot.snapshotId)
                })
                logger.info(
                  `Scheduled fetching of Snapshot ${snapshot.snapshotId} at ${t}`
                )
              })
              .catch((err) => {
                logger.error(err)
              })
          }, SNAPSHOT_CREATE_TIMEOUT_SECONDS)
          // Timeout to create the new snapshot after diffing for two
          // latests snapshots has already started so that we don't
          // get stuck in a loop and never check
        })
      })
    }
  })
}

module.exports = {
  startScheduler
}
