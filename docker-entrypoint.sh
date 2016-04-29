#!/bin/bash
set -e

if [ -z "$POSTGRES_CONNECTION" ]; then
    echo "POSTGRES_CONNECTION environment variable required"
    exit 1
fi

if [ -z "$TOKEN_SECRET" ]; then
    echo "TOKEN_SECRET environment variable required"
    exit 1
fi

# execute nodejs application
exec npm start