let moment = require('moment')
let async = require('async')

let api = require('./api')
let logger = require('./logger')

let DiffModel = require('./models/diff')
let SnapshotModel = require('./models/snapshot')

// Scheduled API methods

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
          link: ''
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

function diffLatestSnapshotsForQuery(q) {
  // TODO: Get latest diffs so you can only do a diff if necessary
  logger.info(`diffing latest snapshots for query {${q.query}}`)
  SnapshotModel.find({ query: q.query, spans: { $ne: [] } })
    .sort('-createdAt')
    .limit(2)
    .exec((err, snapshots) => {
      if (err) {
        logger.error(err)
      } else {
        // If only one snapshot exists, skip,
        // otherwise only diff if latest snapshot has data
        if (snapshots.length > 1) {
          // get group by results for each snapshot and each key
          // diff the two snapshots for the keys
          diffLocalSnapshots(
            q.query,
            snapshots[1].snapshotId,
            snapshots[0].snapshotId,
            q.groupByKeys
          )
        } else {
          logger.warn(`only one snapshot for query {${q.query}}, skipping diff`)
        }
      }
    })
}

// Helper Methods

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
            cb(null, memo.concat(res.data[0].attributes.spans))
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

// Calculations

function diffLocalSnapshots(query, aId, bId, groupByKeys) {
  // Get the span data for both snapshots from local DB
  async.mapValues(
    { a: aId, b: bId },
    function (id, key, cb) {
      SnapshotModel.find({ snapshotId: id }, (err, data) => {
        if (err) {
          cb(err, null)
        } else {
          cb(null, data)
        }
      })
    },
    (err, snapshots) => {
      if (err) {
        logger.error(err)
      } else {
        // Diff Snapshots by each group by key
        let groups = []
        let aResults, bResults, diff
        groupByKeys.forEach((k) => {
          aResults = calculateGroupByAnalysis(snapshots.a[0].spans, k)
          bResults = calculateGroupByAnalysis(snapshots.b[0].spans, k)
          // compare the group bys
          diff = compareAnalysis(aResults.groups, bResults.groups)
          diff.key = k
          groups.push(diff)
        })

        // TODO: thresholds of diffs

        // create and save a diff
        if (groups.length > 0) {
          let diff = {
            query: query,
            linkA: snapshots.a.link,
            linkB: snapshots.b.link,
            calculatedAt: moment().unix(),
            diffs: groups
          }
          logger.info(
            `diff calculated for query {${query}} between snapshot ${aId} and ${bId}`
          )
          DiffModel.create(diff, (error, data) => {
            if (error) {
              logger.error(error)
            }
          })
        }
      }
    }
  )
}

function calculateGroupByAnalysis(spans, groupByKey) {
  let groups = {}
  let groupLabels = new Set()
  spans.forEach((s) => {
    let label = ''
    if (groupByKey == 'operation') {
      // only one built in available for now
      label = s['span-name']
      // TODO: check and add service name
    } else {
      label = s['tags'][groupByKey]
    }

    if (!groupLabels.has(label)) {
      // initialize the group
      groups[label] = {
        count: 0,
        latency_sum: 0,
        error_count: 0
      }
      groupLabels.add(label)
    }

    // Update group statistics
    groups[label].count += 1
    groups[label].error_count += s['is-error'] ? 1 : 0
    groups[label].latency_sum += s['end-time-micros'] - s['start-time-micros']
  })

  // Aggregate statistics (match current api response)
  let agg = []
  Object.keys(groups).forEach((k) => {
    agg.push({
      value: k,
      occurrence: groups[k].count,
      avg_latency: Math.floor(groups[k].latency_sum / groups[k].count),
      error_ratio: groups[k].error_count / groups[k].count
    })
  })

  let groupByResults = {
    'group-by-key': groupByKey,
    groups: agg
  }
  return groupByResults
}

