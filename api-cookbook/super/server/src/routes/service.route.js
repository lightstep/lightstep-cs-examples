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
      // You can pass in an attribute to get just it's values for each service
      // TODO: This should probably be elsewhere maybe in tag route.
      if (req.query.attribute && req.query.attribute != '') {
        console.log('here')
        // find the tag values and append to the service when they were seen
        let youngestTime = req.query['youngest-time']
          ? Date.parse(req.query['youngest-time'])
          : Date.now()
        let oldestTime = req.query['oldest-time']
          ? Date.parse(req.query['oldest-time'])
          : youngestTime - 60000 * 1440 * 30 // default is last 30 days

        // TODO: Validate time range
        // TODO: Validate attribute
        let attribute = req.query.attribute
        TagModel.find(
          {
            $and: [
              { key: attribute },
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
                // FIXME: Order by latest value seen
                serviceTags.sort((a, b) => {
                  return b.lastSeen - a.lastSeen
                })

                response.services.push({
                  name: s.name,
                  lastSeen: new Date(s.lastSeen),
                  attributes: {
                    [attribute]: serviceTags.slice(0, 5) // FIXME: Only return 10 latest values
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

// TODO: Move this to Edge route
serviceRoute.route('/services/diagram').get((req, res, next) => {
  let svcs = []
  let nodes = []
  let links = []
  // Get the super static service diagram
  EdgeModel.find((error, edges) => {
    if (error) {
      console.log(error)
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

module.exports = serviceRoute
