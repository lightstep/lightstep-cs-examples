let axios = require('axios')

const HOST = 'http://api.lightstep.com'
const ORG = process.env.LIGHTSTEP_ORG || ''
const PROJECT = process.env.LIGHTSTEP_PROJECT || ''
const API_KEY = process.env.LIGHTSTEP_API_KEY || ''

if (ORG == '' || PROJECT == '' || API_KEY == '') {
  console.error(
    'Please set the environment variables: LIGHTSTEP_ORG, LIGHTSTEP_PROJECT, LIGHTSTEP_API_KEY'
  )
  process.exit(1)
}

const api = axios.create({
  baseURL: `${HOST}/public/v0.2/${ORG}/projects/${PROJECT}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + API_KEY
  }
})

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
  getSnapshot
}
