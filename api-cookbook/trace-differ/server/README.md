# Trace Differ Server

1. Set the pertinent values in `constants.js`
2. Run with
   ```shell
   node server.js
   ```

### TODOs

Some outstanding items:

- [ ] Set Retry block when rate-limited
- [ ] Remove duplicate entries from returned spans for accurate group by
- [ ] Set custom thresholds for a "significant" diff
- [ ] Implement alerting via webhook
