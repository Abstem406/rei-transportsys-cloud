#!/bin/bash
echo ">>> Restaurando base de datos..."
mongorestore --db transportsys --drop /docker-entrypoint-initdb.d/dump
echo ">>> Restauración completada!"