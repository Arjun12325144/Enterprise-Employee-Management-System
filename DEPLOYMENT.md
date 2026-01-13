# EMS (Enterprise Management System) Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment (.NET API)](#backend-deployment-net-api)
3. [Frontend Deployment (React)](#frontend-deployment-react)
4. [Database Setup](#database-setup)
5. [Popular Hosting Options](#popular-hosting-options)

---

## Prerequisites

- .NET 8 SDK installed
- Node.js 18+ installed
- Git installed
- A hosting provider account (choose one from the options below)

---

## Backend Deployment (.NET API)

### Option 1: Azure App Service (Recommended for .NET)

#### Step 1: Create Azure Account
1. Go to https://azure.microsoft.com/
2. Click "Start free"
3. Sign up with your Microsoft account

#### Step 2: Create App Service
1. In Azure Portal, search for "App Services"
2. Click "Create"
3. Select:
   - **Resource Group**: Create new (e.g., `ems-rg`)
   - **Name**: `ems-api` (must be unique)
   - **Publish**: Code
   - **Runtime stack**: .NET 8 (LTS)
   - **Operating System**: Windows
   - **Region**: Choose closest to your users
   - **App Service Plan**: Create new (B1 - Free tier available for 12 months)
4. Click "Review + Create" → "Create"

#### Step 3: Configure Database Connection
1. Go to your App Service
2. Click "Configuration" (left menu)
3. Click "New connection string"
4. Add:
   - **Name**: `DefaultConnection`
   - **Value**: `Data Source=./ems.db;Cache=shared`
   - **Type**: SQLite
5. Click "OK" → "Save"

#### Step 4: Deploy from GitHub
1. In App Service, click "Deployment Center" (left menu)
2. Select **GitHub** as source
3. Authenticate with GitHub
4. Select:
   - **Organization**: Your GitHub account
   - **Repository**: Your EMS repo
   - **Branch**: main
5. Click "Save"
6. App Service will automatically build and deploy

#### Step 5: Enable CORS for Frontend
1. In App Service, click "CORS" (left menu)
2. Add your frontend URL (e.g., `https://ems-frontend.vercel.app`)
3. Click "Save"

**API URL**: `https://ems-api.azurewebsites.net`

---

### Option 2: AWS Elastic Beanstalk

#### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Click "Create AWS Account"
3. Complete signup

#### Step 2: Deploy via Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Navigate to project root
cd c:\Users\hp\OneDrive\Desktop\Enterprise\ website\EMS

# Initialize EB
eb init -p "dotnet 8.0 running on 64bit Windows Server" ems-api

# Create environment
eb create ems-api-prod

# Deploy
eb deploy
```

#### Step 3: Configure Environment Variables
```bash
eb setenv DefaultConnection="Data Source=./ems.db;Cache=shared"
```

**API URL**: Provided by AWS (e.g., `ems-api-prod.elasticbeanstalk.com`)

---

### Option 3: Heroku (Free Alternative)

#### Step 1: Create Heroku Account
1. Go to https://heroku.com/
2. Sign up
3. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

#### Step 2: Deploy
```bash
# Login to Heroku
heroku login

# Navigate to API directory
cd c:\Users\hp\OneDrive\Desktop\Enterprise\ website\EMS\src\EMS.API

# Create Heroku app
heroku create ems-api

# Add buildpack for .NET
heroku buildpacks:add https://github.com/jincod/dotnetcore-buildpack.git

# Deploy
git push heroku main
```

**API URL**: `https://ems-api.herokuapp.com`

---

## Frontend Deployment (React)

### Option 1: Vercel (Recommended for React)

#### Step 1: Create Vercel Account
1. Go to https://vercel.com/
2. Click "Sign Up"
3. Sign up with GitHub account

#### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Select the `frontend` folder as root directory
4. Click "Deploy"

#### Step 3: Set Environment Variables
1. Go to Project Settings → Environment Variables
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ems-api.azurewebsites.net` (your backend URL)
3. Click "Save and Deploy"

**Frontend URL**: `https://ems-frontend.vercel.app`

### Option 2: Netlify

#### Step 1: Create Netlify Account
1. Go to https://netlify.com/
2. Sign up with GitHub

#### Step 2: Deploy
1. Click "Add new site" → "Import an existing project"
2. Select GitHub → Authorize
3. Select your EMS repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

#### Step 3: Set Environment Variables
1. Go to Site settings → Build & deploy → Environment
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://ems-api.azurewebsites.net`
3. Redeploy

**Frontend URL**: `https://ems-frontend.netlify.app`

### Option 3: GitHub Pages + GitHub Actions

#### Step 1: Enable GitHub Pages
1. Go to repository Settings → Pages
2. Select "GitHub Actions" as deployment source

#### Step 2: Create Deployment Workflow
Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Deploy to Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

**Frontend URL**: `https://yourusername.github.io/ems`

---

## Database Setup

### Option 1: Azure SQL Database

1. In Azure Portal, search "SQL databases"
2. Click "Create"
3. Select your resource group
4. Enter database name: `ems-db`
5. Click "Configure database"
6. Choose: **Provisioned**, **Standard tier**
7. Review and Create

Update connection string in App Service:
```
Server=tcp:ems-db.database.windows.net,1433;Initial Catalog=ems-db;Persist Security Info=False;User ID=sqladmin;Password=YourPassword@123;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### Option 2: Keep SQLite (Simpler)

SQLite database file (`ems.db`) will be stored in the App Service file system. This is sufficient for small to medium deployments.

---

## Step-by-Step Deployment Summary

### For Quick Deployment (Recommended):

```bash
# 1. Prepare backend
cd c:\Users\hp\OneDrive\Desktop\Enterprise\ website\EMS
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ems.git
git push -u origin main

# 2. Deploy Backend to Azure
# Follow Azure App Service steps above

# 3. Update frontend environment
# In frontend folder, create .env.production:
# VITE_API_URL=https://ems-api.azurewebsites.net

# 4. Deploy Frontend to Vercel
# Follow Vercel steps above
```

---

## Post-Deployment Configuration

### 1. Update API Base URL in Frontend

After backend deployment, update `frontend/src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'https://ems-api.azurewebsites.net';
```

### 2. Enable CORS

Update backend `Program.cs` with your frontend URL:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://ems-frontend.vercel.app")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### 3. Configure SSL/HTTPS
Most hosting providers automatically provide HTTPS. Ensure your connections use `https://`.

---

## Monitoring & Maintenance

### Azure App Service Monitoring
1. Go to App Service → "Metrics"
2. Monitor: CPU, Memory, HTTP requests
3. Set up alerts for high resource usage

### Vercel Analytics
1. Go to Analytics tab
2. Monitor page performance and errors

### Database Backups
- Azure SQL: Automatic backups (35 days retention)
- SQLite: Manually backup `ems.db` regularly

---

## Troubleshooting

### 502 Bad Gateway Error
- Check if backend is running
- Verify database connection string
- Check logs in hosting provider

### CORS Errors
- Ensure frontend URL is added to backend CORS policy
- Clear browser cache
- Check if API server is running

### Database Connection Issues
- Verify connection string in environment variables
- Ensure database file permissions
- Check network/firewall rules

---

## Testing Deployment

1. **Test Backend API**:
   ```
   GET https://ems-api.azurewebsites.net/health
   ```

2. **Test Frontend Load**:
   ```
   Open https://ems-frontend.vercel.app/login
   ```

3. **Test End-to-End**:
   - Login with `admin@ems.com` / `Admin@123`
   - Navigate to Employees
   - Check if data loads from API

---

## Cost Estimates (Monthly)

| Service | Cost |
|---------|------|
| Azure App Service (B1) | $0-15 |
| Azure SQL Database | $0-50 |
| Vercel | Free-20 |
| **Total** | **Free-85** |

---

## Recommended Deployment Architecture

```
┌─────────────────────────────────────────┐
│   Users                                 │
│   https://ems-frontend.vercel.app       │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼──────────────────────┐
│   Frontend (React)                      │
│   Vercel / Netlify                      │
└──────────────────┬──────────────────────┘
                   │
                   │ HTTPS API Calls
                   │
┌──────────────────▼──────────────────────┐
│   Backend (.NET 8)                      │
│   Azure App Service / AWS EB            │
└──────────────────┬──────────────────────┘
                   │
                   │ Database Connection
                   │
┌──────────────────▼──────────────────────┐
│   Database (SQLite / SQL Server)        │
│   Local file / Azure SQL Database       │
└─────────────────────────────────────────┘
```

---

## Support & Next Steps

1. **For Azure**: https://docs.microsoft.com/azure/
2. **For Vercel**: https://vercel.com/docs
3. **For .NET**: https://dotnet.microsoft.com/
4. **For React**: https://react.dev/

Good luck with your deployment! 🚀
