let moment = require('moment')
let async = require('async')

let api = require('./api')
let logger = require('./logger')

let DiffModel = require('./models/diff')
let SnapshotModel = require('./models/snapshot')

let createSnapshotForQuery = function (q) {
  api
    .createSnapshot(q.query)
    .then((res) => {
      snapshot = {
        snapshotId: res.data.id,
        query: q.query,
        createdAt: moment().unix(),
        completeTime: moment(res.data.attributes['complete-time']).unix()
      }
      SnapshotModel.create(snapshot, (error, data) => {
        if (error) {
          logger.log(error)
        } else {
          logger.log(`Created snapshot ${res.data.id} for query: ${q.query} `)
        }
      })
    })
    .catch((error) => {
      logger.log(error)
    })
}

let diffLatestSnapshotsForQuery = function (q) {
  logger.info(`diffing latest snapshots for query {${q.query}}`)
  SnapshotModel.find({ query: q.query })
    .sort('-createdAt')
    .limit(2)
    .exec((err, snapshots) => {
      if (err) {
        logger.error(err)
      } else {
        // If only one snapshot exists, skip,
        // otherwise only diff if latest snapshot has data
        if (
          snapshots.length > 1 &&
          moment().unix() > snapshots[0].completeTime
        ) {
          // get group by results for each snapshot and each key
          // diff the two snapshots for the keys
          diffSnapshots(
            q.query,
            snapshots[1].snapshotId,
            snapshots[0].snapshotId,
            q.groupByKeys
          )
        } else {
          logger.info(`latest snapshot for {${q.query}} not yet complete`)
        }
      }
    })
}

let diffSnapshots = function (query, a, b, groupByKeys) {
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
              if ((r.key = k)) {
                aResults = r.results.data.attributes['analyzer-results']
              }
            })
            results.b.forEach((r) => {
              if ((r.key = k)) {
                bResults = r.results.data.attributes['analyzer-results']
              }
            })
            // TODO: Handle when you don't receive the data
            if (aResults && bResults) {
              let diff = compareAnalysis(aResults.analysis, bResults.analysis)
              diff.key = k
              groups.push(diff)
            } else {
              logger.warn('did not calculate diff, missing analysis data')
            }
          })
          if (groups.length > 0) {
            // Add to Diff
            let diff = {
              query: query,
              linkA: linkA,
              linkB: linkB,
              calculatedAt: moment().unix(),
              diffs: groups
            }
            logger.info(
              `diff calculated for query {${query}} between snapshot $}${a} and ${b}`
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

let compareAnalysis = function (a, b) {
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

let getAnalyzerResults = function (id, groupByKey) {
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

module.exports = {
  createSnapshotForQuery,
  diffLatestSnapshotsForQuery,
  diffSnapshots
}
