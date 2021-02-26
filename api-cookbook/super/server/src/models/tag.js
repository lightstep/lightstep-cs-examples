const mongoose = require('mongoose')
const Schema = mongoose.Schema

let tagSchema = new Schema(
  {
    key: {
      type: String
    },
    value: {
      type: String
    },
    service: {
      type: String
    },
    lastSeen: {
      type: Number,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v)
    }
  },
  {
    collection: 'tags'
  }
)

module.exports = mongoose.model('Tag', tagSchema)
