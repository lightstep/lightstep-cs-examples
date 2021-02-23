let axios = require('axios')
let constants = require('./constants')
let logger = require('./logger')

if (constants.ORG == '' || constants.PROJECT == '' || constants.API_KEY == '') {
  console.error(
    'Please set the environment variables: LIGHTSTEP_ORG, LIGHTSTEP_PROJECT, LIGHTSTEP_API_KEY'
  )
  process.exit(1) // exit if the variables have not been set
}

// Create the main client
const api = axios.create({
  baseURL: `${constants.HOST}/public/v0.2/${constants.ORG}/projects/${constants.PROJECT}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${constants.API_KEY}`
  }
})

// API Methods
function getServices() {
  let url = `/directory/services`
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function getTime() {
  let timezone_offset_min = new Date().getTimezoneOffset()
  let offset_hrs = parseInt(Math.abs(timezone_offset_min / 60))
  let offset_min = Math.abs(timezone_offset_min % 60)
  let timezone_standard

  if (offset_hrs < 10) {
    offset_hrs = '0' + offset_hrs
  }

  if (offset_min < 10) {
    offset_min = '0' + offset_min
  }

  if (timezone_offset_min < 0) {
    timezone_standard = '+' + offset_hrs + ':' + offset_min
  } else if (timezone_offset_min > 0) {
    timezone_standard = '-' + offset_hrs + ':' + offset_min
  } else if (timezone_offset_min == 0) {
    timezone_standard = '-00:00'
  }

  timezone_standard = '-00:00' // FIXME: Remove this

  let now = new Date()
  let oldest =
    new Date(now - 10 * 60000).toISOString().split('.')[0] + timezone_standard
  let youngest = now.toISOString().split('.')[0] + timezone_standard
  return {
    oldest: oldest,
    youngest: youngest
  }
}

function getStreams() {
  let url = `/streams`
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function getStreamTimeseries(streamId) {
  // Returns the timeseries of the past 10 minutes
  let time = getTime()
  let url = `/streams/${streamId}/timeseries?oldest-time=${time.oldest}&youngest-time=${time.youngest}&resolution-ms=60000&include-exemplars=1`
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function getStoredTrace(spanId) {
  let url = `/stored-traces?span-id=${spanId}`
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function createSnapshot(query) {
  var body = JSON.stringify({
    data: {
      attributes: {
        query: query
      }
    }
  })
  return new Promise((resolve, reject) => {
    api
      .post('/snapshots', body)
      .then(function (response) {
        resolve(response.data)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

function getSnapshot(id, params) {
  let url = `/snapshots/${id}`
  if (Object.keys(params).length > 0) {
    url = `${url}?`
    Object.keys(params).forEach((p) => {
      url = `${url}${p}=${params[p]}`
    })
  }
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

module.exports = {
  api,
  createSnapshot,
  getSnapshot,
  getStoredTrace,
  getServices,
  getStreams,
  getStreamTimeseries
}
