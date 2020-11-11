const mongoose = require('mongoose')
const Schema = mongoose.Schema

let querySchema = new Schema(
  {
    query: {
      type: String
    },
    name: {
      type: String
    },
    createdAt: {
      type: Number
    },
    groupByKeys: {
      type: Array
    }
  },
  {
    collection: 'queries'
  }
)

module.exports = mongoose.model('Query', querySchema)
