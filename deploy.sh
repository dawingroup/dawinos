#!/bin/bash

# Cutlist Processor v1.1 Deployment Script
# This script helps deploy the enhanced cutlist processor with all integrations

set -e

echo "🚀 Cutlist Processor v1.1 Deployment Script"
echo "============================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    firebase login
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please copy .env.example to .env and configure it."
    echo "   cp .env.example .env"
    echo "   Then edit .env with your Firebase and API configurations."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing Functions dependencies..."
cd functions
npm install
cd ..

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy functions first (they take longer)
echo "☁️  Deploying Firebase Functions..."
firebase deploy --only functions

# Deploy hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

# Get the hosting URL
PROJECT_ID=$(firebase use --current)
HOSTING_URL="https://${PROJECT_ID}.web.app"

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your app is available at: ${HOSTING_URL}"
echo ""
echo "📋 Next steps:"
echo "1. Configure your Firebase Authentication providers"
echo "2. Set up your Notion databases and share them with your integration"
echo "3. Test the authentication and file upload functionality"
echo "4. Verify Google Drive auto-save is working"
echo ""
echo "📖 For detailed setup instructions, see SETUP.md"
