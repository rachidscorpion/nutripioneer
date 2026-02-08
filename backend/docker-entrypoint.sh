#!/bin/sh
set -e

echo "🚀 Starting NutriPioneer Backend..."

# Ensure data directory exists
mkdir -p /app/data

# Check if database exists, if not initialize it
if [ ! -f "/app/data/prod.db" ]; then
    echo "📦 Database not found. Initializing..."
    bunx prisma db push --skip-generate
    echo "✅ Database initialized successfully"
else
    echo "✅ Database already exists, skipping initialization"
fi

# Start the application
echo "🌟 Starting server for user bun..."
echo "Debugging permissions before chown:"
ls -la /app/data

chown -R bun:bun /app/data
chmod 755 /app/data
if [ -f "/app/data/prod.db" ]; then
    chmod 666 /app/data/prod.db
fi

echo "Debugging permissions after chown/chmod:"
ls -la /app/data

exec gosu bun "$@"
