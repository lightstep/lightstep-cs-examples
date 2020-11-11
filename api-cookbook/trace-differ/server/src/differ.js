let moment = require('moment')
let async = require('async')

let logger = require('./logger')

let DiffModel = require('./models/diff')
let SnapshotModel = require('./models/snapshot')

function diffLatestSnapshotsForQuery(q) {
  // TODO: Get latest diffs so you can only do a diff if it hasn't been done already
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

        // TODO: Set custom thresholds

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
    if (groupByKey == 'service') {
      label = s['reporter']['name']
    } else if (groupByKey == 'operation') {
      label = s['span-name']
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

module.exports = {
  diffLatestSnapshotsForQuery
}
