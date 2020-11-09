const mongoose = require('mongoose')
const Schema = mongoose.Schema

let snapshotSchema = new Schema(
  {
    snapshotId: {
      type: String
    },
    completeTime: {
      type: Number
    },
    createdAt: {
      type: Number
    },
    query: {
      type: String
    },
    attributes: {
      type: Object
    },
    spans: {
      type: Array
    },
    link: {
      type: String
    }
  },
  {
    collection: 'snapshots'
  }
)

module.exports = mongoose.model('Snapshot', snapshotSchema)
