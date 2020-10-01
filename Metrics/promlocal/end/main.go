package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/genproto/googleapis/api/metric"
	"google.golang.org/genproto/googleapis/api/monitoredres"
	monitoring "google.golang.org/genproto/googleapis/monitoring/v3"
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
	monitoring.RegisterMetricServiceServer(grpcServer, &testServer{})
	go grpcServer.Serve(listener)
	defer grpcServer.Stop()

	select {}
}

func (t *testServer) ListMonitoredResourceDescriptors(context.Context, *monitoring.ListMonitoredResourceDescriptorsRequest) (*monitoring.ListMonitoredResourceDescriptorsResponse, error) {
	return nil, ErrUnsupported
}

func (t *testServer) GetMonitoredResourceDescriptor(context.Context, *monitoring.GetMonitoredResourceDescriptorRequest) (*monitoredres.MonitoredResourceDescriptor, error) {
	return nil, ErrUnsupported
}

func (t *testServer) ListMetricDescriptors(context.Context, *monitoring.ListMetricDescriptorsRequest) (*monitoring.ListMetricDescriptorsResponse, error) {
	return nil, ErrUnsupported
}

func (t *testServer) GetMetricDescriptor(context.Context, *monitoring.GetMetricDescriptorRequest) (*metric.MetricDescriptor, error) {
	return nil, ErrUnsupported
}

func (t *testServer) CreateMetricDescriptor(context.Context, *monitoring.CreateMetricDescriptorRequest) (*metric.MetricDescriptor, error) {
	return nil, ErrUnsupported
}

func (t *testServer) DeleteMetricDescriptor(context.Context, *monitoring.DeleteMetricDescriptorRequest) (*empty.Empty, error) {
	return nil, ErrUnsupported
}

func (t *testServer) ListTimeSeries(context.Context, *monitoring.ListTimeSeriesRequest) (*monitoring.ListTimeSeriesResponse, error) {
	return nil, ErrUnsupported
}

func (t *testServer) CreateTimeSeries(context.Context, *monitoring.CreateTimeSeriesRequest) (*empty.Empty, error) {
	fmt.Println("CREATE TIMESERIES!!!")
	return nil, ErrUnsupported
}