function compareAnalysis(a, b) {
  let aKeys = a.map((o) => {
    return o.value
  })
  let bKeys = b.map((o) => {
    return o.value
  })
  // TODO: simulate remove random
  // for (var i = 0; i <= 2; i++) {
  //   aKeys.splice(Math.floor(Math.random() * aKeys.length), 1)
  // }
  // for (var i = 0; i <= 2; i++) {
  //   bKeys.splice(Math.floor(Math.random() * bKeys.length), 1)
  // }
  // end simulation
  let inBnotA = bKeys.filter((k) => {
    return !aKeys.includes(k)
  })
  let inAnotB = aKeys.filter((k) => {
    return !bKeys.includes(k)
  })
  let inBoth = bKeys.filter((k) => {
    return aKeys.includes(k)
  })

  let diffs = inBoth.map((k) => {
    let x = a.find((o) => o.value == k)
    let y = b.find((o) => o.value == k)
    return {
      value: k,
      occurrence: y.occurrence - x.occurrence,
      avg_latency: y.avg_latency - x.avg_latency,
      error_ratio: Number(
        (
          (y.error_ratio ? y.error_ratio : 0) -
          (x.error_ratio ? x.error_ratio : 0)
        ).toFixed(2)
      )
    }
  })
  return {
    new: inBnotA,
    missing: inAnotB,
    diffs: diffs
  }
}

// Deprecated
function getAnalyzerResults(id, groupByKey) {
  logger.info(`getting snapshot ${id} for key ${groupByKey}`)
  return api
    .getSnapshot(id, { 'group-by': groupByKey })
    .then((res) => {
      return { key: groupByKey, results: res }
    })
    .catch((err) => {
      logger.error(err)
      return undefined
    })
}

function diffSnapshots(query, a, b, groupByKeys) {
  async.series(
    {
      a: function (callback) {
        let groupByResults = groupByKeys.map((k) => {
          return getAnalyzerResults(a, k)
        })
        Promise.all(groupByResults).then((res) => {
          res = res.filter((x) => {
            return typeof x == 'object'
          })
          callback(null, res)
        })
      },
      b: function (callback) {
        let groupByResults = groupByKeys.map((k) => {
          return getAnalyzerResults(b, k)
        })
        Promise.all(groupByResults).then((res) => {
          res = res.filter((x) => {
            return typeof x == 'object'
          })
          callback(null, res)
        })
      }
    },
    function (err, results) {
      // results is now equal to: {one: 1, two: 2}
      if (err) {
        logger.error(err)
      } else {
        // Do the Diff here
        if (results.a.length > 0 && results.b.length > 0) {
          let groups = []
          let linkA = results.a[0].results.data.links['ui-self']
          let linkB = results.b[0].results.data.links['ui-self']
          // Do a diff per key
          groupByKeys.forEach((k) => {
            let aResults, bResults
            results.a.forEach((r) => {
              if (r.key == k) {
                aResults = r.results.data.attributes['group-by']['groups']
              }
            })
            results.b.forEach((r) => {
              if (r.key == k) {
                bResults = r.results.data.attributes['group-by']['groups']
              }
            })
            // TODO: Handle pending status or bad key
            if (aResults && bResults) {
              let diff = compareAnalysis(aResults, bResults)
              diff.key = k
              groups.push(diff)
            } else {
              logger.warn(
                `did not calculate diff of query {${query}} between snapshots ${a} and ${b} for key ${k}, missing analysis data`
              )
            }
          })
          if (groups.length > 0) {
            // Add to Diff
            let diff = {
              query: query,
              linkA: '', // TODO
              linkB: '', // TODO
              calculatedAt: moment().unix(),
              diffs: groups
            }
            logger.info(
              `diff calculated for query {${query}} between snapshot ${a} and ${b}`
            )
            DiffModel.create(diff, (error, data) => {
              if (error) {
                logger.error(error)
              }
            })
          }
        }
      }
    }
  )
}

module.exports = {
  createSnapshotForQuery,
  fetchSnapshotData,
  diffLatestSnapshotsForQuery
}
