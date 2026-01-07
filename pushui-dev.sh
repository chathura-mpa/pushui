#!/bin/bash
# Development helper for running pushui CLI locally
cd packages/cli && npx tsx src/index.ts "$@"
