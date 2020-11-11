#!/bin/bash

DIR=/Users/loaner/src/lightstep/go/src/github.com/lightstep/opentelemetry-prometheus-sidecar

# primary output goes to dev-local lst-prod
#TOKEN1=LGNh+HVCRMvZ42xSPJU0tW2Lm242s1mHBRnAn0qotUIsi2hpOXQyF/8acoDqsK4v4mVI2kHVjinE/dSJMHc=

# meta jmacd-test
TOKEN1=24210880eb91a8a61cbe976bd97a3f94

# diagnostics output to the same destination
# TOKEN2=${TOKEN1}

# send diagnostics to staging dev-jmacd
TOKEN2=5fKQnjSA+LYfH5ODStKrSMDGgFNpsgZaKtrqJ5P9RNLQVD9UPFcOCFyE2f8SamoVNbUTKb33zcVMTI+vXVY=

((cd ${DIR} && go build ./cmd/opentelemetry-prometheus-sidecar) && \
     ${DIR}/opentelemetry-prometheus-sidecar \
	   --destination.header="Lightstep-Access-Token=${TOKEN1}" \
	   --diagnostics.header="Lightstep-Access-Token=${TOKEN2}" \
	   --config-file="sidecar.yaml" \
   )
