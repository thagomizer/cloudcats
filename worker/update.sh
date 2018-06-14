#!/bin/bash
TAG=$(date +%s)
docker build -t gcr.io/next18-appdev-chaos-standalone/ccworker:$TAG .
gcloud docker -- push gcr.io/next18-appdev-chaos-standalone/ccworker:$TAG
kubectl set image deployment cloudcats-worker cloudcats-worker=gcr.io/next18-appdev-chaos-standalone/ccworker:$TAG
kubectl rollout status deployment cloudcats-worker
