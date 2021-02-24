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
      type: Number
    }
  },
  {
    collection: 'edges'
  }
)

module.exports = mongoose.model('Edge', edgeSchema)
