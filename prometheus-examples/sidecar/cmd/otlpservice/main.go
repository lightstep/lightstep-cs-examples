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
	"os"
	"path"

	metricService "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	traceService "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	_ "google.golang.org/grpc/encoding/gzip"
	grpcMetadata "google.golang.org/grpc/metadata"
)

type (
	metricServer struct {
		metricService.UnimplementedMetricsServiceServer
	}

	traceServer struct {
		traceService.UnimplementedTraceServiceServer
	}
)

var (
	ErrUnsupported = fmt.Errorf("unsupported method")
)

func main() {
	go func() {
		listener, err := net.Listen("tcp", "0.0.0.0:17000")
		if err != nil {
			log.Fatal(err)
		}
		grpcServer := grpc.NewServer()
		metricService.RegisterMetricsServiceServer(grpcServer, &metricServer{})
		traceService.RegisterTraceServiceServer(grpcServer, &traceServer{})
		go grpcServer.Serve(listener)
		defer grpcServer.Stop()

		fmt.Println("Starting insecure gRPC endpoint on port 17000")

		select {}
	}()

	go func() {
		certDir := os.Getenv("CERT_DIR")
		if certDir == "" {
			certDir = "./certs"
		}
		certificate, err := tls.LoadX509KeyPair(
			path.Join(certDir, "server.crt"),
			path.Join(certDir, "server.key"),
		)

		certPool := x509.NewCertPool()
		bs, err := ioutil.ReadFile(path.Join(certDir, "caroot.crt"))
		if err != nil {
			log.Fatalf("failed to read client ca cert: %s", err)
		}

		ok := certPool.AppendCertsFromPEM(bs)
		if !ok {
			log.Fatal("failed to append client certs")
		}

		listener, err := net.Listen("tcp", "0.0.0.0:17001")
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
		metricService.RegisterMetricsServiceServer(grpcServer, &metricServer{})
		traceService.RegisterTraceServiceServer(grpcServer, &traceServer{})

		fmt.Println("Starting secure gRPC endpoint on port 17001")
		go grpcServer.Serve(listener)
		defer grpcServer.Stop()

		select {}
	}()

	select {}
}

func (t *metricServer) Export(ctx context.Context, req *metricService.ExportMetricsServiceRequest) (*metricService.ExportMetricsServiceResponse, error) {
	var emptyValue = metricService.ExportMetricsServiceResponse{}
	md, ok := grpcMetadata.FromIncomingContext(ctx)
	if ok {
		fmt.Println("Metadata:", md)
	}
	data, _ := json.MarshalIndent(req, "", "  ")
	fmt.Println("Export:", string(data))

	// r := rand.Float64()
	// if r < 0.001 {
	// 	// Infinite loop, etc.
	// 	fmt.Println("I'm in an infinite loop")
	// 	select {}
	// }
	// if r < 0.01 {
	// 	return &emptyValue, status.Error(codes.InvalidArgument, "test unrecoverable error")
	// }
	// if r < 0.1 {
	// 	return &emptyValue, status.Error(codes.DataLoss, "test recoverable error")
	// }
	// if d := (1 + rand.NormFloat64()) * float64(5*time.Millisecond); d > 0 {
	// 	time.Sleep(time.Duration(d))
	// }
	return &emptyValue, nil
}

func (t *traceServer) Export(ctx context.Context, req *traceService.ExportTraceServiceRequest) (*traceService.ExportTraceServiceResponse, error) {
	var emptyValue = traceService.ExportTraceServiceResponse{}
	md, ok := grpcMetadata.FromIncomingContext(ctx)
	if ok {
		fmt.Println("Metadata:", md)
	}
	data, _ := json.MarshalIndent(req, "", "  ")
	fmt.Println("Export:", string(data))
	return &emptyValue, nil
}
