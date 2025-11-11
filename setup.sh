#!/bin/bash

# Real Estate Scraper - Quick Setup Script
# Run this to get everything up and running

echo "═══════════════════════════════════════"
echo "   Real Estate Scraper - Quick Setup"
echo "═══════════════════════════════════════"
echo ""

# Check for required tools
echo "📋 Checking requirements..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need PostgreSQL installed locally."
    read -p "Do you have PostgreSQL installed locally? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please install Docker or PostgreSQL first."
        exit 1
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "🔧 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your credentials."
else
    echo "✅ .env file already exists"
fi

# Start PostgreSQL with Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "🐘 Starting PostgreSQL with Docker..."
    docker-compose up -d postgres

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5

    # Check if PostgreSQL is running
    if docker ps | grep -q real-estate-postgres; then
        echo "✅ PostgreSQL is running"
    else
        echo "❌ Failed to start PostgreSQL"
        exit 1
    fi
fi

# Run database migrations
echo ""
echo "🗄️ Setting up database..."
node database/migrate.js

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Check for MercadoLibre credentials
echo ""
echo "🔐 Checking MercadoLibre credentials..."

if grep -q "ML_CLIENT_ID=your_client_id_here" .env; then
    echo ""
    echo "⚠️  MercadoLibre credentials not configured!"
    echo ""
    echo "To get MercadoLibre credentials:"
    echo "1. Go to https://developers.mercadolibre.com.ar"
    echo "2. Create an account (free)"
    echo "3. Create a new application"
    echo "4. Copy your CLIENT_ID and CLIENT_SECRET"
    echo "5. Add them to your .env file"
    echo ""
    read -p "Have you added your MercadoLibre credentials to .env? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please add your credentials to .env first."
        exit 1
    fi
fi

# Success message
echo ""
echo "═══════════════════════════════════════"
echo "   ✅ Setup Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Get MercadoLibre OAuth token:"
echo "   node src/auth/mercadolibre-auth.js"
echo ""
echo "2. Start scraping properties:"
echo "   npm run scrape:mercadolibre -- --limit 100"
echo ""
echo "3. Check the database:"
echo "   psql postgresql://postgres:postgres@localhost:5432/real_estate_cordoba"
echo "   SELECT COUNT(*) FROM properties;"
echo ""
echo "Happy scraping! 🏠"