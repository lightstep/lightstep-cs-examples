let Influx = require('influx'),
    axios = require('axios'),
    schedule = require('node-schedule');
    
const API_HOST = 'https://api.lightstep.com'
const API_ORG = process.env.LIGHTSTEP_ORG || ''
const API_PROJECT = process.env.LIGHTSTEP_PROJECT || ''
const API_KEY = process.env.LIGHTSTEP_API_KEY || ''

if (API_ORG == '' || API_PROJECT == '' || API_KEY == '') {
  console.error(
    "Please set the appropriate environment variables: LIGHTSTEP_ORG, LIGHTSTEP_PROEJCT, LIGHTSTEP_API_KEY"
  );
  process.exit(1);
}

// INFLUX DB
const influx = new Influx.InfluxDB({
  host: 'localhost', // change this if needed
  database: 'lightstep', // change this if needed 
  schema: [
    {
      measurement: 'rs',
      fields: {
        spans_count: Influx.FieldType.INTEGER,
        client_dropped_spans_count: Influx.FieldType.INTEGER,
        satellite_dropped_spans_count: Influx.FieldType.INTEGER,
        updated_micros: Influx.FieldType.INTEGER,
      },
      tags: [
        'service',
        'platform',
        'project'
      ]
    }
  ]
});

// LIGHTSTEP API 
const ls_api = axios.create({
  baseURL: `${API_HOST}/public/v0.2/${API_ORG}/projects/${API_PROJECT}`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

function getReportingStatus() {
  return new Promise((resolve, reject) => {
    ls_api
      .get("/reporting-status")
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};


// SCHEDULER
const INTERVAL_MINUTE = 1;

function syncReportingStatus(params) {
  console.log('Syncing Reporting Status')
  getReportingStatus().then((res) => {
    // Map the returned data to a points array for influxdb 
    let points = res.data.status.map((s) => {
      return {
        measurement: 'rs',
        fields: {
          spans_count: s.spans_count,
          client_dropped_spans_count: s.dropped_spans_count,
          satellite_dropped_spans_count: s.collector_dropped_spans_count,
          updated_micros: s.updated_micros
        },
        tags: {
          service: s.component_name,
          platform: s.platform,
          project: constants.PROJECT
        }
      }
    })
    // Write to influxdb
    influx.writePoints(points).then(() => {
      console.log(`${points.length} points written to influxdb`)
    }).catch((err) => {
      console.error(`Error writing points to influxdb: ${err}`)
    })
  }).catch((err) => {
    console.error(`Error getting data from Lightstep: ${err}` )
  })
}

function startScheduler() {
  let rule = new schedule.RecurrenceRule()
  rule.minute = new schedule.Range(0, 59, INTERVAL_MINUTE)

  console.log('Running reporting status scheduler')
  schedule.scheduleJob(rule, () => {
    syncReportingStatus()
  })
}

startScheduler()
