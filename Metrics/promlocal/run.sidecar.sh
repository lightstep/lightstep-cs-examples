#!/bin/bash

DIR=/Users/loaner/src/lightstep/go/src/github.com/lightstep/opentelemetry-prometheus-sidecar
TOKEN=5fKQnjSA+LYfH5ODStKrSMDGgFNpsgZaKtrqJ5P9RNLQVD9UPFcOCFyE2f8SamoVNbUTKb33zcVMTI+vXVY=

#    --security.server-certificate=certs/Server.crt \
#    --opentelemetry.api-address=ingest.staging.lightstep.com:443
#    --opentelemetry.api-address=127.0.0.1:55679 \
#    --log.level=info \

((cd ${DIR} && go build ./cmd/opentelemetry-prometheus-sidecar) && \
   ${DIR}/opentelemetry-prometheus-sidecar \
    --prometheus.wal-directory=cfg/data/wal \
    --opentelemetry.endpoint=https://ingest.staging.lightstep.com:443 \
    --grpc.header="Lightstep-Access-Token=${TOKEN}" \
    --resource.attribute="service.name=promdemo" \
    --resource.attribute="board.game=checkers" \
    --resource.attribute="video.game=switch" \
    --log.level=info \
    --startup.delay=1s \
    \
    --opentelemetry.diagnostics-endpoint=https://ingest.staging.lightstep.com:443 \
    --grpc.diagnostics-header="Lightstep-Access-Token=${TOKEN}" \
    --grpc.diagnostics-header="Lightstep-Reporting-Agent=opentelemetry-prometheus-sidecar" \
    --resource.diagnostics-attribute="service.name=promdiag" \
    --resource.diagnostics-attribute="board.game=scrabble" \
    --resource.diagnostics-attribute="video.game=playstation" \
   )

## TODO: Check it works w/o :443

#    --opentelemetry.diagnostics-endpoint=ingest.staging.lightstep.com:443 \
#    --grpc.diagnostics-header="Lightstep-Access-Token=${TOKEN}" \
#    --grpc.diagnostics-header="Lightstep-Reporting-Agent=opentelemetry-prometheus-sidecar" \
#    --resource.diagnostics-attribute="Checkers=Black" \
#    --resource.diagnostics-attribute="Playstation=Sony" \
