#!/bin/bash
# Installation and Build Script for Monolithic Deployment on Render

set -e # Exit on error

echo "📦 Installing Backend Dependencies..."
pip install -r backend/requirements.txt

echo "📦 Installing Frontend Dependencies..."
cd frontend
npm install

echo "🏗️ Building Frontend..."
npm run build

echo "🚚 Moving Static Files to Backend..."
cd ..
rm -rf backend/static/*
mkdir -p backend/static
cp -r frontend/out/* backend/static/

echo "✅ Build Complete!"
