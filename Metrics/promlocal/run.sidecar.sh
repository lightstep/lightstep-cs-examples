#!/bin/bash

./stackdriver-prometheus-sidecar \
    --stackdriver.project-id=greentruck \
    --stackdriver.api-address=http://localhost:7000?auth=false \
    --prometheus.wal-directory=cfg/data/wal \
    --log.level=debug



