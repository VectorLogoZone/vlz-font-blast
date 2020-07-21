#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

export $(cat .env)

docker build -t vlz-font-blast .
docker run -it \
	--publish 4000:4000 \
	--expose 4000 \
	--env PORT=4000 \
	--env "COMMIT=(local)" \
	--env "LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
	--env LOG_LEVEL=trace \
	vlz-font-blast

