const { tracer } = require('./tracer')
const { context, setSpan, getSpan } = require('@opentelemetry/api')

const redis = require('redis')
const subscriber = redis.createClient()
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
    host: '127.0.0.1',
    port: 6379
  }
})

function parseTrace(spans, reporters) {
  // Create a service map of nodes and edges between services
  let services = {}
  reporters.forEach((r) => {
    // Assuming unique values per trace
    services[r['reporter-id']] = {
      name: r.attributes['lightstep.component_name'],
      tags: { platform: [r.attributes['lightstep.tracer_platform']] }
    }
  })
  let refinedSpans = {}
  spans.forEach((s) => {
    r_id = s['reporter-id']
    refinedSpans[s['span-id']] = {
      parentId: s.tags.parent_span_guid ? s.tags.parent_span_guid : '',
      service: r_id,
      startTime: s['start-time-micros'] / 1000000
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
    let s1 = services[value.service].name
    if (value.parentId != '') {
      let s2 = services[refinedSpans[value.parentId].service].name
      if (!edges[s2]) {
        edges[s2] = {}
      }
      if (s1 != s2 && !Object.keys(edges[s2]).includes(s1)) {
        edges[s2][s1] = value.startTime
      }
    }
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

        // Add Edges in Mongo
        const edgeSpan = tracer.startSpan('addEdges')
        let today = new Date()
        let bulkOps = []
        for (let [key, value] of Object.entries(parsed.edges)) {
          for (let [k, v] of Object.entries(value)) {
            let upsertDoc = {
              updateOne: {
                filter: {
                  to: k,
                  from: key,
                  lastSeen: Date.parse(
                    today.getUTCFullYear(),
                    today.getUTCMonth() + 1,
                    today.getUTCDate()
                  )
                },
                update: {
                  $set: {
                    to: k,
                    from: key,
                    lastSeen: Date.parse(
                      today.getUTCFullYear(),
                      today.getUTCMonth() + 1,
                      today.getUTCDate()
                    )
                  }
                },
                upsert: true
              }
            }
            bulkOps.push(upsertDoc)
          }
        }
        EdgeModel.collection
          .bulkWrite(bulkOps)
          .then((result) => {
            if (result.upsertedCount > 0) {
              logger.info(
                `Upserted ${result.upsertedCount} edges for trace ${span_guid}`
              )
            }
            edgeSpan.end()
          })
          .catch((err) => {
            edgeSpan.setAttribute('error', true)
            edgeSpan.end()
            logger.error(JSON.stringify(err, null, 2))
          })
          .finally(() => {
            const tagSpan = tracer.startSpan('addTags')
            bulkOps = []
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
                        lastSeen: Date.parse(
                          today.getUTCFullYear(),
                          today.getUTCMonth() + 1,
                          today.getUTCDate()
                        )
                      },
                      update: {
                        $set: {
                          service: s.name,
                          key: key,
                          value: v,
                          lastSeen: Date.parse(
                            today.getUTCFullYear(),
                            today.getUTCMonth() + 1,
                            today.getUTCDate()
                          )
                        }
                      },
                      upsert: true
                    }
                  }
                  bulkOps.push(upsertDoc)
                })
              }
            }
            TagModel.collection
              .bulkWrite(bulkOps)
              .then((result) => {
                tagSpan.end()
                span.end()
                if (result.upsertedCount > 0) {
                  logger.info(
                    `Upserted ${result.upsertedCount} tags for trace ${span_guid}`
                  )
                }
              })
              .catch((err) => {
                tagSpan.setAttribute('error', true)
                tagSpan.end()
                span.end()
                logger.error(JSON.stringify(err, null, 2))
              })
          })
      })
      .catch((err) => {
        // TODO: retry
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
