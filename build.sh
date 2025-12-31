#!/bin/bash

# Nolet - Multi-Browser Extension Build Script

set -e

echo "🚀 Starting Nolet Multi-Browser Extension Build..."
echo "📦 Target Browsers: Chrome, Firefox, Edge, Safari"
echo ""

# Dynamically read project version
PACKAGE_VERSION=$(node -pe "require('./package.json').version")
echo "📋 Project Version: v$PACKAGE_VERSION"
echo ""

# Check operating system
echo "📋 Checking build environment..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS system check
    MACOS_VERSION=$(sw_vers -productVersion)
    echo "✅ Detected macOS system, version: $MACOS_VERSION"
    
    # Check if minimum version requirement is met (12.7+)
    if [[ $(echo "$MACOS_VERSION 12.7" | tr " " "\n" | sort -V | head -n1) != "12.7" ]]; then
        echo "⚠️  Recommended to use macOS 12.7 or higher for best compatibility"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ Detected Linux system"
    
    # Try to get Linux distribution information
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "   Distribution: $NAME"
    fi
else
    echo "❌ Error: Unsupported operating system: $OSTYPE"
    echo "💡 This script only supports macOS and Linux systems"
    exit 1
fi
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js not found. Please install Node.js 18.0.0 or higher"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "💡 macOS installation suggestion:"
        echo "   - Use Homebrew: brew install node"
        echo "   - Or visit: https://nodejs.org/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "💡 Linux installation suggestion:"
        echo "   - Ubuntu/Debian: sudo apt install nodejs npm"
        echo "   - Or visit: https://nodejs.org/"
    fi
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "✅ Node.js Version: v$NODE_VERSION"

# Check if Node.js version meets requirements
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version too low, requires 18.0.0 or higher"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm not found. Please install pnpm first"
    echo ""
    echo "💡 Installation methods:"
    echo "   npm install -g pnpm"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   brew install pnpm  (macOS Homebrew)"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   curl -fsSL https://get.pnpm.io/install.sh | sh -  (Linux)"
    fi
    echo "   Or visit: https://pnpm.io/installation"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
echo "✅ pnpm Version: v$PNPM_VERSION"
echo ""

# Ensure script has execution permissions
if [ ! -x "$0" ]; then
    echo "🔧 Setting script execution permissions..."
    chmod +x "$0"
    echo "✅ Execution permissions set"
    echo ""
fi

# Clean previous build output
echo "🧹 Cleaning previous build output..."
if [ -d ".output" ]; then
    rm -rf .output
    echo "✅ Cleaned .output directory"
fi

if [ -d ".wxt" ]; then
    rm -rf .wxt
    echo "✅ Cleaned .wxt cache directory"
fi

# Clean node_modules/.cache (if exists)
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Cleaned node_modules cache"
fi
echo ""

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# TypeScript type checking
echo "🔍 Running TypeScript type checking..."
pnpm run compile
echo "✅ TypeScript type check passed"
echo ""

# Build Chrome extension
echo "🔨 Building Chrome extension..."
pnpm run build:chrome
echo "✅ Chrome extension build completed"
echo ""

# Package Chrome extension
echo "📦 Packaging Chrome extension..."
pnpm run zip:chrome
echo "✅ Chrome extension packaging completed"
echo ""

# Build Firefox extension
echo "🔨 Building Firefox extension..."
pnpm run build:firefox
echo "✅ Firefox extension build completed"
echo ""

# Package Firefox extension
echo "📦 Packaging Firefox extension..."
pnpm run zip:firefox
echo "✅ Firefox extension packaging completed"
echo ""

# Build Edge extension
echo "🔨 Building Edge extension..."
pnpm run build:edge
echo "✅ Edge extension build completed"
echo ""

# Package Edge extension
echo "📦 Packaging Edge extension..."
pnpm run zip:edge
echo "✅ Edge extension packaging completed"
echo ""

# Build Safari extension
echo "🔨 Building Safari extension..."
pnpm run build:safari
echo "✅ Safari extension build completed"
echo ""

# Package Safari extension
echo "📦 Packaging Safari extension..."
pnpm run zip:safari
echo "✅ Safari extension packaging completed"
echo ""

# Check output files
echo "📋 Checking build output..."

# Check Chrome extension
CHROME_SUCCESS=false
if [ -f ".output/nolets-$PACKAGE_VERSION-chrome.zip" ]; then
    echo "✅ Chrome extension build successful"
    CHROME_SUCCESS=true
else
    echo "❌ Error: Chrome extension package not found"
fi

# Check Firefox extension
FIREFOX_SUCCESS=false
if [ -f ".output/nolets-$PACKAGE_VERSION-firefox.zip" ]; then
    echo "✅ Firefox extension build successful"
    FIREFOX_SUCCESS=true
else
    echo "❌ Error: Firefox extension package not found"
fi

# Check Edge extension
EDGE_SUCCESS=false
if [ -f ".output/nolets-$PACKAGE_VERSION-edge.zip" ]; then
    echo "✅ Edge extension build successful"
    EDGE_SUCCESS=true
else
    echo "❌ Error: Edge extension package not found"
fi

# Check Safari extension
SAFARI_SUCCESS=false
if [ -f ".output/nolets-$PACKAGE_VERSION-safari.zip" ]; then
    echo "✅ Safari extension build successful"
    SAFARI_SUCCESS=true
else
    echo "❌ Error: Safari extension package not found"
fi

# Check if at least one build was successful
if [ "$CHROME_SUCCESS" = true ] || [ "$FIREFOX_SUCCESS" = true ] || [ "$SAFARI_SUCCESS" = true ] || [ "$EDGE_SUCCESS" = true ]; then
    echo ""
    echo "📁 Output file locations:"
    
    if [ "$CHROME_SUCCESS" = true ]; then
        echo "   📦 Chrome: .output/nolets-$PACKAGE_VERSION-chrome.zip"
        echo "   📏 File size:"
        ls -lh .output/nolets-$PACKAGE_VERSION-chrome.zip
    fi
    
    if [ "$FIREFOX_SUCCESS" = true ]; then
        echo "   📦 Firefox: .output/nolets-$PACKAGE_VERSION-firefox.zip"
        echo "   📏 File size:"
        ls -lh .output/nolets-$PACKAGE_VERSION-firefox.zip
    fi
    
    if [ "$EDGE_SUCCESS" = true ]; then
        echo "   📦 Edge: .output/nolets-$PACKAGE_VERSION-edge.zip"
        echo "   📏 File size:"
        ls -lh .output/nolets-$PACKAGE_VERSION-edge.zip
    fi

    if [ "$SAFARI_SUCCESS" = true ]; then
        echo "   📦 Safari: .output/nolets-$PACKAGE_VERSION-safari.zip"
        echo "   📏 File size:"
        ls -lh .output/nolets-$PACKAGE_VERSION-safari.zip
    fi
    
    echo ""
    
    # Provide system-specific convenience features
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "💡 macOS tip: You can open the output directory with:"
        echo "   open .output"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "💡 Linux tip: You can view the output directory with:"
        echo "   ls -la .output"
        if command -v xdg-open &> /dev/null; then
            echo "   xdg-open .output  (Open in file manager)"
        fi
    fi
    echo ""
    
    echo "🎉 Multi-browser extension build completed!"
else
    echo "❌ Error: All extension builds failed"
    echo "📁 .output directory contents:"
    ls -la .output/ || echo "❌ .output directory does not exist"
    exit 1
fi

echo "🍻 Build process completed!"
