using EMS.Application.Common;
using EMS.Application.DTOs.Employee;
using EMS.Domain.Enums;

namespace EMS.Application.Interfaces;

public interface IEmployeeService
{
    Task<ApiResponse<EmployeeDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<EmployeeListDto>>> GetAllAsync(PaginationParams pagination, EmployeeFilterParams? filters = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<EmployeeDto>> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<EmployeeDto>> UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EmployeeListDto>>> GetByDepartmentAsync(Guid departmentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EmployeeListDto>>> GetDirectReportsAsync(Guid managerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EmployeeListDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<ApiResponse<EmployeeDto>> UpdateStatusAsync(Guid id, EmploymentStatus status, CancellationToken cancellationToken = default);
}
