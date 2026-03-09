#!/bin/bash
set -e

echo "Building frontend..."
cd web
npm install
npm run build
echo "Frontend build complete!"
