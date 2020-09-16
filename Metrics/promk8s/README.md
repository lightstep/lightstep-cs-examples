This directory includes:

- a Dockerfile to build a demo app with a Prometheus Go client
- a Kubernetes pod definition that runs the demo app w/ pod info volume
- a small library to parse the pod info

Use `make` to build the image and start the pod.

Use `kubectl port-forward promk8s-demo 8000:8000`, then visit [http://localhost:8000/metrics](http://localhost:8000/metrics).
