const express = require('express')
const QueryRoute = express.Router()

let QueryModel = require('../models/query')

QueryRoute.route('/queries').get((req, res) => {
  QueryModel.find((error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

QueryRoute.route('/queries').post((req, res, next) => {
  QueryModel.create(req.body, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

QueryRoute.route('/queries/:id').get((req, res) => {
  QueryModel.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

QueryRoute.route('/queries/:id').delete((req, res, next) => {
  QueryModel.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.status(200).json({
        msg: data
      })
    }
  })
})

module.exports = QueryRoute
