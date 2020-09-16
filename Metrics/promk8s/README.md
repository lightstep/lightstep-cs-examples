This directory includes:

- a Dockerfile to build a demo app with a Prometheus Go client
- a Kubernetes pod definition that runs the demo app w/ pod info volume
- a small library to parse the pod info

Use `make` to build the image and start the pod.

Use `kubectl port-forward promk8s-demo 8000:8000`, then visit [http://localhost:8000/metrics](http://localhost:8000/metrics).

You will see several labels have been added to every Prometheus metric
registered by the sample application:
- start_timestamp:   the start time of the process
- k8s_pod_uid:       the K8S pod UID
- k8s_pod_name:      the K8S pod name
- k8s_pod_namespace: the K8S pod namespace
- k8s_node:          the K8S node name

