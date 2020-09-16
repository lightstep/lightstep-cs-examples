all:
	docker build -t promk8s:current .
	kubectl delete pod promk8s-demo
	kubectl apply -f job.yaml

