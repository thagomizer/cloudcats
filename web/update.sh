#!/bin/bash
TAG=$(date +%s)
docker build -t gcr.io/next18-appdev-chaos-standalone/ccweb:$TAG .
gcloud docker -- push gcr.io/next18-appdev-chaos-standalone/ccweb:$TAG
kubectl set image deployment cloudcats-web cloudcats-web=gcr.io/next18-appdev-chaos-standalone/ccweb:$TAG
kubectl rollout status deployment cloudcats-web
