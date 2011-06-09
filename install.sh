#!/bin/bash

SRC_DIR=./popcorn-js/plugins
DATA_DIR=./data

PLUGINS=$(find $SRC_DIR -name 'popcorn.*.js' -not \( -name '*.unit.js' \) )

DATA=${DATA_DIR}/plugins.js

cat ${PLUGINS} > $DATA


