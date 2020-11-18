'use strict';

const express = require('express');
const lightstep = require('lightstep-tracer');
const opentracing = require('opentracing');
const request = require('request');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

if (!process.env.LIGHTSTEP_ACCESS_TOKEN) {
    console.error("Please set the env variable LIGHTSTEP_ACCESS_TOKEN");
    process.exit(1);
}

opentracing.initGlobalTracer(new lightstep.Tracer({
    access_token   : process.env.LIGHTSTEP_ACCESS_TOKEN,
    component_name : 'nodejs-server',
}));


let homeFn = (req, res) => {
    let span = opentracing.globalTracer().startSpan('GET /')
    span.log({ event: 'query received' });


    let carrier = {};
    opentracing.globalTracer().inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, carrier);
    console.log(carrier)
    var options = {
        url: 'http://localhost:3001/api.php/orders/1',
        headers: carrier
    }

    span.log({ event: 'calling php server' });
    request(options, function(err, resp, body) {
        if (err) {
            console.log(err)
        }
        console.log("Server response:")
        console.log(body)
        span.log({ event: 'received response' });
        var i;
        for (var z = 0; z < getRandomInt(100); z++) {
            var child = opentracing.globalTracer().startSpan('sqrt-loop', { childOf: span })
            i = Math.sqrt(getRandomInt(100)).toString()
            child.log({ event: 'finishing square root' });
            child.finish()
        }
        span.finish()
        res.send(i)
    })
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

app.get('/', homeFn);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);