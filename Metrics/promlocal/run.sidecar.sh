#!/bin/bash

DIR=/Users/jmacd/src/lightstep/go/src/github.com/lightstep/lightstep-prometheus-sidecar
TOKEN=7d74998428f3f0bfd7659bcc387b4e06
#    --security.server-certificate=certs/Server.crt \
#    --opentelemetry.api-address=https://127.0.0.1:7000 \

#    --opentelemetry.api-address=https://ingest.staging.lightstep.com:443/metrics/otlp/v0.5 \

((cd ${DIR} && go build ./cmd/lightstep-prometheus-sidecar) && \
   ${DIR}/lightstep-prometheus-sidecar \
    --security.server-certificate=certs/Server.crt \
    --opentelemetry.api-address=https://127.0.0.1:7000 \
    --prometheus.wal-directory=cfg/data/wal \
    --grpc.header="Lightstep-Access-Token=${TOKEN}" \
    --resource.attribute="Checkers=Red" \
    --resource.attribute="Switch=Nintendo" \
    --log.level=debug)
