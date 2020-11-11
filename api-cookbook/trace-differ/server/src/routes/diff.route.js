const express = require('express')
const diffRoute = express.Router()

let DiffModel = require('../models/diff')

diffRoute.route('/diffs').get((req, res) => {
  DiffModel.find((error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

diffRoute.route('/diffs').post((req, res, next) => {
  DiffModel.create(req.body, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

diffRoute.route('/diffs/:id').get((req, res) => {
  DiffModel.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

diffRoute.route('/diffs/:id').delete((req, res, next) => {
  DiffModel.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.status(200).json({
        msg: data
      })
    }
  })
})

module.exports = diffRoute
