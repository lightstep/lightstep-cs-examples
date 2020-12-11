This directory contains source code and scripts to run a sample
Prometheus target, a Prometheus server, and the OpenTelemetry
Prometheus sidecar.

To start the Prometheus target:

```
go run ./cmd/promtarget
```

Start the Prometheus server:

```
prometheus --config.file=prometheus.yaml
```

The server will begin writing into the `./data` directory.

Run an OTLP Metrics service that prints metric data as JSON:

```
go run ./cmd/otlpservice
```

To install the sidecar:

```
go install github.com/lightstep/opentelemetry-prometheus-sidecar/cmd/opentelemetry-prometheus-sidecar
```

To run the sidecar, configured for the Prometheus target, Prometheus
server, and OTLP service tasks above.

```
opentelemetry-prometheus-sidecar --config-file=sidecar.yaml
```

The OTLP service will begin printing the Metrics and Trace data it
receives.
