const mongoose = require('mongoose')
const Schema = mongoose.Schema

let diffSchema = new Schema(
  {
    query: {
      type: String
    },
    calculatedAt: {
      type: Number
    },
    linkA: {
      type: String
    },
    linkB: {
      type: String
    },
    diffs: {
      type: Array
    }
  },
  {
    collection: 'diffs'
  }
)

module.exports = mongoose.model('Diff', diffSchema)
