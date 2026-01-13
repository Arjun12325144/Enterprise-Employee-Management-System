# Enterprise Employee Management System (EMS)

A full-stack enterprise-grade Employee Management System built with **ASP.NET Core Web API** and **React** using Clean Architecture principles.

## Features

### Core Features
- 🔐 **JWT Authentication** with role-based authorization (Admin, Manager, Employee)
- 👥 **Employee Management** - Full CRUD operations with advanced filtering and search
- 🏢 **Department Management** - Organize employees into departments
- 📊 **Dashboard** - Real-time statistics and charts
- 🤖 **AI-Powered Search** - Smart employee search and skill insights
- 🎨 **Enterprise-grade UI** - Professional, responsive design with Tailwind CSS

### Role-based Access
- **Admin**: Full access to all features, manage employees, departments, and system settings
- **Manager**: Manage team members, view department analytics
- **Employee**: View own profile, team members, and limited dashboard access

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8.0 Web API
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, API layers)
- **Database**: SQL Server with Entity Framework Core 8.0 (Code First)
- **Authentication**: JWT Bearer tokens with role-based claims
- **Validation**: FluentValidation
- **Password Security**: BCrypt.Net

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom enterprise theme
- **State Management**: Zustand with persistence
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
EMS/
├── src/
│   ├── EMS.Domain/              # Domain entities and enums
│   │   ├── Entities/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── User.cs
│   │   │   ├── Employee.cs
│   │   │   ├── Department.cs
│   │   │   └── AuditLog.cs
│   │   └── Enums/
│   │       ├── UserRole.cs
│   │       └── EmploymentStatus.cs
│   │
│   ├── EMS.Application/         # Application layer (DTOs, interfaces, validators)
│   │   ├── Common/
│   │   │   ├── ApiResponse.cs
│   │   │   └── PagedResult.cs
│   │   ├── DTOs/
│   │   │   ├── AuthDtos.cs
│   │   │   ├── EmployeeDtos.cs
│   │   │   ├── DepartmentDtos.cs
│   │   │   ├── AIDtos.cs
│   │   │   └── DashboardDtos.cs
│   │   ├── Interfaces/
│   │   │   ├── IRepository.cs
│   │   │   ├── IUnitOfWork.cs
│   │   │   └── Services/
│   │   └── Validators/
│   │
│   ├── EMS.Infrastructure/      # Infrastructure layer (data access, external services)
│   │   ├── Data/
│   │   │   └── ApplicationDbContext.cs
│   │   ├── Repositories/
│   │   │   ├── Repository.cs
│   │   │   └── UnitOfWork.cs
│   │   └── Services/
│   │       ├── AuthService.cs
│   │       ├── EmployeeService.cs
│   │       ├── DepartmentService.cs
│   │       ├── DashboardService.cs
│   │       └── AIService.cs
│   │
│   └── EMS.API/                 # API layer (controllers, middleware)
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── EmployeesController.cs
│       │   ├── DepartmentsController.cs
│       │   ├── DashboardController.cs
│       │   └── AIController.cs
│       ├── Middleware/
│       │   └── ExceptionMiddleware.cs
│       └── Program.cs
│
└── frontend/                    # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── ui/
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Employees.tsx
    │   │   ├── EmployeeDetails.tsx
    │   │   ├── EmployeeForm.tsx
    │   │   ├── Departments.tsx
    │   │   ├── DepartmentForm.tsx
    │   │   └── Settings.tsx
    │   ├── services/
    │   ├── store/
    │   └── types/
    └── package.json
```

## Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (LocalDB or Express)

### Backend Setup

1. **Navigate to the solution directory**
   ```bash
   cd EMS
   ```

2. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

3. **Update database connection string** in `src/EMS.API/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=EMSDb;Trusted_Connection=True;MultipleActiveResultSets=true"
     }
   }
   ```

4. **Apply database migrations**
   ```bash
   cd src/EMS.API
   dotnet ef migrations add InitialCreate --project ../EMS.Infrastructure -s .
   dotnet ef database update --project ../EMS.Infrastructure -s .
   ```

5. **Run the API**
   ```bash
   dotnet run
   ```
   
   The API will be available at `https://localhost:7001` (or `http://localhost:5000`)

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Get current user |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (paginated) |
| GET | `/api/employees/{id}` | Get employee by ID |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Delete employee |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all departments |
| GET | `/api/departments/active` | List active departments |
| GET | `/api/departments/{id}` | Get department by ID |
| POST | `/api/departments` | Create department |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/search` | AI-powered employee search |
| POST | `/api/ai/skill-insights` | Get AI skill insights |

## Environment Variables

### Backend (`appsettings.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your-connection-string"
  },
  "Jwt": {
    "Key": "your-super-secret-key-that-is-at-least-256-bits",
    "Issuer": "EMS.API",
    "Audience": "EMS.Client",
    "ExpiryHours": 24
  },
  "AI": {
    "ApiKey": "your-openai-api-key",
    "Model": "gpt-4"
  }
}
```

### Frontend (`.env`)
```env
VITE_API_URL=https://localhost:7001/api
```

## Default Users (After Seeding)

You can seed default users by adding seed data in `ApplicationDbContext.cs`:

| Email | Password | Role |
|-------|----------|------|
| admin@ems.com | Admin@123 | Admin |
| manager@ems.com | Manager@123 | Manager |
| employee@ems.com | Employee@123 | Employee |

## Scripts

### Backend
```bash
dotnet build          # Build the solution
dotnet run            # Run the API
dotnet test           # Run tests
dotnet ef migrations add <name>  # Create migration
dotnet ef database update        # Apply migrations
```

### Frontend
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
