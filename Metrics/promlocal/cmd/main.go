package main

import (
	"log"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
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
	processLabels := prometheus.Labels{
		"extra1": "value1",
		"extra2": "value2",
	}

	baseRegistry := prometheus.NewRegistry()
	registry := prometheus.WrapRegistererWith(processLabels, baseRegistry)

	twoMetrics(registry)

	http.Handle("/metrics", promhttp.HandlerFor(baseRegistry, promhttp.HandlerOpts{}))
	log.Fatal(http.ListenAndServe(":8000", nil))
}
