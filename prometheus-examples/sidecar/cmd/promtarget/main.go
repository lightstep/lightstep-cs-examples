package main

import (
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

const portString = ":18000"

var (
	cpuTemp = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "cpu_temperature_celsius",
		Help: "Current temperature of the CPU.",
	})

	sineWave = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Name: "sine_wave",
		Help: "Current sin(time*alpha).",
	},
		[]string{"period"},
	)
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

	// Simulates a DELTA output by using the current time.  The
	// value of this GaugeFunc equals the number of seconds since
	// last evaluated, so should display as a rate of 1.  If
	// interpreted as a Gauge downstream, this value depends on
	// scrape frequency.

	stopWatch = prometheus.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "stopwatch",
	}, func() float64 {
		now := time.Now()
		diff := now.Sub(stopWatchLast)
		stopWatchLast = now
		return float64(diff)
	})
	stopWatchLast = time.Now()
)

func someMetrics(registry prometheus.Registerer) {
	registry.MustRegister(cpuTemp)
	registry.MustRegister(sineWave)
	registry.MustRegister(hdFailures)
	registry.MustRegister(responseDuration)
	registry.MustRegister(userAge)
	registry.MustRegister(stopWatch)

	cpuTemp.Set(65.3)

	h0 := responseDuration.With(prometheus.Labels{"client_id": "000"})
	h1 := responseDuration.With(prometheus.Labels{"client_id": "001"})
	h2 := responseDuration.With(prometheus.Labels{"client_id": "002"})
	sSF := userAge.With(prometheus.Labels{"city": "SF"})
	sLA := userAge.With(prometheus.Labels{"city": "LA"})
	fastWave := sineWave.With(prometheus.Labels{"period": "fast"})
	regWave := sineWave.With(prometheus.Labels{"period": "regular"})
	slowWave := sineWave.With(prometheus.Labels{"period": "slow"})

	go func() {
		for {
			time.Sleep(time.Second)
			for i := 0; i < 5; i++ {
				h0.Observe(0.001*rand.NormFloat64())
				h1.Observe(0.1*rand.NormFloat64())
				h2.Observe(10*rand.NormFloat64())
			}
			for i := 0; i < 100; i++ {
				sSF.Observe(rand.ExpFloat64())
				sLA.Observe(rand.NormFloat64())
			}
			hdFailures.With(prometheus.Labels{"device": "yep0"}).Inc()

			secs := float64(time.Now().UnixNano()) / float64(time.Second)
			fastWave.Set(math.Sin(secs / (200 * math.Pi)))
			regWave.Set(math.Sin(secs / (1000 * math.Pi)))
			slowWave.Set(math.Sin(secs / (5000 * math.Pi)))
		}
	}()
}

func main() {
	fmt.Printf("Prometheus listener on 127.0.0.1%s/metrics\n", portString)
	processLabels := prometheus.Labels{
		"extra1": "value1",
		"extra2": "value2",
	}

	baseRegistry := prometheus.NewRegistry()
	registry := prometheus.WrapRegistererWith(processLabels, baseRegistry)

	someMetrics(registry)

	http.Handle("/metrics", promhttp.HandlerFor(baseRegistry, promhttp.HandlerOpts{}))
	log.Fatal(http.ListenAndServe(portString, nil))
}
