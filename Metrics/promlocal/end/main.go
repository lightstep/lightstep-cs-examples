package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"time"

	metricService "github.com/lightstep/lightstep-cs-examples/Metrics/promlocal/internal/opentelemetry-proto-gen/collector/metrics/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	grpcMetadata "google.golang.org/grpc/metadata"
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
			Addr:           ":7002",
			Handler:        mux,
			ReadTimeout:    10 * time.Second,
			WriteTimeout:   10 * time.Second,
			MaxHeaderBytes: 1 << 20,
		}
		log.Fatal(s.ListenAndServe())
	}()

	go func() {
		listener, err := net.Listen("tcp", "0.0.0.0:7001")
		if err != nil {
			log.Fatal(err)
		}
		grpcServer := grpc.NewServer()
		metricService.RegisterMetricsServiceServer(grpcServer, &testServer{})
		go grpcServer.Serve(listener)
		defer grpcServer.Stop()

		select {}
	}()

	go func() {
		certificate, err := tls.LoadX509KeyPair(
			"certs/Server.crt",
			"certs/Server.key",
		)

		certPool := x509.NewCertPool()
		bs, err := ioutil.ReadFile("certs/CertAuth.crt")
		if err != nil {
			log.Fatalf("failed to read client ca cert: %s", err)
		}

		ok := certPool.AppendCertsFromPEM(bs)
		if !ok {
			log.Fatal("failed to append client certs")
		}

		listener, err := net.Listen("tcp", "0.0.0.0:7000")
		if err != nil {
			log.Fatalf("failed to listen: %s", err)
		}

		tlsConfig := &tls.Config{
			ClientAuth:   tls.NoClientCert,
			Certificates: []tls.Certificate{certificate},
			ClientCAs:    certPool,
		}

		serverOption := grpc.Creds(credentials.NewTLS(tlsConfig))
		grpcServer := grpc.NewServer(serverOption)
		metricService.RegisterMetricsServiceServer(grpcServer, &testServer{})
		go grpcServer.Serve(listener)
		defer grpcServer.Stop()

		select {}
	}()

	select {}
}

func (t *testServer) Export(ctx context.Context, req *metricService.ExportMetricsServiceRequest) (*metricService.ExportMetricsServiceResponse, error) {
	var emptyValue = metricService.ExportMetricsServiceResponse{}
	md, ok := grpcMetadata.FromIncomingContext(ctx)
	if ok {
		fmt.Println("With metadata:", md)
	}
	data, _ := json.MarshalIndent(req, "", "  ")
	fmt.Println(string(data))
	return &emptyValue, nil
}
