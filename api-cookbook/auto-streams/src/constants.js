module.exports = {
  LIGHTSTEP_HOST: 'https://api.lightstep.com',
  LIGHTSTEP_ORG: process.env.LIGHTSTEP_ORG || '',
  LIGHTSTEP_PROJECT: process.env.LIGHTSTEP_PROJECT || '',
  LIGHTSTEP_API_KEY: process.env.LIGHTSTEP_API_KEY || '',
  LIGHTSTEP_ACCESS_TOKEN: process.env.LIGHTSTEP_ACCESS_TOKEN || '',
  SCHEDULE_RULE_MINUTES: 10, // sync every 10 minutes
  DRY_RUN: process.env.DRY_RUN || false
}
