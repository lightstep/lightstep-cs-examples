package main

import (
	"log"
	"net/http"
	"path"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/lightstep/lightstep-cs-examples/Metrics/promk8s/k8s"
)

var (
	cpuTemp = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "cpu_temperature_celsius",
		Help: "Current temperature of the CPU.",
	})
	hdFailures = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "hd_errors_total",
			Help: "Number of hard-disk errors.",
		},
		[]string{"device"},
	)
)

func twoMetrics(registry prometheus.Registerer) {
	registry.MustRegister(cpuTemp)
	registry.MustRegister(hdFailures)

	cpuTemp.Set(65.3)
	hdFailures.With(prometheus.Labels{"device": "/dev/sda"}).Inc()
}

func main() {
	pod := k8s.PodInfo()
	uid, _ := readUID(path.Join(podInfoDir, podUID))
	labels, _ := readKeyValues(path.Join(podInfoDir, podLabels))
	startTime := time.Now().Format(time.RFC3339Nano)

	allLabels := prometheus.Labels{
		"k8s_pod_uid": uid,
		"start_timestamp": startTime,
	}
	for _, kv := range labels {
		allLabels[kv.key] = kv.value
	}

	baseRegistry := prometheus.NewRegistry()
	registry := prometheus.WrapRegistererWith(allLabels, baseRegistry)

	twoMetrics(registry)

	http.Handle("/metrics", promhttp.HandlerFor(baseRegistry, promhttp.HandlerOpts{}))
	log.Fatal(http.ListenAndServe(":8000", nil))
}
