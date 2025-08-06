#!/bin/bash
# mongo-init.sh
set -e

echo "🔍 Buscando dump en /docker-entrypoint-initdb.d/dump"
if [ -d "/docker-entrypoint-initdb.d/dump" ]; then
  echo "🚀 Restaurando base de datos 'mi_db'..."
  mongorestore --drop --db mi_db /docker-entrypoint-initdb.d/dump/transportsys
  echo "✅ Restauración terminada"
else
  echo "⚠️  No se encontró el dump; se omite la restauración"
fi