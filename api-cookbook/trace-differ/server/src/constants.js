// MongoDB
const DATABASE = 'mongodb://lightstep:lightstep@127.0.0.1:27017/lightstep'

// Lightstep API
const HOST = 'https://api.lightstep.com'
const ORG = process.env.LIGHTSTEP_ORG || ''
const PROJECT = process.env.LIGHTSTEP_PROJECT || ''
const API_KEY = process.env.LIGHTSTEP_API_KEY || ''

module.exports = {
  DATABASE: DATABASE,
  HOST: HOST,
  ORG: ORG,
  PROJECT: PROJECT,
  API_KEY: API_KEY
}
