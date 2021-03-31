const express = require('express'),
  cors = require('cors'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser')

const constants = require('./constants'),
  scheduler = require('./scheduler'),
  mixer = require('./mixer'),
  logger = require('./logger')

const serviceAPI = require('./routes/service.route')
const tagAPI = require('./routes/tag.route')

// Initialize DB and start app
mongoose.Promise = global.Promise
mongoose
  .connect(constants.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(
    () => {
      logger.info('MongoDB Connected')
      runApp()
    },
    (error) => {
      logger.error('MongoDB could not be connected due to: ' + error)
    }
  )

// Application
function runApp() {
  const app = express()
  app.use(bodyParser.json())
  app.use(
    bodyParser.urlencoded({
      extended: false
    })
  )
  app.use(cors())

  app.use('/api', serviceAPI)
  app.use('/api', tagAPI)

  app.listen(8080, () => {
    logger.info('Super running on port: ' + 8080)
  })

  app.use((req, res, next) => {
    return res.status(404).send({ message: 'Route' + req.url + ' Not found.' })
  })

  app.use((err, req, res, next) => {
    logger.error(err.message)
    if (!err.statusCode) err.statusCode = 500
    res.status(err.statusCode).send(err.message)
  })
  mixer.startMixer()
  scheduler.startScheduler()
}
