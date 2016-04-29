#!/bin/bash
set -e

if [ -z "$POSTGRES_CONNECTION" ]; then
    echo "POSTGRES_CONNECTION environment variable required"
    exit 1
fi

echo "POSTGRES: ${POSTGRES_CONNECTION}"

# execute nodejs application
exec npm start