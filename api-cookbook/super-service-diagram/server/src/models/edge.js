const mongoose = require('mongoose')
const Schema = mongoose.Schema

let edgeSchema = new Schema(
  {
    to: {
      type: String
    },
    from: {
      type: String
    },
    lastSeen: {
      type: Number,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v)
    }
  },
  {
    collection: 'edges'
  }
)

module.exports = mongoose.model('Edge', edgeSchema)
