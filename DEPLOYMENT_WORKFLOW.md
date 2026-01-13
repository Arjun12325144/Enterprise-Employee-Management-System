# 🚀 EMS Deployment Workflow Guide

Complete step-by-step workflow for deploying the Enterprise Management System from development to production.

## 📌 Overview

This guide walks you through the entire deployment process from local development to live production environment. Choose your deployment platform and follow the corresponding steps.

---

## 🎯 Deployment Decision Matrix

| Requirement | Best Platform | Alternative | Notes |
|---|---|---|---|
| .NET Backend | Azure App Service | AWS EC2 | Native .NET support, easy scaling |
| React Frontend | Azure Static Web Apps | AWS S3 + CloudFront | Automatic HTTPS, CDN included |
| Complete Solution | Docker + Kubernetes | Azure Container Instances | Platform-agnostic, maximum flexibility |
| Budget Conscious | AWS Free Tier | Google Cloud | Lower cost, good for startups |
| Enterprise/Large Scale | Azure + SQL Server | AWS + RDS | Enterprise support, best SLA |

---

## 📋 Pre-Deployment Phase (1-2 Weeks Before)

### Step 1: Code Preparation (Days 1-3)
```powershell
# 1. Verify all tests pass
cd src/EMS.API
dotnet test

# 2. Build for production
cd src/EMS.API
dotnet build -c Release

# 3. Build frontend
cd frontend
npm run build
# Verify dist/ folder is created with all assets
```

### Step 2: Documentation Review (Day 3-4)
- [ ] Read DEPLOYMENT.md completely
- [ ] Review DEPLOYMENT_CHECKLIST.md
- [ ] Review TROUBLESHOOTING.md
- [ ] Familiarize with your chosen deployment platform docs

### Step 3: Team Preparation (Day 5)
- [ ] Notify team of deployment window
- [ ] Assign roles (Deployment Lead, Tech Lead, QA, DevOps)
- [ ] Schedule training on deployment procedures
- [ ] Create deployment communication channel

### Step 4: Infrastructure Planning (Days 6-7)
- [ ] Obtain SSL/TLS certificate
- [ ] Register domain name and configure DNS
- [ ] Create cloud accounts and resource groups
- [ ] Plan database migration strategy

### Step 5: Security Audit (Day 8)
- [ ] Generate new JWT secret key (32+ chars)
- [ ] Create strong database credentials
- [ ] Plan secret management strategy
- [ ] Verify CORS configuration
- [ ] Review API rate limiting settings

### Step 6: Backup & Testing (Days 9-10)
- [ ] Create development database backup
- [ ] Test database recovery procedure
- [ ] Verify backup restoration works
- [ ] Document rollback procedures

---

## 🔧 Setup Phase (Platform-Specific)

### Path A: Azure Deployment

#### Prerequisites
- Azure subscription (free tier available)
- Azure CLI installed (`az` command)
- Visual Studio Code with Azure extensions

#### Step 1: Create Azure Resources
```powershell
# Login to Azure
az login

# Create resource group
az group create --name ems-rg --location eastus

# Create App Service Plan
az appservice plan create `
  --name ems-plan `
  --resource-group ems-rg `
  --sku B2 `
  --is-linux

# Create App Service for Backend
az webapp create `
  --resource-group ems-rg `
  --plan ems-plan `
  --name ems-api-prod `
  --runtime "DOTNET|8.0"

# Create SQL Server
az sql server create `
  --name ems-sql-server `
  --resource-group ems-rg `
  --admin-user sqladmin `
  --admin-password "Your$trong!Pass123!"

# Create SQL Database
az sql db create `
  --server ems-sql-server `
  --resource-group ems-rg `
  --name EMS_Production `
  --sku Standard
```

#### Step 2: Deploy Backend
```powershell
# Navigate to backend
cd src/EMS.API

# Publish for deployment
dotnet publish -c Release -o ./publish

# Zip the published files
Compress-Archive -Path ./publish/* -DestinationPath ../ems-api.zip

# Deploy to App Service
az webapp deployment source config-zip `
  --resource-group ems-rg `
  --name ems-api-prod `
  --src ../ems-api.zip
