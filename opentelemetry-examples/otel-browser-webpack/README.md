This is an example of how to use OpenTelemetry in the Browser.

If your application does not use a build system, you can follow this example to create a minified JS file for all the tracing components that will be needed and configuring them to send data to Lightstep.

In short:

- Run `npm install` to require the requisite packages
- Change settings in `src/tracing.js` for configuring your tracer and plugins as needed
- Run `npm run build` - this uses webpack to pack all of the required components into one file at `dist/tracing.js`.
- Include `dist/tracing.js` in `index.html` as a script.
- The `index.html` file has to be served, just opening it in a browser will not work. As such, you can run `npm run serve` which uses `http-server` to start a very minimal server.
- When you visit the page in your browser, you can open up the console to see the Traces being logged as well as check in Lightstep for your application trace data.
