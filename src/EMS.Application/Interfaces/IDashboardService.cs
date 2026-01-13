using EMS.Application.Common;
using EMS.Application.DTOs.Dashboard;

namespace EMS.Application.Interfaces;

public interface IDashboardService
{
    Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
}