```

#### Step 3: Configure Environment
```powershell
# Set application settings
az webapp config appsettings set `
  --resource-group ems-rg `
  --name ems-api-prod `
  --settings `
    ASPNETCORE_ENVIRONMENT=Production `
    ConnectionStrings__DefaultConnection="Server=tcp:ems-sql-server.database.windows.net;Database=EMS_Production;User Id=sqladmin;Password=Your$trong!Pass123;" `
    JwtSettings__SecretKey="YOUR_NEW_SECRET_KEY_32_CHARS_MIN"
```

#### Step 4: Deploy Frontend
```powershell
# Create Storage Account
az storage account create `
  --name emsfrondend `
  --resource-group ems-rg `
  --sku Standard_LRS

# Create Static Web App
az staticwebapp create `
  --name ems-frontend `
  --resource-group ems-rg `
  --source ./frontend/dist `
  --location eastus

# Upload frontend files
az storage blob upload-batch `
  --destination '$web' `
  --source ./frontend/dist `
  --account-name emsfrondend
```

### Path B: AWS Deployment

#### Prerequisites
- AWS account with appropriate permissions
- AWS CLI installed and configured
- EC2 key pair created

#### Step 1: Create EC2 Instance
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c94855ba95c574c8 \
  --instance-type t3.medium \
  --key-name your-key \
  --security-groups ems-sg \
  --region us-east-1

# Get instance IP
aws ec2 describe-instances --region us-east-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress'
```

#### Step 2: Configure Security Group
```bash
# Allow HTTP, HTTPS, SSH
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp --port 5000 --cidr 0.0.0.0/0
```

#### Step 3: Deploy Backend
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install .NET Runtime
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0

# Install PostgreSQL or SQL Server client
sudo apt-get update
sudo apt-get install postgresql-client -y

