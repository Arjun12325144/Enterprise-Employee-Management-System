namespace EMS.Application.DTOs.Dashboard;

public class DashboardStatsDto
{
    public int TotalEmployees { get; set; }
    public int ActiveEmployees { get; set; }
    public int TotalDepartments { get; set; }
    public int NewHiresThisMonth { get; set; }
    public decimal AverageSalary { get; set; }
    public List<DepartmentStatDto> DepartmentStats { get; set; } = new();
    public List<EmploymentStatusStatDto> StatusStats { get; set; } = new();
}

public class DepartmentStatDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public int EmployeeCount { get; set; }
}

public class EmploymentStatusStatDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}
