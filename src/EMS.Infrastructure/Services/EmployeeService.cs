using EMS.Application.Common;
using EMS.Application.DTOs.Employee;
using EMS.Application.Interfaces;
using EMS.Domain.Entities;
using EMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, ILogger<EmployeeService> logger)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<ApiResponse<EmployeeDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .Include(e => e.ReportsTo)
                    .ThenInclude(r => r!.User)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Employee not found");
            }

            return ApiResponse<EmployeeDto>.SuccessResponse(MapToEmployeeDto(employee));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employee by ID: {Id}", id);
            return ApiResponse<EmployeeDto>.FailureResponse("An error occurred while fetching employee");
        }
    }

    public async Task<ApiResponse<PagedResult<EmployeeListDto>>> GetAllAsync(
        PaginationParams pagination, 
        EmployeeFilterParams? filters = null, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .AsQueryable();

            // Apply filters
            if (filters != null)
            {
                if (filters.DepartmentId.HasValue)
                    query = query.Where(e => e.DepartmentId == filters.DepartmentId.Value);

                if (filters.Status.HasValue)
                    query = query.Where(e => e.Status == filters.Status.Value);

                if (filters.Role.HasValue)
                    query = query.Where(e => e.User.Role == filters.Role.Value);

                if (filters.HireDateFrom.HasValue)
                    query = query.Where(e => e.HireDate >= filters.HireDateFrom.Value);

                if (filters.HireDateTo.HasValue)
                    query = query.Where(e => e.HireDate <= filters.HireDateTo.Value);

                if (filters.MinSalary.HasValue)
                    query = query.Where(e => e.Salary >= filters.MinSalary.Value);

                if (filters.MaxSalary.HasValue)
                    query = query.Where(e => e.Salary <= filters.MaxSalary.Value);
            }

            // Apply search
            if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
            {
                var searchTerm = pagination.SearchTerm.ToLower();
                query = query.Where(e => 
                    e.User.FirstName.ToLower().Contains(searchTerm) ||
                    e.User.LastName.ToLower().Contains(searchTerm) ||
                    e.User.Email.ToLower().Contains(searchTerm) ||
                    e.EmployeeCode.ToLower().Contains(searchTerm) ||
                    e.Position.ToLower().Contains(searchTerm) ||
                    e.Department.Name.ToLower().Contains(searchTerm));
            }

            // Apply sorting
            query = pagination.SortBy?.ToLower() switch
            {
                "name" => pagination.SortDescending 
                    ? query.OrderByDescending(e => e.User.FirstName).ThenByDescending(e => e.User.LastName)
                    : query.OrderBy(e => e.User.FirstName).ThenBy(e => e.User.LastName),
                "email" => pagination.SortDescending 
                    ? query.OrderByDescending(e => e.User.Email) 
                    : query.OrderBy(e => e.User.Email),
                "department" => pagination.SortDescending 
                    ? query.OrderByDescending(e => e.Department.Name) 
                    : query.OrderBy(e => e.Department.Name),
                "position" => pagination.SortDescending 
                    ? query.OrderByDescending(e => e.Position) 
                    : query.OrderBy(e => e.Position),
                "hiredate" => pagination.SortDescending 
                    ? query.OrderByDescending(e => e.HireDate) 
                    : query.OrderBy(e => e.HireDate),
                _ => query.OrderBy(e => e.EmployeeCode)
            };

            var totalCount = await query.CountAsync(cancellationToken);
            
            var employees = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync(cancellationToken);

            var result = new PagedResult<EmployeeListDto>
            {
                Items = employees.Select(MapToEmployeeListDto).ToList(),
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            };

            return ApiResponse<PagedResult<EmployeeListDto>>.SuccessResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employees list");
            return ApiResponse<PagedResult<EmployeeListDto>>.FailureResponse("An error occurred while fetching employees");
        }
    }

    public async Task<ApiResponse<EmployeeDto>> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            await _unitOfWork.BeginTransactionAsync(cancellationToken);

            // Check if email exists
            var emailExists = await _unitOfWork.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower(), cancellationToken);
            if (emailExists)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Email is already in use");
            }

            // Check if department exists
            var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId, cancellationToken);
            if (department == null)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Department not found");
            }

            // Create user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                PasswordHash = _passwordHasher.HashPassword(dto.Password),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = dto.Role,
                IsActive = true
            };
            await _unitOfWork.Users.AddAsync(user, cancellationToken);

            // Generate employee code
            var employeeCount = await _unitOfWork.Employees.CountAsync(cancellationToken: cancellationToken);
            var employeeCode = $"EMP{(employeeCount + 1).ToString().PadLeft(5, '0')}";

            // Create employee
            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                EmployeeCode = employeeCode,
                UserId = user.Id,
                DepartmentId = dto.DepartmentId,
                Position = dto.Position,
                Phone = dto.Phone,
                Address = dto.Address,
                DateOfBirth = dto.DateOfBirth,
                HireDate = dto.HireDate,
                Salary = dto.Salary,
                Skills = dto.Skills,
                Status = EmploymentStatus.Active,
                ReportsToId = dto.ReportsToId
            };
            await _unitOfWork.Employees.AddAsync(employee, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            // Fetch complete employee data
            var result = await GetByIdAsync(employee.Id, cancellationToken);
            if (!result.Success)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Employee created but failed to fetch details");
            }

            _logger.LogInformation("Employee created: {EmployeeCode}", employeeCode);
            return ApiResponse<EmployeeDto>.SuccessResponse(result.Data!, "Employee created successfully");
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            _logger.LogError(ex, "Error creating employee");
            return ApiResponse<EmployeeDto>.FailureResponse("An error occurred while creating employee");
        }
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Employee not found");
            }

            // Check if department exists
            var department = await _unitOfWork.Departments.GetByIdAsync(dto.DepartmentId, cancellationToken);
            if (department == null)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Department not found");
            }

            // Update user
            employee.User.FirstName = dto.FirstName;
            employee.User.LastName = dto.LastName;
            _unitOfWork.Users.Update(employee.User);

            // Update employee
            employee.Position = dto.Position;
            employee.Phone = dto.Phone;
            employee.Address = dto.Address;
            employee.DateOfBirth = dto.DateOfBirth;
            employee.Salary = dto.Salary;
            employee.Status = dto.Status;
            employee.DepartmentId = dto.DepartmentId;
            employee.Skills = dto.Skills;
            employee.ReportsToId = dto.ReportsToId;
            _unitOfWork.Employees.Update(employee);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var result = await GetByIdAsync(id, cancellationToken);
            _logger.LogInformation("Employee updated: {EmployeeCode}", employee.EmployeeCode);
            return ApiResponse<EmployeeDto>.SuccessResponse(result.Data!, "Employee updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee: {Id}", id);
            return ApiResponse<EmployeeDto>.FailureResponse("An error occurred while updating employee");
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return ApiResponse.FailureResponse("Employee not found");
            }

            // Soft delete both employee and user
            _unitOfWork.Employees.Remove(employee);
            _unitOfWork.Users.Remove(employee.User);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Employee deleted: {EmployeeCode}", employee.EmployeeCode);
            return ApiResponse.SuccessResponse("Employee deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee: {Id}", id);
            return ApiResponse.FailureResponse("An error occurred while deleting employee");
        }
    }

    public async Task<ApiResponse<List<EmployeeListDto>>> GetByDepartmentAsync(Guid departmentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var employees = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => e.DepartmentId == departmentId)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<EmployeeListDto>>.SuccessResponse(
                employees.Select(MapToEmployeeListDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employees by department: {DepartmentId}", departmentId);
            return ApiResponse<List<EmployeeListDto>>.FailureResponse("An error occurred while fetching employees");
        }
    }

    public async Task<ApiResponse<List<EmployeeListDto>>> GetDirectReportsAsync(Guid managerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var employees = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => e.ReportsToId == managerId)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<EmployeeListDto>>.SuccessResponse(
                employees.Select(MapToEmployeeListDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting direct reports for manager: {ManagerId}", managerId);
            return ApiResponse<List<EmployeeListDto>>.FailureResponse("An error occurred while fetching direct reports");
        }
    }

    public async Task<ApiResponse<List<EmployeeListDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        try
        {
            var term = searchTerm.ToLower();
            var employees = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => 
                    e.User.FirstName.ToLower().Contains(term) ||
                    e.User.LastName.ToLower().Contains(term) ||
                    e.User.Email.ToLower().Contains(term) ||
                    e.EmployeeCode.ToLower().Contains(term) ||
                    e.Position.ToLower().Contains(term) ||
                    (e.Skills != null && e.Skills.ToLower().Contains(term)))
                .Take(20)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<EmployeeListDto>>.SuccessResponse(
                employees.Select(MapToEmployeeListDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching employees: {SearchTerm}", searchTerm);
            return ApiResponse<List<EmployeeListDto>>.FailureResponse("An error occurred while searching employees");
        }
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateStatusAsync(Guid id, EmploymentStatus status, CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

            if (employee == null)
            {
                return ApiResponse<EmployeeDto>.FailureResponse("Employee not found");
            }

            var oldStatus = employee.Status;
            employee.Status = status;

            // If terminating, set termination date
            if (status == EmploymentStatus.Terminated && employee.TerminationDate == null)
            {
                employee.TerminationDate = DateTime.UtcNow;
            }
            // If reactivating, clear termination date
            else if (status == EmploymentStatus.Active && employee.TerminationDate != null)
            {
                employee.TerminationDate = null;
            }

            _unitOfWork.Employees.Update(employee);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Employee {EmployeeCode} status changed from {OldStatus} to {NewStatus}", 
                employee.EmployeeCode, oldStatus, status);

            return await GetByIdAsync(id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating employee status: {Id}", id);
            return ApiResponse<EmployeeDto>.FailureResponse("An error occurred while updating employee status");
        }
    }

    private static EmployeeDto MapToEmployeeDto(Employee employee)
    {
        return new EmployeeDto
        {
            Id = employee.Id,
            EmployeeCode = employee.EmployeeCode,
            FirstName = employee.User.FirstName,
            LastName = employee.User.LastName,
            FullName = employee.User.FullName,
            Email = employee.User.Email,
            Position = employee.Position,
            Phone = employee.Phone,
            Address = employee.Address,
            DateOfBirth = employee.DateOfBirth,
            HireDate = employee.HireDate,
            TerminationDate = employee.TerminationDate,
            Salary = employee.Salary,
            Status = employee.Status.ToString(),
            Skills = employee.Skills,
            ResumeUrl = employee.ResumeUrl,
            ProfileImageUrl = employee.ProfileImageUrl,
            DepartmentId = employee.DepartmentId,
            DepartmentName = employee.Department.Name,
            ReportsToId = employee.ReportsToId,
            ReportsToName = employee.ReportsTo?.User.FullName,
            Role = employee.User.Role.ToString(),
            CreatedAt = employee.CreatedAt
        };
    }

    private static EmployeeListDto MapToEmployeeListDto(Employee employee)
    {
        return new EmployeeListDto
        {
            Id = employee.Id,
            EmployeeCode = employee.EmployeeCode,
            FullName = employee.User.FullName,
            Email = employee.User.Email,
            Position = employee.Position,
            DepartmentName = employee.Department.Name,
            Status = employee.Status.ToString(),
            ProfileImageUrl = employee.ProfileImageUrl,
            HireDate = employee.HireDate
        };
    }
}
