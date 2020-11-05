# NodeJS - Reporting Status Scheduler

This is an example of a simple NodeJS app that gets the Reporting Status of a project from Lightstep API and saves it to a running InfluxDB instance every minute. 

Note: This is an alternative method of getting the data and writing to InfluxDB in a scheduled manner if you do not wish to use Node-RED workflow described in [`TUTORIAL.md`](../../TUTORIAL.md).

## Setup

1. Ensure an instance of InfluxDB is running and configured according to the example available in the [`TUTORIAL.md`](../../TUTORIAL.md) file of the parent directory. 

2. Set the following environment variables

    ```bash
    $ export LIGHTSTEP_ORG = '<YOUR ORG NAME>'
    $ export LIGHTSTEP_PROJECT = '<YOUR PROJECT NAME>'
    $ export LIGHTSTEP_API_KEY = '<YOUR API KEY>'
    ```

3. Run the scheduler

    ```bash
    $ npm install && node scheduler.js
    ```

3. Visualize the data in Grafana. Details of this step are also available in [`TUTORIAL.md`](../../TUTORIAL.md)