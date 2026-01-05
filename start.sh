#!/bin/bash

echo "🚀 Starting KEMETION Backend Server..."
echo "📊 Environment: $NODE_ENV"
echo "🗄️  Database: $DATABASE_URL"

cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start server
echo "✅ Starting Express server..."
npm start
