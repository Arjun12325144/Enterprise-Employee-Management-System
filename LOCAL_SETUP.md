# EMS Local Development Setup Guide

Complete guide for setting up the EMS application locally for development.

## Prerequisites

### Required Software
- **Git**: https://git-scm.com/download/win
- **.NET 8 SDK**: https://dotnet.microsoft.com/en-us/download/dotnet/8.0
- **Node.js 18+**: https://nodejs.org/
- **SQL Server** (optional, uses SQLite by default): https://www.microsoft.com/en-us/sql-server/sql-server-2022
- **VS Code**: https://code.visualstudio.com/
- **SQL Server Management Studio** (SSMS, optional): https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

### Verify Installation
```powershell
# Check .NET version
dotnet --version   # Should be 8.0.x or higher

# Check Node.js version
node --version     # Should be v18.x or higher
npm --version      # Should be 9.x or higher

# Check Git version
git --version      # Should be 2.x or higher
```

---

## Project Structure

```
EMS/
├── src/
│   └── EMS.API/                    # Backend (.NET API)
│   ├── EMS.Application/            # Business logic layer
│   ├── EMS.Domain/                 # Domain entities
│   └── EMS.Infrastructure/         # Data access layer
├── frontend/                        # React frontend
├── DEPLOYMENT.md                    # Deployment guide
├── DEPLOYMENT_CHECKLIST.md          # Pre-deployment checklist
├── TROUBLESHOOTING.md               # Troubleshooting guide
└── README.md                        # Project overview
```

---

## Backend Setup (.NET API)

### Step 1: Navigate to Backend Directory
```powershell
cd "C:\Users\hp\OneDrive\Desktop\Enterprise website\EMS\src\EMS.API"
```

### Step 2: Restore Dependencies
```powershell
dotnet restore
```

### Step 3: Build Project
```powershell
dotnet build
```

### Step 4: Run API
```powershell
dotnet run
```

**Expected Output**:
```
Now listening on: http://localhost:5000
Now listening on: https://localhost:5001
Application started. Press Ctrl+C to shut down.
```

### Step 5: Verify API is Running
```powershell
# Open new PowerShell window
curl http://localhost:5000/api/health
# Should return: {"status":"Healthy"}
```

### Backend Configuration

#### Default Database
- **Location**: `EMS.db` (SQLite, in project root)
- **Auto-created**: Yes, on first run
- **Seed Data**: 
  - Users: admin@ems.com, manager@ems.com, employee@ems.com (password: "admin123")
  - Departments: Engineering, Sales, Human Resources
  - Employees: 3 sample employees

#### Environment Variables
Create `appsettings.Development.json` for custom settings:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=./ems.db"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyForJwtTokenGeneration2024!@#$%^&*()_+",
    "Issuer": "EMS.API",
    "Audience": "EMS.Client",
    "ExpirationMinutes": "60",
    "RefreshTokenExpirationDays": "7"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

---

## Frontend Setup (React)

### Step 1: Navigate to Frontend Directory
```powershell
cd "C:\Users\hp\OneDrive\Desktop\Enterprise website\EMS\frontend"
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Create Environment File
```powershell
# Copy example environment file
Copy-Item .env.example .env.local

# Edit .env.local (open with VS Code)
code .env.local
```

**Content of `.env.local`**:
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Enterprise Management System
VITE_ENV=development
```

### Step 4: Start Development Server
```powershell
npm run dev
```

**Expected Output**:
```
VITE v5.4.21  dev server running at:

➜  Local:   http://localhost:3001/
```

### Step 5: Access Application
Open browser and navigate to: http://localhost:3001/

---

## First Login

### Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin@ems.com | admin123 |
| Manager | manager@ems.com | admin123 |
| Employee | employee@ems.com | admin123 |

### Initial Test Flow
1. Navigate to http://localhost:3001/
2. Login with `admin@ems.com` / `admin123`
3. Dashboard should load with data
4. Test navigation:
   - Click "Employees" → Should see 3 sample employees
   - Click "Departments" → Should see 3 departments
   - Click notification bell → Should see empty notifications (none sent yet)

---

## Common Development Tasks

### Running Tests

#### Backend Unit Tests
```powershell
cd src/EMS.API
dotnet test
```

#### Frontend Tests
```powershell
cd frontend
npm test
```

### Building for Production

#### Backend
```powershell
cd src/EMS.API
dotnet publish -c Release -o ./publish
```

#### Frontend
```powershell
cd frontend
npm run build
# Output: frontend/dist/
```

### Database Operations

#### View/Edit Database (SQLite)
```powershell
# Install SQLite browser (if not already installed)
# Download from: https://sqlitebrowser.org/

# Or use PowerShell to inspect
# Query database directly (requires SQLite extension)
```

#### Reset Database to Seed State
```powershell
cd src/EMS.API

# Delete database file
Remove-Item EMS.db

# Run API again to recreate with fresh seed
dotnet run
```

#### Update Database Schema
```powershell
cd src/EMS.Infrastructure

# Add migration
dotnet ef migrations add "DescriptionOfChange" --project ../EMS.API/

# Update database
dotnet ef database update --project ../EMS.API/
```

---

## Debugging

### Backend Debugging in VS Code

#### Step 1: Install C# Extension
- Open VS Code
- Go to Extensions
- Search for "C#"
- Install "C# Dev Kit" by Microsoft

#### Step 2: Open Folder
- File → Open Folder
- Select the `EMS` folder

