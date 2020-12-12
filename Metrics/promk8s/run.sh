#!/bin/bash -e

K=kubectl
D=docker

CERTMGR_SOURCE="https://github.com/jetstack/cert-manager/releases/download/v1.0.2/cert-manager.yaml"

function start {
    if ! ${D} build -t promk8s:current .; then
        echo docker failed
    fi

    if ! ${K} delete pod promk8s-demo; then
        echo did not delete pod
    fi    

    if ! ${K} apply -f job.yaml; then
        echo did not start pod
    fi

    ${K} wait --for=condition=Ready --timeout=15s pod/promk8s-demo

    ${K} port-forward promk8s-demo 8000:8000&

    FWDPID=$!

    trap 'echo killing forwarder; kill ${FWDPID}' TERM EXIT

    sleep 60000
}

function mkcert {
    # https://tech.paulcz.net/blog/creating-self-signed-certs-on-kubernetes/

    if ! ${K} create namespace cert-manager 2> /dev/null; then
        echo "Cert-Manager is already installed"
    else
        ${K} apply --validate=false -f ${CERTMGR_SOURCE}
    fi

    if ! ${K} delete namespace monitoring 2> /dev/null; then
        :
    fi
        
    ${K} create namespace monitoring

    ${K} apply -n monitoring -f <(echo "
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
")

    ${K} apply -n monitoring -f <(echo '
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: first-tls
spec:
  secretName: first-tls
  dnsNames:
  - "*.monitoring.svc.cluster.local"
  - "*.monitoring"
  issuerRef:
    name: selfsigned-issuer
')
}

mkcert
#start
