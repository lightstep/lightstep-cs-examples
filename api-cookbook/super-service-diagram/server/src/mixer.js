const { tracer } = require('./tracer')
const { context, setSpan } = require('@opentelemetry/api')
const constants = require('./constants')

const async = require('async')

const redis = require('redis')
const subscriber = redis.createClient({
  host: constants.REDIS_HOST,
  port: constants.REDIS_PORT
})
const logger = require('./logger')
const api = require('./api')

const TagModel = require('./models/tag')
const EdgeModel = require('./models/edge')

const Bottleneck = require('bottleneck')
let limiter = new Bottleneck({
  minTime: 20, // 50 per second limit
  maxConcurrent: 500,
  id: 'super', // All limiters with the same id will be clustered together
  trackDoneStatus: true,
  datastore: 'redis',
  clearDatastore: true,
  clientOptions: {
    host: constants.REDIS_HOST,
    port: constants.REDIS_PORT
  }
})

function roundDate(timeStamp) {
  timeStamp -= timeStamp % (24 * 60 * 60 * 1000) //subtract amount of time since midnight
  return new Date(timeStamp).getTime()
}

function parseTrace(spans, reporters) {
  // Create a service map of nodes and edges between services
  let services = {}
  reporters.forEach((r) => {
    // Assuming unique values per trace
    let svc = {
      name: r.attributes['lightstep.component_name'], // getting the service name
      tags: {}
    }
    // getting all the tracer level tags
    for (let [key, value] of Object.entries(r.attributes)) {
      svc.tags[key] = [value]
    }
    services[r['reporter-id']] = svc
  })
  let refinedSpans = {}
  spans.forEach((s) => {
    r_id = s['reporter-id']
    refinedSpans[s['span-id']] = {
      parentId: s.tags.parent_span_guid ? s.tags.parent_span_guid : '',
      reporter: r_id, // reporter id
      startTime: s['start-time-micros']
    }
    for (let [key, value] of Object.entries(s.tags)) {
      if (key != 'parent_span_guid') {
        if (!services[r_id].tags[key]) {
          services[r_id].tags[key] = []
        }
        if (!services[r_id].tags[key].includes(value)) {
          services[r_id].tags[key].push(value)
        }
      }
    }
  })
  let edges = []

  for (let [sid, value] of Object.entries(refinedSpans)) {
    let s1 = services[value.reporter].name
    if (value.parentId != '' && refinedSpans[value.parentId]) {
      // if refinedSpans does not contain the parent, then it's a missing span, so no way to draw the edge
      let s2 = services[refinedSpans[value.parentId].reporter].name
      if (!edges[s2]) {
        edges[s2] = {}
      }
      if (s1 != s2 && !Object.keys(edges[s2]).includes(s1)) {
        edges[s2][s1] = new Date(value.startTime / 1000).getTime()
      }
    }
    // otherwise root span so no edges
  }

  return {
    services: services,
    edges: edges
  }
}

async function updateServiceMap(span_guid) {
  const span = tracer.startSpan('updateServiceMap')
  span.setAttribute('span-guid', span_guid)
  context.with(setSpan(context.active(), span), () => {
    api
      .getStoredTrace(span_guid)
      .then((res) => {
        const parseSpan = tracer.startSpan('parseTrace')
        let parsed = parseTrace(
          res.data[0].attributes.spans,
          res.data[0].relationships.reporters
        )
        parseSpan.end()

        async.parallel(
          [
            async.reflect(function (cb) {
              // Add Edges in Mongo
              const edgeSpan = tracer.startSpan('addEdges')
              let bulkEdgeOps = []
              for (let [key, value] of Object.entries(parsed.edges)) {
                for (let [k, v] of Object.entries(value)) {
                  let upsertDoc = {
                    updateOne: {
                      filter: {
                        to: k,
                        from: key,
                        lastSeen: roundDate(new Date().getTime())
                      },
                      update: {
                        $set: {
                          to: k,
                          from: key,
                          lastSeen: roundDate(new Date().getTime())
                        }
                      },
                      upsert: true
                    }
                  }
                  bulkEdgeOps.push(upsertDoc)
                }
              }
              if (bulkEdgeOps.length > 0) {
                EdgeModel.collection
                  .bulkWrite(bulkEdgeOps)
                  .then((result) => {
                    if (result.upsertedCount > 0) {
                      logger.info(
                        `Upserted ${result.upsertedCount} edges for trace ${span_guid}`
                      )
                    }
                    edgeSpan.end()
                    cb(null, 'done')
                  })
                  .catch((err) => {
                    edgeSpan.setAttribute('error', true)
                    edgeSpan.end()
                    cb(err.message, null)
                  })
              }
            }),
            async.reflect(function (cb) {
              const tagSpan = tracer.startSpan('addTags')
              bulkTagOps = []
              // Add Tags in Mongo
              for (let [sid, s] of Object.entries(parsed.services)) {
                for (let [key, values] of Object.entries(s.tags)) {
                  values.forEach((v) => {
                    let upsertDoc = {
                      updateOne: {
                        filter: {
                          service: s.name,
                          key: key,
                          value: v,
                          lastSeen: roundDate(new Date().getTime())
                        },
                        update: {
                          $set: {
                            service: s.name,
                            key: key,
                            value: v,
                            lastSeen: roundDate(new Date().getTime())
                          }
                        },
                        upsert: true
                      }
                    }
                    bulkTagOps.push(upsertDoc)
                  })
                }
              }
              if (bulkTagOps.length > 0) {
                TagModel.collection
                  .bulkWrite(bulkTagOps)
                  .then((result) => {
                    tagSpan.end()
                    if (result.upsertedCount > 0) {
                      logger.info(
                        `Upserted ${result.upsertedCount} tags for trace ${span_guid}`
                      )
                    }
                    cb(null, 'done')
                  })
                  .catch((err) => {
                    tagSpan.setAttribute('error', true)
                    tagSpan.end()
                    cb(err.message, null)
                  })
              }
            })
          ],
          (err, results) => {
            if (err) {
              span.setAttribute('error', true)
              logger.error(JSON.stringify(err, null, 2))
              span.addEvent(
                'errorMessage',
                JSON.stringify(err.message, null, 2)
              )
            } else {
              logger.info(`Upserted tags and edges for trace ${span_guid}`)
            }
            span.end()
          }
        )
      })
      .catch((err) => {
        // FIXME: Retry if weren't able to get the trace for some reason
        span.setAttribute('error', true)
        span.end()
        logger.error(`${err} for ${span_guid}`)
      })
  })
}

function startMixer() {
  logger.info('Starting Mixer')

  let throttledUpdateServiceMap = limiter.wrap(updateServiceMap)
  subscriber.on('message', function (channel, span_guid) {
    throttledUpdateServiceMap(span_guid)
  })
  subscriber.subscribe('traces')
}

module.exports = {
  startMixer
}
