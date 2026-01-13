using EMS.Application.Common;
using EMS.Application.DTOs.Department;
using EMS.Application.Interfaces;
using EMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DepartmentService> _logger;

    public DepartmentService(IUnitOfWork unitOfWork, ILogger<DepartmentService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<DepartmentDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var department = await _unitOfWork.Departments.Query()
                .Include(d => d.Manager)
                    .ThenInclude(m => m!.User)
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

            if (department == null)
            {
                return ApiResponse<DepartmentDto>.FailureResponse("Department not found");
            }

            return ApiResponse<DepartmentDto>.SuccessResponse(MapToDepartmentDto(department));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting department by ID: {Id}", id);
            return ApiResponse<DepartmentDto>.FailureResponse("An error occurred while fetching department");
        }
    }

    public async Task<ApiResponse<PagedResult<DepartmentListDto>>> GetAllAsync(PaginationParams pagination, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Departments.Query()
                .Include(d => d.Manager)
                    .ThenInclude(m => m!.User)
                .Include(d => d.Employees)
                .AsQueryable();

            // Apply search
            if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
            {
                var searchTerm = pagination.SearchTerm.ToLower();
                query = query.Where(d => 
                    d.Name.ToLower().Contains(searchTerm) ||
                    d.Code.ToLower().Contains(searchTerm));
            }

            // Apply sorting
            query = pagination.SortBy?.ToLower() switch
            {
                "name" => pagination.SortDescending 
                    ? query.OrderByDescending(d => d.Name) 
                    : query.OrderBy(d => d.Name),
                "code" => pagination.SortDescending 
                    ? query.OrderByDescending(d => d.Code) 
                    : query.OrderBy(d => d.Code),
                "employeecount" => pagination.SortDescending 
                    ? query.OrderByDescending(d => d.Employees.Count) 
                    : query.OrderBy(d => d.Employees.Count),
                _ => query.OrderBy(d => d.Name)
            };

            var totalCount = await query.CountAsync(cancellationToken);

            var departments = await query
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync(cancellationToken);

            var result = new PagedResult<DepartmentListDto>
            {
                Items = departments.Select(MapToDepartmentListDto).ToList(),
                TotalCount = totalCount,
                PageNumber = pagination.PageNumber,
                PageSize = pagination.PageSize
            };

            return ApiResponse<PagedResult<DepartmentListDto>>.SuccessResponse(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting departments list");
            return ApiResponse<PagedResult<DepartmentListDto>>.FailureResponse("An error occurred while fetching departments");
        }
    }

    public async Task<ApiResponse<List<DepartmentListDto>>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var departments = await _unitOfWork.Departments.Query()
                .Include(d => d.Manager)
                    .ThenInclude(m => m!.User)
                .Include(d => d.Employees)
                .Where(d => d.IsActive)
                .OrderBy(d => d.Name)
                .ToListAsync(cancellationToken);

            return ApiResponse<List<DepartmentListDto>>.SuccessResponse(
                departments.Select(MapToDepartmentListDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active departments");
            return ApiResponse<List<DepartmentListDto>>.FailureResponse("An error occurred while fetching departments");
        }
    }

    public async Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if code exists
            var codeExists = await _unitOfWork.Departments.AnyAsync(
                d => d.Code.ToLower() == dto.Code.ToLower(), cancellationToken);
            if (codeExists)
            {
                return ApiResponse<DepartmentDto>.FailureResponse("Department code already exists");
            }

            var department = new Department
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Code = dto.Code.ToUpper(),
                Description = dto.Description,
                ManagerId = dto.ManagerId,
                IsActive = true
            };

            await _unitOfWork.Departments.AddAsync(department, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var result = await GetByIdAsync(department.Id, cancellationToken);
            _logger.LogInformation("Department created: {Code}", department.Code);
            return ApiResponse<DepartmentDto>.SuccessResponse(result.Data!, "Department created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating department");
            return ApiResponse<DepartmentDto>.FailureResponse("An error occurred while creating department");
        }
    }

    public async Task<ApiResponse<DepartmentDto>> UpdateAsync(Guid id, UpdateDepartmentDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var department = await _unitOfWork.Departments.GetByIdAsync(id, cancellationToken);
            if (department == null)
            {
                return ApiResponse<DepartmentDto>.FailureResponse("Department not found");
            }

            // Check if code exists (excluding current department)
            var codeExists = await _unitOfWork.Departments.AnyAsync(
                d => d.Code.ToLower() == dto.Code.ToLower() && d.Id != id, cancellationToken);
            if (codeExists)
            {
                return ApiResponse<DepartmentDto>.FailureResponse("Department code already exists");
            }

            department.Name = dto.Name;
            department.Code = dto.Code.ToUpper();
            department.Description = dto.Description;
            department.ManagerId = dto.ManagerId;
            department.IsActive = dto.IsActive;

            _unitOfWork.Departments.Update(department);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var result = await GetByIdAsync(id, cancellationToken);
            _logger.LogInformation("Department updated: {Code}", department.Code);
            return ApiResponse<DepartmentDto>.SuccessResponse(result.Data!, "Department updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating department: {Id}", id);
            return ApiResponse<DepartmentDto>.FailureResponse("An error occurred while updating department");
        }
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var department = await _unitOfWork.Departments.Query()
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

            if (department == null)
            {
                return ApiResponse.FailureResponse("Department not found");
            }

            if (department.Employees.Any())
            {
                return ApiResponse.FailureResponse("Cannot delete department with active employees");
            }

            _unitOfWork.Departments.Remove(department);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Department deleted: {Code}", department.Code);
            return ApiResponse.SuccessResponse("Department deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting department: {Id}", id);
            return ApiResponse.FailureResponse("An error occurred while deleting department");
        }
    }

    private static DepartmentDto MapToDepartmentDto(Department department)
    {
        return new DepartmentDto
        {
            Id = department.Id,
            Name = department.Name,
            Code = department.Code,
            Description = department.Description,
            ManagerId = department.ManagerId,
            ManagerName = department.Manager?.User.FullName,
            IsActive = department.IsActive,
            EmployeeCount = department.Employees.Count,
            CreatedAt = department.CreatedAt
        };
    }

    private static DepartmentListDto MapToDepartmentListDto(Department department)
    {
        return new DepartmentListDto
        {
            Id = department.Id,
            Name = department.Name,
            Code = department.Code,
            ManagerName = department.Manager?.User.FullName,
            EmployeeCount = department.Employees.Count,
            IsActive = department.IsActive
        };
    }
}
