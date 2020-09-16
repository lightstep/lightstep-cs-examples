package k8s

import (
	"time"
	"fmt"
	"path"
	"log"
	"bufio"
	"os"
	"strings"
	"io/ioutil"
)

const (
	podInfoDir     = "/etc/podinfo"
	podAnnotations = "annotations"
	podLabels      = "labels"
	podUID         = "uid"
)

type KV struct {
	Key   string
	Value string
}

type Pod struct {
	startTime time.Time
	uid         string
	labels      []KV
	annotations []KV
	identifying map[string]string
}

func (k8s Pod) StartTime() time.Time {
	return k8s.startTime
}

func (k8s Pod) UID() string {
	return k8s.uid
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
	startTime := time.Now().Format(time.RFC3339Nano)

	allLabels := map[string]string{
		"start_timestamp": startTime,
	}

	uid, err1 := readUID(path.Join(podInfoDir, podUID))

	if err1 == nil {
		allLabels["k8s_pod_uid"] = uid
	}
	
	labels, err2 := readKeyValues(path.Join(podInfoDir, podLabels))

	if err2 == nil {
		for _, kv := range labels {
			allLabels[kv.Key] = kv.Value
		}
	}

	annos, err3 := readKeyValues(path.Join(podInfoDir, podAnnotations))

	pod := Pod{
		uid: uid,
		labels: labels,
		annotations: annos,
		identifying: allLabels,
	}

	var err error
	if err1 != nil || err2 != nil || err3 != nil {
		err = fmt.Errorf("read pod info: %w: %w: %w", err1, err2, err3)
	}
	return pod, err
}

func readUID(filename string) (string, error) {
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
		ret = append(ret, KV{
			Key:   sp[0],
			Value: sp[1],
		})
	}
	if err := scanner.Err(); err != nil {
		return ret, err
	}
	return ret, nil
}
