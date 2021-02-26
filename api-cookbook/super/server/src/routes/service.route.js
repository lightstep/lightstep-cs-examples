const express = require('express')
const serviceRoute = express.Router()

let ServiceModel = require('../models/service')
let TagModel = require('../models/tag')
let EdgeModel = require('../models/edge')

serviceRoute.route('/services').get((req, res, next) => {
  let response = { services: [] }
  ServiceModel.find((error, svcs) => {
    if (error) {
      return next(error)
    } else {
      if (req.body.attribute) {
        // find the tag values and append to the service when they were seen
        let youngestTime = req.body['youngest-time']
          ? Date.parse(req.body['youngest-time'])
          : Date.now()
        let oldestTime = req.body['oldest-time']
          ? Date.parse(req.body['oldest-time'])
          : youngestTime - 60000 * 1440 * 5 // default is last 5 days

        // TODO: Validate time range
        // TODO: Validate attribute
        TagModel.find(
          {
            $and: [
              { key: req.body.attribute },
              {
                $and: [
                  {
                    lastSeen: { $lte: youngestTime }
                  },

                  {
                    lastSeen: { $gte: oldestTime }
                  }
                ]
              }
            ]
          },
          (err, tags) => {
            if (err) {
              return next(error)
            } else {
              // combine services and tags
              svcs.forEach((s) => {
                let serviceTags = tags.filter((t) => {
                  return t.service == s.name
                })
                serviceTags = serviceTags.map((t) => {
                  return {
                    value: t.value,
                    lastSeen: new Date(t.lastSeen)
                  }
                })
                response.services.push({
                  name: s.name,
                  lastSeen: new Date(s.lastSeen),
                  attributes: {
                    [req.body.attribute]: serviceTags
                  }
                })
              })
              res.json(response)
            }
          }
        )
      } else {
        response.services = svcs.map((s) => {
          return { name: s.name, lastSeen: new Date(s.lastSeen) }
        })
        res.json(response)
      }
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

serviceRoute.route('/services/diagram').get((req, res, next) => {
  let svcs = []
  let nodes = []
  let links = []

  EdgeModel.find((error, edges) => {
    if (error) {
      return next(error)
    } else {
      links = edges.map((e) => {
        if (!svcs.includes(e.from)) {
          svcs.push(e.from)
          nodes.push({ name: e.from })
        }
        if (!svcs.includes(e.to)) {
          svcs.push(e.to)
          nodes.push({ name: e.to })
        }

        return {
          to: e.to,
          from: e.from
        }
      })
      res.json({
        services: nodes,
        edges: links
      })
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
