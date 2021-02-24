// MongoDB
const MONGO_URL = 'mongodb://lightstep:lightstep@127.0.0.1:27017/lightstep'

// Lightstep API
const HOST = 'https://api.lightstep.com'
const ORG = process.env.LIGHTSTEP_ORG || 'LightStep'
const PROJECT = process.env.LIGHTSTEP_PROJECT || 'demo'
const API_KEY = process.env.LIGHTSTEP_API_KEY || ''
const LS_ACCESS_TOKEN = process.env.LIGHTSTEP_ACCESS_TOKEN || ''

const STREAM_TIME_AGO_MINUTES = 10
const STREAM_TIME_RANGE_MINUTES = 2

module.exports = {
  MONGO_URL,
  HOST,
  ORG,
  PROJECT,
  API_KEY,
  LS_ACCESS_TOKEN,
  STREAM_TIME_AGO_MINUTES,
  STREAM_TIME_RANGE_MINUTES
}
