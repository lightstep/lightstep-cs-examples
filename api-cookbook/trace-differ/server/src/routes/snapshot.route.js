const express = require('express')
const snapshotRoute = express.Router()

let SnapshotModel = require('../models/snapshot')

snapshotRoute.route('/snapshots').get((req, res, next) => {
  SnapshotModel.find((error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

snapshotRoute.route('/snapshots').post((req, res, next) => {
  SnapshotModel.create(req.body, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

snapshotRoute.route('/snapshots/:id').get((req, res, next) => {
  SnapshotModel.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

// Delete snapshot
snapshotRoute.route('/snapshots/:id').delete((req, res, next) => {
  SnapshotModel.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.status(200).json({
        msg: data
      })
    }
  })
})

module.exports = snapshotRoute
