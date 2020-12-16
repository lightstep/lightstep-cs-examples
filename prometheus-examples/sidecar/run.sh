#!/bin/bash

DIR=/Users/loaner/src/lightstep/go/src/github.com/lightstep/opentelemetry-prometheus-sidecar

TOKEN=4IY1I9adf9FeOUUFgHiOaWIp4hRs1NDlwQfyzV02oRA+/3PBGchUJ0MoQkHKuxQcHC/+AYLM5k7iVboj5A6NP12eVjICe9+yQOT9bNsv
DTOKEN=${TOKEN}

DESTINATION=https://ingest.lightstep.com:443
DDESTINATION=${DESTINATION}

((cd ${DIR} && go build ./cmd/opentelemetry-prometheus-sidecar) && \
     ${DIR}/opentelemetry-prometheus-sidecar \
	   --destination.header="Lightstep-Access-Token=${TOKEN}" \
	   --destination.endpoint="${DESTINATION}" \
	   --diagnostics.header="Lightstep-Access-Token=${DTOKEN}" \
	   --diagnostics.endpoint="${DDESTINATION}" \
	   --prometheus.wal="data/wal" \
	   --opentelemetry.metrics-prefix="otel.test."  \
	   --log.level="info" \
           --log.verbose=0 \
	   --destination.timeout="1m" \
	   --startup.delay="1s" \
   )
