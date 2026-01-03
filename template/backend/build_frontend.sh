#!/bin/bash

# Build frontend and copy to backend/web directory

set -e

echo "Building frontend..."

# Navigate to frontend directory
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the frontend
echo "Running build..."
npm run build

# Copy to backend/web directory
echo "Copying to backend/web..."
rm -rf ../backend/web
cp -r dist ../backend/web

echo "Frontend build complete!"
