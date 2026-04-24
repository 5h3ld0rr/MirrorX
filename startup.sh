#!/bin/bash

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24.15.0

# MirrorX Startup Script
# This script pulls latest changes, installs dependencies, builds, and starts the apps.

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Ensure Node and PM2 are in PATH (common for Pi)
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

echo "----------------------------------------------------"
echo "🚀 $(date): Starting MirrorX Startup Sequence..."
echo "----------------------------------------------------"

# 1. Pull latest code
echo "📥 [1/4] Pulling latest changes from Git..."
git pull || echo "⚠️ Git pull failed, continuing with local code..."

# 2. Install dependencies
echo "📦 [2/4] Installing dependencies..."
npm run install-all

# 3. Build project
echo "🏗️ [3/4] Building Frontend and Backend..."
npm run build

# 4. Start with PM2
echo "📈 [4/4] Launching processes with PM2..."
pm2 start ecosystem.config.js --env production

echo "✅ MirrorX is up and running!"
echo "----------------------------------------------------"
