#!/bin/bash

# Deploy script for Ubuntu server
# This script will be triggered by GitHub webhook or manually

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /home/Admin/stresser || exit 1

echo "📥 Pulling latest code..."
git pull origin main

echo "🧹 Cleaning old dependencies..."
rm -rf node_modules package-lock.json

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building project..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart stresser
pm2 save

echo "✅ Deployment completed successfully!"
pm2 status

