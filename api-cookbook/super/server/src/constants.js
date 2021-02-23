// MongoDB
const MONGO_URL = 'mongodb://lightstep:lightstep@127.0.0.1:27017/lightstep'
const REDIS_URL = 'redis://127.0.0.1:6379'

// Lightstep API
const HOST = 'https://api.lightstep.com'
const ORG = process.env.LIGHTSTEP_ORG || 'LightStep'
const PROJECT = process.env.LIGHTSTEP_PROJECT || 'demo'
const API_KEY = process.env.LIGHTSTEP_API_KEY || ''

module.exports = {
  MONGO_URL,
  REDIS_URL,
  HOST,
  ORG,
  PROJECT,
  API_KEY
}