#### Step 3: Debug
- Click Run → Add Configuration → C# (.NET)
- Set program to: `src/EMS.API/bin/Debug/net8.0/EMS.API.dll`
- Press F5 to start debugging

#### Step 4: Set Breakpoints
- Click on line number to add breakpoint
- Reload page to hit breakpoint
- Step through code with F10 (step over) or F11 (step in)

### Frontend Debugging

#### Using Browser DevTools
1. Open Firefox or Chrome
2. Press F12 to open Developer Tools
3. Go to Sources tab
4. Set breakpoints in source code
5. Reload page to trigger breakpoints

#### Using VS Code Debugger
```json
// Add to .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3001",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverride": {
        "${webRoot}/*": "${webRoot}/*"
      }
    }
  ]
}
```

---

## Troubleshooting Local Setup

### Issue: "Port 5000 already in use"

**Solution**:
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | 
  ForEach-Object { Get-Process -Id $_.OwningProcess }

# Kill process
Stop-Process -Id YOUR_PROCESS_ID -Force

# Or use different port
$env:ASPNETCORE_URLS="http://localhost:5001"
dotnet run
```

### Issue: "Port 3001 already in use"

**Solution**:
```powershell
# Use different port
npm run dev -- --port 3002
```

### Issue: "npm install fails"

**Solution**:
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

### Issue: "Database file is locked"

**Solution**:
```powershell
# Stop all dotnet processes
Get-Process -Name "dotnet" | Stop-Process -Force

# Delete database file
Remove-Item ems.db

# Run API again
dotnet run
```

### Issue: "CORS error when frontend calls API"

**Solution**:
```json
// Update appsettings.Development.json
"Cors": {
  "AllowedOrigins": ["http://localhost:3001", "http://localhost:3002"]
}
```

### Issue: "JWT token not being sent"

**Solution**:
```typescript
// Check in browser console
localStorage.getItem('token');  // Should show JWT token

// If empty, login again:
// 1. Click logout
// 2. Clear browser cache (Ctrl+Shift+Delete)
// 3. Login again
```

### Issue: "Hot reload not working"

**Solution**:
```powershell
# Stop frontend dev server (Ctrl+C)
# Delete node_modules and package-lock.json
Remove-Item -Recurse node_modules
Remove-Item package-lock.json

# Reinstall
npm install

# Start again
npm run dev
```

---

## Code Structure

### Backend Architecture

```
EMS.Domain/
├── Entities/           # Core business entities (User, Employee, etc.)
└── Enums/              # Enumerations (UserRole, EmployeeStatus, etc.)

EMS.Application/
├── DTOs/               # Data Transfer Objects for API requests/responses
├── Interfaces/         # Service interfaces (IEmployeeService, etc.)
├── Services/           # Business logic implementation
└── Validators/         # Input validation rules

EMS.Infrastructure/
├── Data/               # Database context and configuration
├── Repositories/       # Data access patterns
└── Services/           # Infrastructure services (PasswordHasher, etc.)

EMS.API/
├── Controllers/        # API endpoints (AuthController, EmployeesController, etc.)
├── Middleware/         # Request/response processing
├── Program.cs          # Dependency injection setup
└── appsettings.json    # Configuration
```

### Frontend Architecture

```
frontend/src/
├── components/         # Reusable React components (Layout, etc.)
│   └── ui/            # UI component library (buttons, forms, etc.)
├── pages/             # Full page components (Dashboard, Employees, etc.)
├── services/          # API communication (employeeService, authService, etc.)
├── store/             # State management (authStore)
├── types/             # TypeScript type definitions
├── App.tsx            # Main app component with routing
└── main.tsx           # Application entry point
```

---

## Git Workflow

### Clone Repository
```powershell
git clone https://your-repo-url.git
cd EMS
```

### Create Feature Branch
```powershell
git checkout -b feature/your-feature-name
```

### Commit Changes
```powershell
git add .
git commit -m "feat: description of your change"
```

### Push to Remote
```powershell
git push origin feature/your-feature-name
```

### Create Pull Request
- Go to GitHub/GitLab
- Click "New Pull Request"
- Select your branch
- Add description and request review

---

## Performance Tips

### Backend
- Use `.AsNoTracking()` for read-only queries
- Implement pagination for large datasets
- Use `async/await` properly
- Add database indexes for frequently queried fields
- Enable response caching where appropriate

### Frontend
- Use React.memo for expensive components
- Implement code splitting with dynamic imports
- Optimize images with proper sizing
- Use browser caching for API responses
- Minimize bundle size with tree shaking

---

## IDE Extensions Recommended

### VS Code

**For Backend (.NET)**:
- C# Dev Kit
- REST Client
- SQL Server
- Thunder Client

**For Frontend (React)**:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Thunder Client
- Tailwind CSS IntelliSense

### Visual Studio 2022

**Install Workloads**:
- ASP.NET and web development
- .NET desktop development
- Data storage and processing

---

## Additional Resources

- [.NET 8 Documentation](https://learn.microsoft.com/en-us/dotnet/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Getting Help

If you encounter issues:

1. **Check this guide** for troubleshooting section
2. **Check TROUBLESHOOTING.md** for common production issues
3. **Check logs**:
   - Backend: Check console output and `logs/` directory
   - Frontend: Check browser console (F12)
4. **Ask team members** on Slack/Teams
5. **Create GitHub issue** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment information
   - Screenshots/error messages

---

**Last Updated**: 2024
**Version**: 1.0
**Questions?** Contact your development team lead
