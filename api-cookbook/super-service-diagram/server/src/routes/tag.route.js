const express = require('express')
const tagRoute = express.Router()

let TagModel = require('../models/tag')

tagRoute.route('/attributes').get((req, res, next) => {
  let response = { attributes: [] }
  // TODO: probably bring this out to some middleware
  let youngestTime = req.query['youngest-time']
    ? Date.parse(req.query['youngest-time'])
    : Date.now()
  let oldestTime = req.query['oldest-time']
    ? Date.parse(req.query['oldest-time'])
    : youngestTime - 60000 * 1440 * 30 // default is last 30 days
  TagModel.find({
    $and: [
      {
        lastSeen: { $lte: youngestTime }
      },
      {
        lastSeen: { $gte: oldestTime }
      }
    ]
  }).distinct('key', (err, attributes) => {
    if (err) {
      return next(error)
    } else {
      attributes.forEach((a) => {
        response.attributes.push({
          name: a
        })
      })
      res.json(response)
    }
  })
})

tagRoute.route('/attributes/:name').get((req, res, next) => {
  let response = { attributes: [] }
  // TODO: probably bring this out to some middleware
  let youngestTime = req.query['youngest-time']
    ? Date.parse(req.query['youngest-time'])
    : Date.now()
  let oldestTime = req.query['oldest-time']
    ? Date.parse(req.query['oldest-time'])
    : youngestTime - 60000 * 1440 * 30 // default is last 30 days

  TagModel.find(
    {
      $and: [
        { key: req.params.name },
        {
          lastSeen: { $lte: youngestTime }
        },
        {
          lastSeen: { $gte: oldestTime }
        }
      ]
    },
    (err, tags) => {
      if (err) {
        return next(error)
      } else {
        let values = []
        tags.forEach((t) => {
          values.push({
            value: t.value,
            service: t.service,
            lastSeen: new Date(t.lastSeen)
          })
        })
        response.attributes.push({
          attribute: req.params.name,
          values: values
        })
        res.json(response)
      }
    }
  )
})

module.exports = tagRoute
