const mongoose = require('mongoose')
const Schema = mongoose.Schema

let serviceSchema = new Schema(
  {
    name: {
      type: String
    },
    lastSeen: {
      type: Date
    }
  },
  {
    collection: 'services'
  }
)

module.exports = mongoose.model('Service', serviceSchema)
