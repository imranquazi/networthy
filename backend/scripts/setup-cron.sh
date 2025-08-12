#!/bin/bash

# Setup script for automatic token cleanup cron job

echo "🚀 Setting up automatic token cleanup..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$BACKEND_DIR")"

echo "📁 Project directory: $PROJECT_DIR"

# Create log directory
LOG_DIR="/var/log/networthy"
echo "📝 Creating log directory: $LOG_DIR"
sudo mkdir -p "$LOG_DIR"
sudo chown $USER:$USER "$LOG_DIR"

# Create the cron job entry
CRON_JOB="0 2 * * * cd $BACKEND_DIR && node scripts/tokenCleanup.js >> $LOG_DIR/token-cleanup.log 2>&1"

echo "⏰ Adding cron job to run daily at 2 AM..."
echo "Cron job: $CRON_JOB"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "tokenCleanup.js"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "tokenCleanup.js" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "📋 Current cron jobs:"
crontab -l
echo ""
echo "📝 Log file location: $LOG_DIR/token-cleanup.log"
echo "🔍 To monitor logs: tail -f $LOG_DIR/token-cleanup.log"
echo ""
echo "🎉 Setup complete! Token cleanup will run daily at 2 AM."
