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
echo "🌟 Starting server..."
exec "$@"
