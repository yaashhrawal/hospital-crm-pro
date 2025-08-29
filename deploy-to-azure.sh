#!/bin/bash

# Hospital CRM Pro - Azure Deployment Script
# This script automates the deployment to Azure App Service

echo "🚀 Hospital CRM Pro - Azure Deployment Script"
echo "============================================"

# Configuration
RESOURCE_GROUP="hospital-crm-rg"
APP_NAME="hospital-crm-pro"
LOCATION="centralindia"
PLAN_NAME="hospital-crm-plan"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists az; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Login to Azure
echo "🔐 Logging in to Azure..."
az login

# Create or use existing resource group
echo "📦 Setting up resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION 2>/dev/null || echo "Resource group already exists"

# Create App Service Plan
echo "📋 Creating App Service Plan..."
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux 2>/dev/null || echo "App Service Plan already exists"

# Create Web App
echo "🌐 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --name $APP_NAME \
    --runtime "NODE:20-lts" \
    --startup-file "backend/server.js" 2>/dev/null || echo "Web App already exists"

# Configure App Settings
echo "⚙️ Configuring environment variables..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    AZURE_DB_HOST="valantdb.postgres.database.azure.com" \
    AZURE_DB_PORT="5432" \
    AZURE_DB_NAME="postgres" \
    AZURE_DB_USER="divyansh04" \
    AZURE_DB_PASSWORD="Rawal@00" \
    JWT_SECRET="hospital-crm-jwt-secret-$(date +%s)" \
    NODE_ENV="production" \
    PORT="8080" \
    WEBSITE_NODE_DEFAULT_VERSION="~20"

# Build the application
echo "🔨 Building application..."
echo "  - Building frontend..."
npm run build

echo "  - Preparing backend..."
cd backend
npm install --production
cd ..

# Create deployment package
echo "📦 Creating deployment package..."
rm -f deploy.zip
zip -r deploy.zip . \
    -x "node_modules/*" \
    -x ".git/*" \
    -x "*.log" \
    -x "*.md" \
    -x ".env*" \
    -x "deploy.zip" \
    -x "*.sh" \
    -x "supabase_*" \
    -x "backup/*"

# Deploy to Azure
echo "🚀 Deploying to Azure..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deploy.zip

# Enable logging
echo "📊 Enabling application logging..."
az webapp log config \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --application-logging filesystem \
    --detailed-error-messages true \
    --failed-request-tracing true \
    --web-server-logging filesystem

# Get the URL
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "🌐 Your application is available at:"
echo -e "${YELLOW}https://$APP_NAME.azurewebsites.net${NC}"
echo ""
echo "📝 Login Credentials:"
echo "  Admin: admin@hospital.com / Admin@123"
echo "  Doctors: Use their respective emails / Doctor123!"
echo ""
echo "📊 Database Info:"
echo "  Host: valantdb.postgres.database.azure.com"
echo "  Database: postgres"
echo "  Total Patients: 961"
echo "  Total Doctors: 15"
echo "  Total Transactions: 1000"
echo ""
echo "🔍 To view logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "💡 To update the application:"
echo "  1. Make your changes"
echo "  2. Run this script again"
echo ""

# Cleanup
rm -f deploy.zip

echo "🎉 All done! Your Hospital CRM is now live on Azure!"