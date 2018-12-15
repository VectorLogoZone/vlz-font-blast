#!/bin/bash
#
# deploy to zeit
#

now \
    --env COMMIT=$(git rev-parse --short HEAD) \
    --env LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
    && now alias \
    && now rm $(cat ./now.json | jq '.name' --raw-output) --safe --yes
