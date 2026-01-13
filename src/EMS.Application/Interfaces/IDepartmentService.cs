using EMS.Application.Common;
using EMS.Application.DTOs.Department;

namespace EMS.Application.Interfaces;

public interface IDepartmentService
{
    Task<ApiResponse<DepartmentDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PagedResult<DepartmentListDto>>> GetAllAsync(PaginationParams pagination, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DepartmentListDto>>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<DepartmentDto>> UpdateAsync(Guid id, UpdateDepartmentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
