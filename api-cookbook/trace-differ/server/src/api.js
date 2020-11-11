let axios = require('axios')
let constants = require('./constants')

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

// API Methods (api-docs.lightstep.com)

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

module.exports = {
  api,
  createSnapshot,
  getSnapshot,
  getStoredTrace
}
