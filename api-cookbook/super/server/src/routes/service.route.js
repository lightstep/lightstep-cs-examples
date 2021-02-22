const express = require('express')
const serviceRoute = express.Router()

let ServiceModel = require('../models/service')

serviceRoute.route('/services').get((req, res, next) => {
  ServiceModel.find((error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

serviceRoute.route('/services').post((req, res, next) => {
  ServiceModel.create(req.body, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

serviceRoute.route('/services/:id').get((req, res, next) => {
  ServiceModel.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

// Delete snapshot
serviceRoute.route('/services/:id').delete((req, res, next) => {
  ServiceModel.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.status(200).json({
        msg: data
      })
    }
  })
})

module.exports = serviceRoute
