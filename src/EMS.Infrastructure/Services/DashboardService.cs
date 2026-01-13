using EMS.Application.Common;
using EMS.Application.DTOs.Dashboard;
using EMS.Application.Interfaces;
using EMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(IUnitOfWork unitOfWork, ILogger<DashboardService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var totalEmployees = await _unitOfWork.Employees.CountAsync(cancellationToken: cancellationToken);
            var activeEmployees = await _unitOfWork.Employees.CountAsync(
                e => e.Status == EmploymentStatus.Active, cancellationToken);
            var totalDepartments = await _unitOfWork.Departments.CountAsync(
                d => d.IsActive, cancellationToken);

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var newHiresThisMonth = await _unitOfWork.Employees.CountAsync(
                e => e.HireDate >= startOfMonth, cancellationToken);

            var salaries = await _unitOfWork.Employees.Query()
                .Select(e => e.Salary)
                .ToListAsync(cancellationToken);
            var averageSalary = salaries.Any() ? salaries.Average() : 0;

            // Department stats
            var departmentStats = await _unitOfWork.Departments.Query()
                .Include(d => d.Employees)
                .Where(d => d.IsActive)
                .Select(d => new DepartmentStatDto
                {
                    DepartmentName = d.Name,
                    EmployeeCount = d.Employees.Count
                })
                .OrderByDescending(d => d.EmployeeCount)
                .Take(10)
                .ToListAsync(cancellationToken);

            // Status stats
            var statusStats = await _unitOfWork.Employees.Query()
                .GroupBy(e => e.Status)
                .Select(g => new EmploymentStatusStatDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToListAsync(cancellationToken);

            var stats = new DashboardStatsDto
            {
                TotalEmployees = totalEmployees,
                ActiveEmployees = activeEmployees,
                TotalDepartments = totalDepartments,
                NewHiresThisMonth = newHiresThisMonth,
                AverageSalary = averageSalary,
                DepartmentStats = departmentStats,
                StatusStats = statusStats
            };

            return ApiResponse<DashboardStatsDto>.SuccessResponse(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats");
            return ApiResponse<DashboardStatsDto>.FailureResponse("An error occurred while fetching dashboard stats");
        }
    }
}
