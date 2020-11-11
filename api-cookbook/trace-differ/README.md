# Trace Differ

Lightstep recently added several [new APIs](https://api-docs.lightstep.com/reference) to help developers access the high value data being sent to Lightstep from their systems and integrate the rich analysis built on that data into their existing workflows.

Lightstep customers send trillions of spans from their applications to [Lightstep Satellites](https://lightstep.com/how-it-works) hosted and managed in their own environments. Data going to the Satellites is not sampled at the clients. This ensures that when a user is querying for this data in Lightstep, 100% of the un-sampled data is available for real-time analysis. Lightstep Satellites then use intelligent, dynamic sampling to ensure behavior outliers and anomalies are always well represented, as well as the RED metrics and histograms are created with the full representative data set. The outcome of this query in [Explorer](https://docs.lightstep.com/docs/query-span-data) is saved in a ["Snapshot"](https://docs.lightstep.com/docs/query-span-data#view-snapshots) in our SaaS.

A Snapshot contains rich analysis data that is very useful for investigating issues, so why not supercharge it with building more custom functionality on top of it? We can use the new [Snapshot APIs](https://api-docs.lightstep.com/reference#snapshots) to programmatically diff two snapshots in time. This is the **Trace Diffing** use case, where we can define critical request paths (traces) in our system and automatically track when deviations or anomalies occur.

## Overview

In this tutorial, we will setup a the following simple workflow:

**1. Define important queries that we want to track** - The Explorer in Lightstep lets you choose any arbitrary set of `service`, `operation`, and `attributes` to create a targeted and dynamic query. This helps to narrow down your analysis to a specific set of data during your investigation, reducing MTTR. For demo purposes, we will choose a simple query, `service IN ("android")` from our [Sandbox](https://app.lightstep.com/play) demo data.

**2. Set up automatic snapshot creation** - Once the query is defined, we will create snapshots of the data every 10 minutes (configurable), this will ensure that we are pulling the relevant analysis and underlying data back to the SaaS periodically and we can run further analyses on it.

**3. Find the differences between two snapshots** - For two given snapshots, and a set of keys to group by (think attributes like `customer`, `region`, `http.status_code`, etc.), we will take the entire underlying trace datasets from the snapshots and find whether any values are missing, if there are any new values, or for ones that exist in both snapshots, if there are significant changes in RED metrics.

## Prerequisites

- You will need a Lightstep account and a Lightstep API key. [Get it here](https://docs.lightstep.com/docs/create-and-manage-api-keys).
- Docker and `docker-compose` installed on your machine
- `node` and `npm` installed on your machine

## Tutorial

> **NOTE:** The entire code for this application [is available on GitHub](https://github.com/lightstep/lightstep-cs-examples/api-cookbook/trace-differ) if you'd like to follow along.

We will setup a simple MEVN stack for this application:

- MongoDB - To store the queries, snapshot data, and diffs
- ExpressJS - REST API to interact with the application
- VueJS - An experimental client UI to visualize results

```shell
$ mkdir trace-differ
```

### 1. MongoDB

Create a `docker-compose.yml` for MongoDB

```shell
$ cd trace-differ && touch docker-compose.yml
```

```yaml
# docker-compose.yml

version: "3"
services:
  database:
    image: "mongo"
    container_name: "mongo-db-container"
    environment:
      - MONGO_INITDB_DATABASE=lightstep
      - MONGO_INITDB_ROOT_USERNAME=lightstep
      - MONGO_INITDB_ROOT_PASSWORD=lightstep
    volumes:
      - ./db/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
      - ./db/mongo-volume:/data/db
    ports:
      - "27017-27019:27017-27019"
```

Create a `db` directory to hold the mongo volume data and the initialization script.

```shell
trace-differ$ mkdir db && touch db/init-mongo.js
```

```javascript
/* init-mongo.js */

db.createUser({
  user: "lightstep",
  pwd: "lightstep",
  roles: [
    {
      role: "readWrite",
      db: "lightstep",
    },
  ],
});
```

Now, let's start MongoDB

```shell
trace-differ$ docker-compose up -d
```

### 2. Server

Let's initalize a NodeJS application with a REST server with Express, and a data model with Mongoose to access MongoDB.

```shell
trace-differ$ mkdir server && cd server
server$ npm init # Go through the standards directions of npm
```

Install the required packages

```shell
server$ npm install --save async axios body-parser cors express moment mongoose node-schedule
server$ npm install --save-dev winston prettier nodemon eslint eslint-plugin-prettier babel-eslint
```

Explanation of packages:

- `async` - asynchronous operations we will be running including accessing Lightstep APIs
- `axios` - client for making HTTP calls
- `body-parser`, `cors`, `express` - for setting up our server
- `mongoose` - MongoDB data modeling
- `moment` - time related operations
- `node-schedule` - chron based scheduler

The others are utilities I use in local development and are optional.

---

Set up a constants file to store values like DB connection string, API keys, etc.

```shell
server$ touch constants.js
```

```javascript
/* constants.js */

// MongoDB
const DATABASE = "mongodb://lightstep:lightstep@127.0.0.1:27017/lightstep";

// Lightstep API Values
// Set these here or as environment variables
const HOST = "https://api.lightstep.com";
const ORG = process.env.LIGHTSTEP_ORG || "";
const PROJECT = process.env.LIGHTSTEP_PROJECT || "";
const API_KEY = process.env.LIGHTSTEP_API_KEY || "";

module.exports = {
  DATABASE: DATABASE,
  HOST: HOST,
  ORG: ORG,
  PROJECT: PROJECT,
  API_KEY: API_KEY,
};
```

---

Define our data models with Mongoose.

```shell
server$ mkdir models && cd models
models$ touch diff.js query.js snapshot.js
```

Here is the example for `query.js`, the rest are available in the [code repo](https://github.com/lightstep/lightstep-cs-examples/api-cookbook/trace-differ/server/src/models).

```javascript
/* query.js */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let querySchema = new Schema(
  {
    query: {
      type: String,
    },
    name: {
      type: String,
    },
    createdAt: {
      type: Number,
    },
    groupByKeys: {
      type: Array,
    },
  },
  {
    collection: "queries",
  }
);

module.exports = mongoose.model("Query", querySchema);
```

---

Create the Express routes to handle each entity in our data model.

```shell
server$ mkdir routes && cd routes
routes$ touch diff.route.js snapshot.route.js query.route.js
```

Here is `query.route.js` for example. A simple CRUD scaffold using Mongoose. The rest are available in the [code repo](https://github.com/lightstep/lightstep-cs-examples/api-cookbook/trace-differ/server/src/routes).

```javascript
/* query.route.js */

const express = require("express");
const QueryRoute = express.Router();

let QueryModel = require("../models/query");

QueryRoute.route("/queries").get((req, res) => {
  QueryModel.find((error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

QueryRoute.route("/queries").post((req, res, next) => {
  QueryModel.create(req.body, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

QueryRoute.route("/queries/:id").get((req, res) => {
  QueryModel.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

QueryRoute.route("/queries/:id").delete((req, res, next) => {
  QueryModel.findByIdAndRemove(req.params.id, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.status(200).json({
        msg: data,
      });
    }
  });
});

module.exports = QueryRoute;
```

---

Put it all together in a `server.js`. This file will start a connection to our MongoDB instance, import our `server/routes` and initialize an ExpressJS server.

> I like using `winston` for logging, so I usually write the [`logger.js`](./server/src/logger.js) in my applications and use that instead of the regular console.

```shell
server$ touch server.js
```

```javascript
/* server.js */

let express = require("express"),
  cors = require("cors"),
  mongoose = require("mongoose"),
  bodyParser = require("body-parser"),
  constants = require("./constants"),
  scheduler = require("./scheduler"),
  logger = require("./logger");

const snapshotAPI = require("./routes/snapshot.route");
const diffAPI = require("./routes/diff.route");
const queryAPI = require("./routes/query.route");

mongoose.Promise = global.Promise;
mongoose
  .connect(constants.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(
    () => {
      logger.info("MongoDB Connected");
      runApp();
    },
    (error) => {
      logger.error("MongoDB could not be connected due to: " + error);
    }
  );

// We wait for DB connection to initialize
function runApp() {
  const app = express();
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: false,
    })
  );
  app.use(cors());

  app.use("/api", snapshotAPI);
  app.use("/api", diffAPI);
  app.use("/api", queryAPI);

  const port = process.env.APP_PORT || 4000;

  app.listen(port, () => {
    logger.info("Trace Differ running on port: " + port);
  });

  app.use((req, res, next) => {
    return res.status(404).send({ message: "Route" + req.url + " Not found." });
  });

  app.use((err, req, res, next) => {
    logger.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
  });

  scheduler.startScheduler();
}
```

You will notice that the last line of the code starts our scheduler, which we will get to later in this tutorial.

### 3. Directory

By default, the [GET /snapshot/:id](https://api-docs.lightstep.com/reference#getsnapshotbyid) API returns a list of exemplar spans, however, there is a lot more data lurking underneath the surface. When a Snapshot is created, Lightstep first tracks all the spans that match the query explicitly, and in the background starts trace assembly for all the traces that first set of spans were a part of. This data can be fetched separately using the [`GET /stored-traces`](https://api-docs.lightstep.com/reference#storedtracesid) API.

To this end, let's build a snapshot directory that will be responsible for creating snapshots, and fetching the related underlying data and storing it in MongoDB.

First, we will create a Lightstep API client using `axios`. We will need to call a few APIs: `POST /snapshots`, `GET /snapshot/:id`, and `GET /stored-traces`

> **Note:** This is optional, I like to keep it separate in case we want to swap this out for a different API in the future. This is also why we keep our data models separate.

```shell
server$ touch api.js
```

```javascript
/* api.js */

let axios = require("axios");
let constants = require("./constants");

if (constants.ORG == "" || constants.PROJECT == "" || constants.API_KEY == "") {
  console.error(
    "Please set the environment variables: LIGHTSTEP_ORG, LIGHTSTEP_PROJECT, LIGHTSTEP_API_KEY"
  );
  process.exit(1); // exit if the variables have not been set
}

// Create the main client
const api = axios.create({
  baseURL: `${constants.HOST}/public/v0.2/${constants.ORG}/projects/${constants.PROJECT}`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${constants.API_KEY}`,
  },
});

// API Methods (https://api-docs.lightstep.com)

function createSnapshot(query) {
  var body = JSON.stringify({
    data: {
      attributes: {
        query: query,
      },
    },
  });
  return new Promise((resolve, reject) => {
    api
      .post("/snapshots", body)
      .then(function (response) {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function getSnapshot(id, params) {
  let url = `/snapshots/${id}`;
  if (Object.keys(params).length > 0) {
    url = `${url}?`;
    Object.keys(params).forEach((p) => {
      url = `${url}${p}=${params[p]}`;
    });
  }
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function getStoredTrace(spanId) {
  let url = `/stored-traces?span-id=${spanId}`;
  return new Promise((resolve, reject) => {
    api
      .get(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

module.exports = {
  api,
  createSnapshot,
  getSnapshot,
  getStoredTrace,
};
```

Next, create a `directory.js` file that includes these functions:

- `createSnapshotForQuery` - Given a query object, create a Snapshot in Lightstep
- `fetchSnapshotData` - Once the Snapshot is ready, fetch all the underlying data
- `getExemplarsForSnapshot` and `getTracesForExemplars` - Helper functions to further call the APIs needed to fetch all traces comprising of a Snapshot

```shell
server$ touch directory.js
```

```javascript
/* directory.js */

let moment = require("moment");
let async = require("async");

let api = require("./api");
let logger = require("./logger");

let SnapshotModel = require("./models/snapshot");

function createSnapshotForQuery(q) {
  return new Promise((resolve, reject) => {
    api
      .createSnapshot(q.query)
      .then((res) => {
        snapshot = {
          snapshotId: res.data.id,
          query: q.query,
          createdAt: moment().unix(),
          completeTime: moment(res.data.attributes["complete-time"]).unix(),
          link: "", // TODO: create link to UI
        };
        // Save the Snapshot in our DB
        SnapshotModel.create(snapshot, (error, data) => {
          if (error) {
            reject(error);
          } else {
            logger.info(
              `Created snapshot ${res.data.id} for query: ${q.query} `
            );
            resolve(snapshot);
          }
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function fetchSnapshotData(snapshotId) {
  getExemplarsForSnapshot(snapshotId)
    .then((exemplars) => {
      getTracesForExemplars(exemplars)
        .then((spans) => {
          // Save snapshot data to DB
          SnapshotModel.findOneAndUpdate(
            { snapshotId: snapshotId },
            { $set: { spans: spans } },
            (error, data) => {
              if (error) {
                logger.error(error);
              } else {
                logger.info(
                  `Added ${spans.length} spans to snapshot ${snapshotId}`
                );
              }
            }
          );
        })
        .catch((err) => logger.error(err));
    })
    .catch((err) => logger.error(err));
}

function getExemplarsForSnapshot(snapshotId) {
  logger.info(`Getting snapshot ${snapshotId} exemplars`);
  return new Promise((resolve, reject) => {
    api
      .getSnapshot(snapshotId, { "include-exemplars": 1 })
      .then((res) => {
        if (res.data.attributes.exemplars) {
          resolve(res.data.attributes.exemplars);
        } else {
          reject(new Error("No snapshot data returned"));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getTracesForExemplars(exemplars) {
  exemplars = exemplars.map((s) => {
    return s["span-guid"];
  });

  return new Promise((resolve, reject) => {
    // TODO: Implement Retry to catch the Rate Limiting

    // We get the traces related to each exemplar span and
    // concatenate into one array
    async.reduce(
      exemplars,
      [],
      (memo, item, cb) => {
        api
          .getStoredTrace(item)
          .then((res) => {
            let spans = res.data[0].attributes.spans;
            // Service name is stored separately in the response
            let reporters = res.data[0].relationships.reporters;
            spans.forEach((s) => {
              let r = reporters.find(
                (obj) => obj["reporter-id"] == s["reporter-id"]
              );
              // Add service metadata to the span itself
              s.reporter = {
                id: r["reporter-id"],
                name: r.attributes["lightstep.component_name"],
                hostname: r.attributes["lightstep.hostname"],
              };
              delete s["reporter-id"];
            });
            cb(null, memo.concat(spans));
          })
          .catch((err) => {
            logger.warn(err);
            cb(null, memo.concat([]));
          });
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          // TODO: Remove duplicate entries if they exist
          resolve(result);
        }
      }
    );
  });
}

module.exports = {
  createSnapshotForQuery,
  fetchSnapshotData,
};
```

### 4. Differ

Now that we have a scaffold ready for creating snapshots and storing snapshot data, let's implement the trace diffing logic. Given a key (or multiple) to group by, for example `http.status_code`, we want to know how many different values of that attribute exist in each snapshot, if any are missing, if any are new, and for values that exist in both, what are the differences in their RED metrics.

We will walk through this file step by step.

```shell
server$ touch differ.js
```

```javascript
/* Import the required modules */

let moment = require("moment");
let async = require("async");

let logger = require("./logger");

let DiffModel = require("./models/diff");
let SnapshotModel = require("./models/snapshot");
```

```javascript
/* A function to diff two snapshots based on the above logic */

function diffSnapshots(query, aId, bId, groupByKeys) {
  // Get the span data for both snapshots from local DB
  async.mapValues(
    { a: aId, b: bId },
    function (id, key, cb) {
      SnapshotModel.find({ snapshotId: id }, (err, data) => {
        if (err) {
          cb(err, null);
        } else {
          cb(null, data);
        }
      });
    },
    (err, snapshots) => {
      if (err) {
        logger.error(err);
      } else {
        // Diff Snapshots by each group by key
        let groups = [];
        let aResults, bResults, diff;
        groupByKeys.forEach((k) => {
          // Calculate the group by analysis for both snapshots
          aResults = calculateGroupByAnalysis(snapshots.a[0].spans, k);
          bResults = calculateGroupByAnalysis(snapshots.b[0].spans, k);
          // Compare the group bys and create a diff object per key
          diff = compareAnalysis(aResults.groups, bResults.groups);
          diff.key = k;
          groups.push(diff);
        });

        // TODO: Set custom thresholds

        // Create and save a diff
        if (groups.length > 0) {
          let diff = {
            query: query,
            linkA: snapshots.a.link,
            linkB: snapshots.b.link,
            calculatedAt: moment().unix(),
            diffs: groups,
          };
          logger.info(
            `diff calculated for query {${query}} between snapshot ${aId} and ${bId}`
          );
          DiffModel.create(diff, (error, data) => {
            if (error) {
              logger.error(error);
            }
          });
        }
      }
    }
  );
}
```

```javascript
/* Do a group by key on the spans of a snapshot */

function calculateGroupByAnalysis(spans, groupByKey) {
  let groups = {};
  let groupLabels = new Set();
  spans.forEach((s) => {
    let label = "";
    if (groupByKey == "service") {
      label = s["reporter"]["name"];
    } else if (groupByKey == "operation") {
      label = s["span-name"];
    } else {
      label = s["tags"][groupByKey];
    }

    if (!groupLabels.has(label)) {
      // initialize the group
      groups[label] = {
        count: 0,
        latency_sum: 0,
        error_count: 0,
      };
      groupLabels.add(label);
    }

    // Update group statistics
    groups[label].count += 1;
    groups[label].error_count += s["is-error"] ? 1 : 0;
    groups[label].latency_sum += s["end-time-micros"] - s["start-time-micros"];
  });

  // Aggregate statistics
  let agg = [];
  Object.keys(groups).forEach((k) => {
    agg.push({
      value: k,
      occurrence: groups[k].count,
      avg_latency: Math.floor(groups[k].latency_sum / groups[k].count),
      error_ratio: groups[k].error_count / groups[k].count,
    });
  });

  let groupByResults = {
    "group-by-key": groupByKey,
    groups: agg,
  };
  return groupByResults;
}
```

```javascript
/* Compare two group by analyses and find the differences */

function compareAnalysis(a, b) {
  let aKeys = a.map((o) => {
    return o.value;
  });
  let bKeys = b.map((o) => {
    return o.value;
  });

  // Check for existence of keys in the groups
  let inBnotA = bKeys.filter((k) => {
    return !aKeys.includes(k);
  });
  let inAnotB = aKeys.filter((k) => {
    return !bKeys.includes(k);
  });
  let inBoth = bKeys.filter((k) => {
    return aKeys.includes(k);
  });

  // for values in both snapshots, calculate differences
  let diffs = inBoth.map((k) => {
    let x = a.find((o) => o.value == k);
    let y = b.find((o) => o.value == k);
    return {
      value: k,
      occurrence: y.occurrence - x.occurrence,
      avg_latency: y.avg_latency - x.avg_latency,
      error_ratio: Number(
        (
          (y.error_ratio ? y.error_ratio : 0) -
          (x.error_ratio ? x.error_ratio : 0)
        ).toFixed(2)
      ),
    };
  });
  return {
    new: inBnotA, // A is the older snapshot
    missing: inAnotB, // B is the newer snapshot
    diffs: diffs,
  };
}
```

### 5. Scheduler

Now, we can schedule creation and diffing of snapshots for a given query. When a snapshot is created, it takes some time to assemble the underlying traces and make them available for consumption. During this time, the pipe remains open to receive more data matching that quey. The API response from a Snapshot creation returns when the Snapshot will be completed. We will use that along with `node-schedule` to schedule fetching snapshot data when it is done.

The pseudocode for our scheduler is as follows:

- Every 10 minutes, for all queries in DB
  - Create a new Snapshot
  - Use the response from the API call to schedule fetching data
  - Compare the two latest snapshots for a query that have data and create a diff report

```shell
server$ touch scheduler.js
```

```javascript
/* scheduler.js */

let schedule = require("node-schedule");
let moment = require("moment");

let differ = require("./differ");
let directory = require("./directory");
let logger = require("./logger");

let QueryModel = require("./models/query");

const SNAPSHOT_DIFF_INTERVAL_MINUTES = 10;
const SNAPSHOT_CREATE_TIMEOUT_SECONDS = 10;
const SNAPSHOT_FETCH_TIMEOUT_SECONDS = 5;

function startScheduler() {
  let rule = new schedule.RecurrenceRule();
  rule.minute = new schedule.Range(0, 59, SNAPSHOT_DIFF_INTERVAL_MINUTES);

  QueryModel.find((err, queries) => {
    if (err) {
      logger.error(err);
    } else {
      queries.forEach((q) => {
        // Schedule checking of snapshots every 10 minutes and then create a new snapshot
        schedule.scheduleJob(rule, () => {
          differ.diffLatestSnapshotsForQuery(q);
          setTimeout(() => {
            directory
              .createSnapshotForQuery(q)
              .then((snapshot) => {
                let s = snapshot.completeTime + SNAPSHOT_FETCH_TIMEOUT_SECONDS;
                let t = moment.unix(s).toDate();
                schedule.scheduleJob(t, () => {
                  directory.fetchSnapshotData(snapshot.snapshotId);
                });
                logger.info(
                  `Scheduled fetching of Snapshot ${snapshot.snapshotId} at ${t}`
                );
              })
              .catch((err) => {
                logger.error(err);
              });
          }, SNAPSHOT_CREATE_TIMEOUT_SECONDS);
          // Timeout to create the new snapshot after diffing for two
          // latests snapshots has already started so that we don't
          // get stuck in a loop of only checking stale data
        });
      });
    }
  });
}

module.exports = {
  startScheduler,
};
```

## See it in action

After setting the relevant Lightstep specific variables in `server/constants.js`, run the server:

```shell
server$ node server.js
```

By default, no queries exist, so nothing will happen.

Since we set up a REST API for, we can use Postman or curl to create a query matching the [Lightstep Query Syntax](https://docs.lightstep.com/docs/query-span-data#run-a-query).

```shell
$ curl --location --request POST 'localhost:4000/api/queries' \
--header 'Content-Type: application/json' \
--data-raw '{"query":"service IN (\"android\")","name":"Hello World","createdAt":1605061500,"groupByKeys":["operation","http.status_code"]}'
```

The query should now be visible at `localhost:4000/api/queries`.

Once snapshots and diffs start getting created, they will also be visible at `localhost:4000/api/snapshots` and `localhost:4000/api/diffs` respectively.

### Experimental UI

In order to visualize the diffs, I created an experimental UI in Vue using a template provided by [Creative Tim](https://www.creative-tim.com/). [The code for this UI is available here](https://github.com/lightstep/lightstep-cs-examples/api-cookbook/trace-differ/client) and can be run with the following:

```shell
trace-differ$ cd client && npm run serve
```

![Trace Differ Dashboard](./example/images/dashboard.png)

![Add Query](./example/images/query.png)

![Example Diff](./example/images/diff.png)

![Diff with missing data](./example/images/missing.png)

## Next Steps

In this tutorial, we built a simple snapshot directory and implemented scheduled trace diffing on important queries. This base can be extended to many different use cases, including but not limited to:

- Setting custom thresholds for diffing
- Implement alerting to get paged when a significant diff is encountered
- Create your own system diagram between services, operations, frequency of trace paths, etc.
- Create an "evolution of system architecture" visualization for all your services
