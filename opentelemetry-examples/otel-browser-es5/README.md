### Latest api: ^1.0.0-rc.0, core: ^0.19.0, contrib: ^0.16.0

### Installation

1. First install required packages
```bash
npm install
```
It will also automatically build and create a file `otel.min.js`
2. In folder `www` You will have index.html and `otel.min.js` which contains all necessary packages from OpenTelemetry
If for any reason you want to add more plugins / modify this file just edit file `www/index.js` and either remove or add new plugins to be included automatically in the bundled file.
3. If you make any changes or want to simply regenrate file `otel.min.js` just run
```bash
npm run build
```

### Development
For your convenience there is a script that will automatically build changes on the fly and open the page for testing. Just run
```bash
npm start
```

### Angular
If you are using angular and already have a `zone.js` instead of using `@opentelemetry/context-zone` use `@opentelemetry/context-zone-peer-dep`  
