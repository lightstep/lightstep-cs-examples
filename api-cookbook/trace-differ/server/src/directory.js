let moment = require('moment')
let async = require('async')

let api = require('./api')
let logger = require('./logger')

let SnapshotModel = require('./models/snapshot')

function createSnapshotForQuery(q) {
  return new Promise((resolve, reject) => {
    api
      .createSnapshot(q.query)
      .then((res) => {
        snapshot = {
          snapshotId: res.data.id,
          query: q.query,
          createdAt: moment().unix(),
          completeTime: moment(res.data.attributes['complete-time']).unix(),
          link: '' // TODO create link to UI
        }
        SnapshotModel.create(snapshot, (error, data) => {
          if (error) {
            reject(error)
          } else {
            logger.info(
              `Created snapshot ${res.data.id} for query: ${q.query} `
            )
            resolve(snapshot)
          }
        })
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function fetchSnapshotData(snapshotId) {
  getExemplarsForSnapshot(snapshotId)
    .then((exemplars) => {
      getTracesForExemplars(exemplars)
        .then((spans) => {
          // Save Data to Snapshot Model
          SnapshotModel.findOneAndUpdate(
            { snapshotId: snapshotId },
            { $set: { spans: spans } },
            (error, data) => {
              if (error) {
                logger.error(error)
              } else {
                logger.info(
                  `Added ${spans.length} spans to snapshot ${snapshotId}`
                )
              }
            }
          )
        })
        .catch((err) => logger.error(err))
    })
    .catch((err) => logger.error(err))
}

function getExemplarsForSnapshot(snapshotId) {
  logger.info(`Getting snapshot ${snapshotId} exemplars`)
  return new Promise((resolve, reject) => {
    api
      .getSnapshot(snapshotId, { 'include-exemplars': 1 })
      .then((res) => {
        if (res.data.attributes.exemplars) {
          resolve(res.data.attributes.exemplars)
        } else {
          reject(new Error('No snapshot data returned'))
        }
      })
      .catch((err) => {
        reject(err)
      })
  })
}

function getTracesForExemplars(exemplars) {
  exemplars = exemplars.map((s) => {
    return s['span-guid']
  })

  return new Promise((resolve, reject) => {
    // TODO: Retry to catch the Rate Limit, catch 500s for some traces not found.
    async.reduce(
      exemplars,
      [],
      (memo, item, cb) => {
        api
          .getStoredTrace(item)
          .then((res) => {
            // Add service name to all spans
            let spans = res.data[0].attributes.spans
            let reporters = res.data[0].relationships.reporters
            spans.forEach((s) => {
              let r = reporters.find(
                (obj) => obj['reporter-id'] == s['reporter-id']
              )
              s.reporter = {
                id: r['reporter-id'],
                name: r.attributes['lightstep.component_name'],
                hostname: r.attributes['lightstep.hostname']
              }
              delete s['reporter-id']
            })
            cb(null, memo.concat(spans))
          })
          .catch((err) => {
            logger.warn(err)
            cb(null, memo.concat([]))
          })
      },
      (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      }
    )
  })
}

module.exports = {
  createSnapshotForQuery,
  fetchSnapshotData
}
