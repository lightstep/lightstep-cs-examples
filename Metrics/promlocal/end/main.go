package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"time"

	metricService "github.com/lightstep/lightstep-cs-examples/Metrics/promlocal/internal/opentelemetry-proto-gen/collector/metrics/v1"
	"google.golang.org/grpc"
)

type (
	testServer struct {
	}
)

var (
	ErrUnsupported = fmt.Errorf("unsupported method")
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("URL", r.URL)
	fmt.Println("HEADERS", r.Header)

	defer r.Body.Close()
	data, _ := ioutil.ReadAll(r.Body)

	fmt.Println("BODY", string(data))
}

func main() {
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/", handler)
		s := &http.Server{
			Addr:           ":7001",
			Handler:        mux,
			ReadTimeout:    10 * time.Second,
			WriteTimeout:   10 * time.Second,
			MaxHeaderBytes: 1 << 20,
		}
		log.Fatal(s.ListenAndServe())
	}()

	listener, err := net.Listen("tcp", "0.0.0.0:7000")
	if err != nil {
		log.Fatal(err)
	}
	grpcServer := grpc.NewServer()
	metricService.RegisterMetricsServiceServer(grpcServer, &testServer{})
	go grpcServer.Serve(listener)
	defer grpcServer.Stop()

	select {}
}

func (t *testServer) Export(_ context.Context, req *metricService.ExportMetricsServiceRequest) (*metricService.ExportMetricsServiceResponse, error) {
	var emptyValue = metricService.ExportMetricsServiceResponse{}
	data, _ := json.MarshalIndent(req, "", "  ")
	fmt.Println(string(data))
	return &emptyValue, nil
}
