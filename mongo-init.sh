#!/bin/bash
echo ">>> Waiting for MongoDB to start..."
until mongosh --eval "print(\"waited for connection\")" 2>/dev/null; do
    sleep 1
done

echo ">>> Restoring database..."
mongorestore --db transportsys /docker-entrypoint-initdb.d/dump
echo ">>> Restore complete!"