# Hospital CRM Pro - Azure Deployment Guide

## Overview
This guide will help you deploy your Hospital CRM application to Azure with the PostgreSQL database already configured.

## Current Setup
- **Database**: Azure PostgreSQL (Already configured and populated with data)
  - Host: `valantdb.postgres.database.azure.com`
  - Database: `postgres`
  - User: `divyansh04`
  - All data migrated: 961 patients, 15 doctors, 1000 transactions, 40 beds, 16 users

## Prerequisites
1. Azure Account with active subscription
2. Azure CLI installed locally
3. Node.js 18+ installed
4. Git repository for your code

## Deployment Options

### Option 1: Azure App Service (Recommended for Quick Start)

#### Step 1: Create Azure App Service
```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name hospital-crm-rg --location "Central India"

# Create App Service Plan
az appservice plan create \
  --name hospital-crm-plan \
  --resource-group hospital-crm-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group hospital-crm-rg \
  --plan hospital-crm-plan \
  --name hospital-crm-pro \
  --runtime "NODE:20-lts" \
  --startup-file "backend/server.js"
```

#### Step 2: Configure App Settings
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group hospital-crm-rg \
  --name hospital-crm-pro \
  --settings \
    AZURE_DB_HOST="valantdb.postgres.database.azure.com" \
    AZURE_DB_PORT="5432" \
    AZURE_DB_NAME="postgres" \
    AZURE_DB_USER="divyansh04" \
    AZURE_DB_PASSWORD="Rawal@00" \
    JWT_SECRET="your-secure-jwt-secret-key" \
    NODE_ENV="production" \
    PORT="8080"
```

#### Step 3: Deploy Your Code

**Using Git:**
```bash
# Get deployment credentials
az webapp deployment source config-local-git \
  --name hospital-crm-pro \
  --resource-group hospital-crm-rg

# Add Azure remote to your git
git remote add azure <deployment-url-from-above>

# Push to Azure
git push azure main
```

**Using ZIP Deploy:**
```bash
# Build your application
npm run build
cd backend && npm install --production && cd ..

# Create deployment package
zip -r deploy.zip . -x "node_modules/*" ".git/*" "*.log"

# Deploy
az webapp deployment source config-zip \
  --resource-group hospital-crm-rg \
  --name hospital-crm-pro \
  --src deploy.zip
```

### Option 2: Azure Static Web Apps + Azure Functions

This separates your frontend and backend for better scalability.

#### Step 1: Create Static Web App
```bash
# Create Static Web App
az staticwebapp create \
  --name hospital-crm-frontend \
  --resource-group hospital-crm-rg \
  --source https://github.com/yourusername/hospital-crm \
  --location "Central India" \
  --branch main \
  --app-location "/" \
  --api-location "backend" \
  --output-location "dist"
```

#### Step 2: Configure API with Azure Functions
Create `backend/api/host.json`:
```json
{
  "version": "2.0",
  "extensions": {
    "http": {
      "routePrefix": "api"
    }
  }
}
```

### Option 3: Docker Container on Azure

#### Step 1: Create Dockerfile
```dockerfile
# Multi-stage build
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/package*.json ./
WORKDIR /app/backend
RUN npm ci --production
WORKDIR /app
EXPOSE 8080
CMD ["node", "backend/server.js"]
```

#### Step 2: Deploy to Azure Container Instances
```bash
# Build and push to Azure Container Registry
az acr build --registry hospitalcrmacr \
  --image hospital-crm:v1 .

# Create container instance
az container create \
  --resource-group hospital-crm-rg \
  --name hospital-crm-container \
  --image hospitalcrmacr.azurecr.io/hospital-crm:v1 \
  --dns-name-label hospital-crm \
  --ports 8080 \
  --environment-variables \
    AZURE_DB_HOST="valantdb.postgres.database.azure.com" \
    AZURE_DB_PORT="5432" \
    AZURE_DB_NAME="postgres" \
    AZURE_DB_USER="divyansh04" \
    AZURE_DB_PASSWORD="Rawal@00"
