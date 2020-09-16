// package k8s demonstrates how to self-label Prometheus metrics with
// K8S pod and node information, with an additional label for the
// process start time that serves to disambiguate independent
// timeseries and ensure cumulative resets are correctly recognized.
//
// This module attaches the following Prometheus metric labels:
//
//   start_timestamp:   the start time of the process
//   k8s_pod_uid:       the K8S pod UID
//   k8s_pod_name:      the K8S pod name
//   k8s_pod_namespace: the K8S pod namespace
//   k8s_node:          the K8S node name.
//   
// This makes use of pod information available through the Kubernetes
// Downward API.  Note that some variables are only available through
// a volume mount, and some are only available through environment
// variables.  See:
//
// https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/#the-downward-api
// https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/#capabilities-of-the-downward-api
//
// This is a sample K8S pod spec:
//
// spec:
//   containers:
//   - name: ...
//     image: ...
//     volumeMounts:
//     - name: podinfo
//       mountPath: /etc/podinfo
//     env:
//     - name: K8S_NODE_NAME
//       valueFrom:
//         fieldRef:
//           fieldPath: spec.nodeName
//   volumes:
//   - name: podinfo
//     downwardAPI:
//       items:
//       - path: "labels"
//         fieldRef:
//           fieldPath: metadata.labels
//       - path: "annotations"
//         fieldRef:
//           fieldPath: metadata.annotations
//       - path: "uid"
//         fieldRef:
//           fieldPath: metadata.uid
//       - path: "name"
//         fieldRef:
//           fieldPath: metadata.name
//       - path: "namespace"
//         fieldRef:
//           fieldPath: metadata.namespace
package k8s
