#!/bin/bash

# ./stackdriver-prometheus-sidecar \
#     --stackdriver.project-id=greentruck \
#     --stackdriver.api-address=http://localhost:7000?auth=false \
#     --prometheus.wal-directory=cfg/data/wal \
#     --log.level=debug

DIR=/Users/jmacd/src/lightstep/go/src/github.com/lightstep/lightstep-prometheus-sidecar

# ((cd ${DIR} && go build ./cmd/lightstep-prometheus-sidecar) && \
#    ${DIR}/lightstep-prometheus-sidecar \
#     --stackdriver.project-id=greentruck \
#     --stackdriver.api-address=http://localhost:7000?auth=false \
#     --prometheus.wal-directory=cfg/data/wal \
#     --log.level=debug)

((cd ${DIR} && go build ./cmd/lightstep-prometheus-sidecar) && \
   ${DIR}/lightstep-prometheus-sidecar \
    --stackdriver.project-id=greentruck \
    --stackdriver.api-address=https://127.0.0.1:7000 \
    --prometheus.wal-directory=cfg/data/wal \
    --security.root-certificate=certs/Server.crt \
    --log.level=debug)
