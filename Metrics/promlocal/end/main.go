package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("URL", r.URL)
	fmt.Println("HEADERS", r.Header)

	defer r.Body.Close()
	data, _ := ioutil.ReadAll(r.Body)

	fmt.Println("BODY", string(data))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", handler)
	s := &http.Server{
		Addr:           ":7000",
		Handler:        mux,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}
	log.Fatal(s.ListenAndServe())
}
