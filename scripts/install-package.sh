#!/bin/bash
# Install a single package, handling cache errors

PACKAGE=$1

if [ -z "$PACKAGE" ]; then
  echo "Usage: ./install-package.sh <package-name>"
  exit 1
fi

echo "Installing $PACKAGE..."

# Try normal install first
npm install "$PACKAGE" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Normal install failed, trying with --legacy-peer-deps..."
  npm install "$PACKAGE" --legacy-peer-deps 2>/dev/null

  if [ $? -ne 0 ]; then
    echo "Failed with --legacy-peer-deps, trying with --force..."
    npm install "$PACKAGE" --force 2>/dev/null

    if [ $? -ne 0 ]; then
      echo "❌ Failed to install $PACKAGE"
      echo "Try manually: npm cache clean --force && npm install $PACKAGE"
      exit 1
    fi
  fi
fi

echo "✅ Successfully installed $PACKAGE"
