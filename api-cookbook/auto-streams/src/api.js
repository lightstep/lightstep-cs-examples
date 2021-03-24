const axios = require('axios')
const constants = require('./constants')
const { tracer } = require('./tracer')
const { context, setSpan } = require('@opentelemetry/api')

if (
  constants.LIGHTSTEP_ORG == '' ||
  constants.LIGHTSTEP_PROJECT == '' ||
  constants.LIGHTSTEP_API_KEY == ''
) {
  console.error(
    'Please set the environment variables: LIGHTSTEP_ORG, LIGHTSTEP_PROJECT, LIGHTSTEP_API_KEY'
  )
  process.exit(1) // exit if the variables have not been set
}

const api = axios.create({
  baseURL: `${constants.LIGHTSTEP_HOST}/public/v0.2/${constants.LIGHTSTEP_ORG}/projects/${constants.LIGHTSTEP_PROJECT}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${constants.LIGHTSTEP_API_KEY}`
  }
})

// API Methods
function getServices() {
  let url = `/directory/services`
  return new Promise((resolve, reject) => {
    const span = tracer.startSpan('getServices')
    context.with(setSpan(context.active(), span), () => {
      api
        .get(url)
        .then((response) => {
          span.end()
          resolve(response.data)
        })
        .catch((error) => {
          span.setAttribute('error', true)
          span.end()
          reject(error)
        })
    })
  })
}

function getStreams() {
  let url = `/streams`
  return new Promise((resolve, reject) => {
    const span = tracer.startSpan('getStreams')
    context.with(setSpan(context.active(), span), () => {
      api
        .get(url)
        .then((response) => {
          span.end()
          resolve(response.data)
        })
        .catch((error) => {
          span.setAttribute('error', true)
          span.end()
          reject(error)
        })
    })
  })
}

function getDashboards() {
  let url = `/dashboards`
  return new Promise((resolve, reject) => {
    const span = tracer.startSpan('getDashboards')
    context.with(setSpan(context.active(), span), () => {
      api
        .get(url)
        .then((response) => {
          span.end()
          resolve(response.data)
        })
        .catch((error) => {
          span.setAttribute('error', true)
          span.end()
          reject(error)
        })
    })
  })
}

function createStream(query, name) {
  var body = JSON.stringify({
    data: {
      attributes: {
        name: name ? name : query,
        query: query
      },
      type: 'stream'
    }
  })
  return new Promise((resolve, reject) => {
    api
      .post('/streams', body)
      .then(function (response) {
        resolve(response.data)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

module.exports = {
  api,
  getServices,
  getStreams,
  getDashboards,
  createStream
  // createDashboard
}
