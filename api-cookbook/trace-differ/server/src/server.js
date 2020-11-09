let express = require('express'),
  cors = require('cors'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  database = require('./database'),
  scheduler = require('./scheduler'),
  logger = require('./logger')

mongoose.Promise = global.Promise
mongoose
  .connect(database.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(
    () => {
      logger.info('MongoDB Connected')
    },
    (error) => {
      logger.error('MongoDB could not be connected due to: ' + error)
    }
  )

const snapshotAPI = require('./routes/snapshot.route')
const diffAPI = require('./routes/diff.route')
const queryAPI = require('./routes/query.route')

const app = express()
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(cors())

app.use('/api', snapshotAPI)
app.use('/api', diffAPI)
app.use('/api', queryAPI)

const port = process.env.APP_PORT || 4000

app.listen(port, () => {
  logger.info('Trace Differ running on port: ' + port)
})

app.use((req, res, next) => {
  return res.status(404).send({ message: 'Route' + req.url + ' Not found.' })
})

app.use((err, req, res, next) => {
  logger.error(err.message)
  if (!err.statusCode) err.statusCode = 500
  res.status(err.statusCode).send(err.message)
})

scheduler.startScheduler()