```

## Post-Deployment Steps

### 1. Configure Custom Domain (Optional)
```bash
az webapp config hostname add \
  --webapp-name hospital-crm-pro \
  --resource-group hospital-crm-rg \
  --hostname www.yourdomain.com
```

### 2. Enable HTTPS
```bash
az webapp config ssl create \
  --name hospital-crm-pro \
  --resource-group hospital-crm-rg
```

### 3. Setup Monitoring
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app hospital-crm-insights \
  --location "Central India" \
  --resource-group hospital-crm-rg

# Connect to Web App
az webapp config appsettings set \
  --resource-group hospital-crm-rg \
  --name hospital-crm-pro \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<instrumentation-key>
```

### 4. Configure Auto-scaling
```bash
az monitor autoscale create \
  --resource-group hospital-crm-rg \
  --resource hospital-crm-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-hospital-crm \
  --min-count 1 \
  --max-count 5 \
  --count 1
```

## Testing Your Deployment

1. **Access your application:**
   - App Service: `https://hospital-crm-pro.azurewebsites.net`
   - Static Web App: `https://hospital-crm-frontend.azurestaticapps.net`
   - Container: `http://hospital-crm.centralindia.azurecontainer.io:8080`

2. **Test API endpoints:**
   ```bash
   # Test health endpoint
   curl https://hospital-crm-pro.azurewebsites.net/api/health
   
   # Test authentication
   curl -X POST https://hospital-crm-pro.azurewebsites.net/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@hospital.com","password":"Admin@123"}'
   ```

3. **Login Credentials:**
   - Admin: `admin@hospital.com` / `Admin@123`
   - Doctors: Their respective emails / `Doctor123!`

## Troubleshooting

### Database Connection Issues
1. Check firewall rules:
```bash
az postgres server firewall-rule create \
  --resource-group your-db-rg \
  --server-name valantdb \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

2. Verify connection string in App Settings

### Application Errors
1. Check logs:
```bash
az webapp log tail \
  --name hospital-crm-pro \
  --resource-group hospital-crm-rg
```

2. Enable detailed error messages:
```bash
az webapp config set \
  --name hospital-crm-pro \
  --resource-group hospital-crm-rg \
  --web-sockets-enabled true \
  --detailed-error-messages true
```

## Cost Optimization

### Recommended Configuration for Production:
- **App Service Plan**: B2 (2 cores, 3.5 GB RAM) - ~$55/month
- **PostgreSQL**: Already configured
- **Storage**: Use Azure Blob Storage for files - ~$5/month
- **CDN**: Azure CDN for static assets - ~$10/month

### Development/Testing:
- **App Service Plan**: F1 (Free tier) - $0/month
- **PostgreSQL**: Already configured
- **Limited to 60 minutes CPU/day**

## Security Best Practices

1. **Enable Managed Identity:**
```bash
az webapp identity assign \
  --name hospital-crm-pro \
  --resource-group hospital-crm-rg
```

2. **Use Key Vault for Secrets:**
```bash
# Create Key Vault
az keyvault create \
  --name hospital-crm-kv \
  --resource-group hospital-crm-rg \
  --location "Central India"

# Store database password
az keyvault secret set \
  --vault-name hospital-crm-kv \
  --name "db-password" \
  --value "Rawal@00"
```

3. **Enable Azure AD Authentication** (Optional)

4. **Configure CORS properly** in production

## Backup Strategy

Your database is already on Azure PostgreSQL. Set up automated backups:

```bash
az postgres server configuration set \
  --name backup_retention_days \
  --resource-group your-db-rg \
  --server valantdb \
  --value 7
```

## Support

For issues or questions:
1. Check Azure Portal diagnostics
2. Review application logs
3. Verify database connectivity
4. Check network security groups

## Next Steps

1. ✅ Database migrated and configured
2. ✅ Backend API ready
3. ✅ Frontend configured
4. 🔄 Deploy to Azure App Service
5. 🔄 Configure custom domain
6. 🔄 Setup monitoring
7. 🔄 Enable auto-scaling
8. 🔄 Implement CI/CD pipeline