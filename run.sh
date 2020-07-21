#!/bin/bash
#
# run locally for dev
#

set -o errexit
set -o pipefail
set -o nounset

export $(cat .env)

#
# run in watch mode
npx nodemon
