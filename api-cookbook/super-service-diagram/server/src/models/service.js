const mongoose = require('mongoose')
const Schema = mongoose.Schema

let serviceSchema = new Schema(
  {
    name: {
      type: String
    },
    lastSeen: {
      type: Number,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v)
    }
  },
  {
    collection: 'services'
  }
)

module.exports = mongoose.model('Service', serviceSchema)
