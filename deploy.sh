#!/bin/bash
#
# deploy to zeit
#

#set -o errexit
set -o pipefail
set -o nounset

LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ)
grep -q "^LASTMOD=" .env
if [ $? -ne 0 ]; then
	echo "LASTMOD=$LASTMOD" >> .env
else
	sed -i -e "s/^LASTMOD=.*$/LASTMOD=$LASTMOD/g" .env
fi

COMMIT=$(git rev-parse --short HEAD)
grep -q "^COMMIT=" .env
if [ $? -ne 0 ]; then
	echo "COMMIT=$COMMIT" >> .env
else
	sed -i -e "s/^COMMIT=.*$/COMMIT=$COMMIT/g" .env
fi

now --dotenv && now alias && now rm $(cat ./now.json | jq '.name' --raw-output) --safe --yes