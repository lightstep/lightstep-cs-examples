let Bottleneck = require('bottleneck')
let redis = require('redis')
let subscriber = redis.createClient()
let logger = require('./logger')

let api = require('./api')

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
      if (!services[r_id].tags[key]) {
        services[r_id].tags[key] = []
      }
      if (
        value != 'parent_span_guid' &&
        !services[r_id].tags[key].includes(value)
      ) {
        services[r_id].tags[key].push(value)
      }
    }
  })
  let edges = []

  for (let [sid, value] of Object.entries(refinedSpans)) {
    let s1 = services[value.service].name
    if (value.parentId != '') {
      let s2 = services[refinedSpans[value.parentId].service].name
      if (!edges[s2]) {
        edges[s2] = []
      }
      if (s1 != s2 && !edges[s2].includes(s1)) {
        edges[s2].push(s1)
      }
    }
  }

  return {
    services: services,
    edges: edges
  }
}

async function updateServiceMap(span_guid) {
  api
    .getStoredTrace(span_guid)
    .then((res) => {
      let services = parseTrace(
        res.data[0].attributes.spans,
        res.data[0].relationships.reporters
      )
      console.log(services)
      // Update the services in Mongo
    })
    .catch((err) => {
      // TODO: retry
      logger.error(err)
    })
}

function startMixer() {
  logger.info('Starting Mixer')

  let limiter = new Bottleneck({
    minTime: 200 // 5 per second limit
  })
  let throttledUpdateServiceMap = limiter.wrap(updateServiceMap)
  subscriber.on('message', function (channel, span_guid) {
    logger.info(`Received span_guid: ${span_guid}`)
    throttledUpdateServiceMap(span_guid)
  })
  subscriber.subscribe('traces')
}

module.exports = {
  startMixer
}
