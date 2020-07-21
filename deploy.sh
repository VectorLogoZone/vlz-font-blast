#!/bin/bash
#docker login -u oauth2accesstoken -p "$(gcloud auth print-access-token)" https://gcr.io

set -o errexit
set -o pipefail
set -o nounset

docker build -t vlz-fontblast .
docker tag vlz-fontblast:latest gcr.io/vectorlogozone/fontblast:latest
docker push gcr.io/vectorlogozone/fontblast:latest

gcloud beta run deploy vlz-fontblast \
	--allow-unauthenticated \
	--image gcr.io/vectorlogozone/fontblast \
	--platform managed \
	--project vectorlogozone \
    --region us-central1 \
	--update-env-vars "COMMIT=$(git rev-parse --short HEAD),LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ),GOOGLE_ANALYTICS=UA-328425-25"
