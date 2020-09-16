package k8s

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"strings"
	"time"
)

// https://kubernetes.io/docs/tasks/inject-data-application/
//   downward-api-volume-expose-pod-information/#capabilities-of-the-downward-api

const (
	// Volume dir and file names:

	podInfoDir     = "/etc/podinfo"
	podAnnotations = "annotations"
	podLabels      = "labels"
	podUID         = "uid"
	podName        = "name"
	podNamespace   = "namespace"

	// Environment variable names:

	podNodeNameEnv = "K8S_NODE_NAME"
	podUserEnv     = "K8S_USER_NAME"
)

type KV struct {
	Key   string
	Value string
}

type Pod struct {
	labels      []KV
	annotations []KV
	identifying map[string]string
}

func (k8s Pod) Identifying() map[string]string {
	return k8s.identifying
}

func (k8s Pod) Labels() []KV {
	return k8s.labels
}

func (k8s Pod) Annotations() []KV {
	return k8s.annotations
}

func (kv KV) String() string {
	return fmt.Sprint(kv.Key, "=", kv.Value)
}

func PodInfo() (Pod, error) {
	var errs []error

	allLabels := map[string]string{
		"start_timestamp": time.Now().Format(time.RFC3339Nano),
	}

	parseString := func(labelKey, pathname string) {
		if value, err := readString(pathname); err == nil {
			allLabels[labelKey] = value
		} else {
			errs = append(errs, err)
		}
	}
	parseEnv := func(labelKey, envname string) {
		if value := os.Getenv(envname); value != "" {
			allLabels[labelKey] = value
		}
	}
	parseString("k8s_pod_uid", path.Join(podInfoDir, podUID))
	parseString("k8s_pod_name", path.Join(podInfoDir, podName))
	parseString("k8s_pod_namespace", path.Join(podInfoDir, podNamespace))
	parseEnv("k8s_node", podNodeNameEnv)
	parseEnv("k8s_user", podUserEnv)

	parseKeyValues := func(pathname string) []KV {
		labels, err := readKeyValues(pathname)
		if err != nil {
			errs = append(errs, err)
		}
		return labels
	}
	labels := parseKeyValues(path.Join(podInfoDir, podLabels))
	annos := parseKeyValues(path.Join(podInfoDir, podLabels))

	for _, kv := range labels {
		allLabels[kv.Key] = kv.Value
	}

	pod := Pod{
		labels:      labels,
		annotations: annos,
		identifying: allLabels,
	}

	if errs != nil {
		return pod, fmt.Errorf("read pod info: %w", errs)
	}
	return pod, nil
}

func readString(filename string) (string, error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return "", err
	}
	return string(data), err
}

func readKeyValues(filename string) ([]KV, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	var ret []KV
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		sp := strings.SplitN(scanner.Text(), "=", 2)
		if len(sp) != 2 {
			log.Print("did not parse key value", scanner.Text())
			continue
		}
		var value string
		if err := json.Unmarshal([]byte(sp[1]), &value); err != nil {
			value = sp[1]
			log.Print("value not escaped", err)
		}
		ret = append(ret, KV{
			Key:   sp[0],
			Value: value,
		})
	}
	if err := scanner.Err(); err != nil {
		return ret, err
	}
	return ret, nil
}
