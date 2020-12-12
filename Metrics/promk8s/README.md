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

For example:

```
# HELP cpu_temperature_celsius Current temperature of the CPU.
# TYPE cpu_temperature_celsius gauge
cpu_temperature_celsius{A="B",k8s_node="docker-desktop",k8s_pod_name="promk8s-demo",k8s_pod_namespace="default",k8s_pod_uid="af812b98-fe6f-4872-9b9c-a6ee41616459",start_timestamp="2020-09-16T19:01:22.322471883Z"} 65.3
# HELP hd_errors_total Number of hard-disk errors.
# TYPE hd_errors_total counter
hd_errors_total{A="B",device="/dev/sda",k8s_node="docker-desktop",k8s_pod_name="promk8s-demo",k8s_pod_namespace="default",k8s_pod_uid="af812b98-fe6f-4872-9b9c-a6ee41616459",start_timestamp="2020-09-16T19:01:22.322471883Z"} 1
```
