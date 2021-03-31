# Auto Streams

This example project uses Lightstep APIs to automatically create streams for all your services if they don't exist.

Streams are useful for tracking SLIs and having one per service at a minimum is recommended.

This utility can run in scheduled or single run modes, including a dry run feature.

## Running

1. Set the following environment variables:

```shell
export LIGHTSTEP_ORG=<Your org name in Lightstep>
export LIGHTSTEP_PROJECT=<Your project name in Lightstep>
export LIGHTSTEP_API_KEY=<Your API Key>
export LIGHTSTEP_ACCESS_TOKEN=<Optional to report tracing data for this service to Lightstpe>
```

2. Install necessary libraries with `npm install`
3. Run for a single run with `npm run start`
4. Run for a dry run `npm run dryrun` - this will output the streams to be created, but not create them
5. Run for a scheduled run with `npm run schedule` - this will run the utility every 10 minutes to check for new reporting services and create streams on them if needed. You can configure the schedule in `src/constants.js`

## TODOs

Some nice to haves to implement in the future (PRs welcome!)

- [ ] Dynamic configurable for custom stream creation (beyond just the service stream). For example, streams on regions, stream for customers, etc.
- [ ] Service specific dashboards with multiple streams
- [ ] Dockerize the service
- [ ] Example of K8s Cron Job