# Deploy application
scp -i your-key.pem -r src/EMS.API/publish/* \
  ubuntu@YOUR_EC2_IP:/home/ubuntu/ems-api/

# Start application
sudo systemctl start ems-api
sudo systemctl enable ems-api
```

#### Step 4: Deploy Frontend to S3
```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket ems-frontend-prod \
  --region us-east-1

# Upload frontend files
aws s3 sync frontend/dist/ s3://ems-frontend-prod/

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket ems-frontend-prod \
  --website-configuration file://website-config.json
```

### Path C: Docker Deployment

#### Step 1: Create Dockerfile
```dockerfile
# Dockerfile for Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/EMS.API/EMS.API.csproj", "src/EMS.API/"]
COPY ["src/EMS.Application/EMS.Application.csproj", "src/EMS.Application/"]
COPY ["src/EMS.Infrastructure/EMS.Infrastructure.csproj", "src/EMS.Infrastructure/"]
COPY ["src/EMS.Domain/EMS.Domain.csproj", "src/EMS.Domain/"]
RUN dotnet restore "src/EMS.API/EMS.API.csproj"
COPY . .
RUN dotnet build "src/EMS.API/EMS.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/EMS.API/EMS.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "EMS.API.dll"]
```

#### Step 2: Create Docker Compose
```yaml
version: '3.8'

services:
  ems-api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ConnectionStrings__DefaultConnection: "Host=db;Database=ems_production;Username=ems_user;Password=Your$trong!Pass123;"
      JwtSettings__SecretKey: "YOUR_SECRET_KEY"
    depends_on:
      - db
    networks:
      - ems-network

  ems-frontend:
    image: node:18
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: npm run build && serve -s dist -l 3000
    ports:
      - "3000:3000"
    networks:
      - ems-network

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ems_production
      POSTGRES_USER: ems_user
      POSTGRES_PASSWORD: Your$trong!Pass123!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - ems-network

networks:
  ems-network:
    driver: bridge

volumes:
  postgres_data:
```

#### Step 3: Deploy with Docker
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🔍 Verification Phase

### Database Verification
```sql
-- Check database connection
SELECT 1;

-- Verify tables created
SELECT * FROM INFORMATION_SCHEMA.TABLES;

-- Check seed data
SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Employees;
SELECT COUNT(*) FROM Departments;
```

### Backend Verification
```bash
# Check API health
curl https://your-api-domain.com/api/health

# Test login endpoint
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@ems.com","password":"admin123"}'

# Test get employees
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-domain.com/api/employees
```

### Frontend Verification
```bash
# Check frontend loads
curl -I https://your-domain.com

# Verify no 404s for assets
# Open browser console and check for errors
```

---

## 📊 Go-Live Phase

### Pre-Go-Live Checklist (24 hours before)
- [ ] All systems tested and verified
- [ ] Team assembled and on-call
- [ ] Rollback procedures reviewed
- [ ] Communication channels open
- [ ] Status page ready to update
- [ ] Monitoring dashboards configured

### Go-Live Steps
1. **T-0:00** - Begin deployment
2. **T-0:30** - Backend deployed and verified
3. **T-1:00** - Database migrations completed
4. **T-1:30** - Frontend deployed and verified
5. **T-2:00** - Full system testing completed
6. **T-2:30** - Team approval to activate
7. **T-3:00** - Update DNS/load balancer to point to production
8. **T-3:30** - Smoke testing in production
9. **T-4:00** - Notify users, system live

### Post-Go-Live Monitoring (First 24 hours)
- Monitor error logs every 15 minutes
- Check API response times
- Verify database performance
- Monitor server resource usage
- Track user login success rate
- Watch for customer issues/support tickets

---

## 🆘 Rollback Procedures

### If Critical Issue Found Within 1 Hour

**Step 1: Activate Rollback**
```bash
# Revert database changes
# Restore from pre-deployment backup

# Restore previous API version
# Point load balancer to previous backend

# Restore previous frontend version
# Clear CDN cache
```

**Step 2: Verify Rollback**
- Test API health check
- Test frontend loading
- Test login functionality
- Monitor error logs

**Step 3: Communicate Rollback**
- Update status page
- Notify users
- Post-mortem scheduled

---

## 📈 Post-Deployment (First Week)

### Day 1
- Continuous monitoring every 1 hour
- Document any issues
- Minor bug fixes only
- No new deployments

### Days 2-3
- Expand monitoring to every 4 hours
- Review performance metrics
- Fine-tune scaling parameters
- Continue monitoring for issues

### Days 4-7
- Move to normal monitoring schedule
- Analyze performance baseline
- Document lessons learned
- Plan any necessary optimizations

---

## 🎯 Success Criteria

Your deployment is successful when:
- [x] API responds to all requests
- [x] Frontend loads without errors
- [x] Users can login with default credentials
- [x] Dashboard displays correctly
- [x] Employees can be viewed/created/updated/deleted
- [x] Departments can be viewed/created/updated/deleted
- [x] Notifications can be sent and received
- [x] All features work as documented
- [x] Performance meets SLA requirements
- [x] No critical errors in logs

---

## 🚨 Emergency Contacts

| Role | Contact | Phone | Available |
|------|---------|-------|-----------|
| Development Lead | [Name] | [Phone] | 24/7 during deployment |
| DevOps Engineer | [Name] | [Phone] | 24/7 during deployment |
| Database Admin | [Name] | [Phone] | 24/7 during deployment |
| On-Call Manager | [Name] | [Phone] | Escalation only |

---

## 📚 Reference Documents

- **DEPLOYMENT.md** - Detailed deployment instructions
- **DEPLOYMENT_CHECKLIST.md** - Pre/post deployment checklist
- **TROUBLESHOOTING.md** - Common issues and solutions
- **LOCAL_SETUP.md** - Local development setup
- **README.md** - Project overview

---

## 🎓 Key Learnings & Tips

### General Best Practices
1. **Test thoroughly before deployment** - All features should work locally
2. **Deploy during low-traffic periods** - Minimize user impact
3. **Have rollback plan ready** - Know how to revert quickly
4. **Communicate early and often** - Keep stakeholders informed
5. **Monitor continuously** - First 24 hours are critical
6. **Keep it simple** - Deploy incrementally, not all at once
7. **Document everything** - For future reference and training

### Platform-Specific Tips
- **Azure**: Leverage auto-scaling and managed services
- **AWS**: Use RDS for database, Lambda for serverless tasks
- **Docker**: Keep images small and use multi-stage builds

---

## ✅ Deployment Completion

When deployment is complete:
1. Update project status to "LIVE"
2. Archive deployment artifacts
3. Schedule post-deployment review
4. Update runbooks with any changes
5. Celebrate team success!

---

**Version**: 1.0
**Last Updated**: 2024
**Owner**: DevOps/Deployment Team

For questions or clarifications, refer to the detailed deployment guides or contact your deployment team lead.
