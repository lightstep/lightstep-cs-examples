package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

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
	responseDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "response_duration",
			Help: "Response time in seconds.",
		},
		[]string{"client_id"},
	)
	userAge = prometheus.NewSummaryVec(
		prometheus.SummaryOpts{
			Name:       "age",
			Help:       "Age in years.",
			Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
		},
		[]string{"city"},
	)
)

func twoMetrics(registry prometheus.Registerer) {
	registry.MustRegister(cpuTemp)
	registry.MustRegister(hdFailures)
	registry.MustRegister(responseDuration)
	registry.MustRegister(userAge)

	cpuTemp.Set(65.3)
	hdFailures.With(prometheus.Labels{"device": "/dev/sda"}).Inc()
	h0 := responseDuration.With(prometheus.Labels{"client_id": "000"})
	h1 := responseDuration.With(prometheus.Labels{"client_id": "001"})
	h2 := responseDuration.With(prometheus.Labels{"client_id": "002"})
	sSF := userAge.With(prometheus.Labels{"city": "SF"})
	sLA := userAge.With(prometheus.Labels{"city": "LA"})

	go func() {
		for {
			time.Sleep(time.Second)
			for i := 0; i < 5; i++ {
				h0.Observe(0.001)
				h1.Observe(0.1)
				h2.Observe(10)
			}
			for i := 0; i < 100; i++ {
				sSF.Observe(rand.ExpFloat64())
				sLA.Observe(rand.NormFloat64())
			}
		}
	}()
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
