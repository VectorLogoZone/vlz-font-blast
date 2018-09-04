#!/bin/bash
#
# run locally
#

export $(grep ^[^\#] .env)
nodemon server.js