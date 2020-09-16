package main

import (
	"log"
	"net/http"

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
	pod, _ := k8s.PodInfo()

	baseRegistry := prometheus.NewRegistry()
	registry := prometheus.WrapRegistererWith(prometheus.Labels(pod.Identifying()), baseRegistry)

	twoMetrics(registry)

	http.Handle("/metrics", promhttp.HandlerFor(baseRegistry, promhttp.HandlerOpts{}))
	log.Fatal(http.ListenAndServe(":8000", nil))
}
