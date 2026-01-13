using EMS.Domain.Enums;

namespace EMS.Application.DTOs.Employee;

public class EmployeeDto
{
    public Guid Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public decimal Salary { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Skills { get; set; }
    public string? ResumeUrl { get; set; }
    public string? ProfileImageUrl { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public Guid? ReportsToId { get; set; }
    public string? ReportsToName { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class EmployeeListDto
{
    public Guid Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public DateTime HireDate { get; set; }
}

public class CreateEmployeeDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }
    public Guid DepartmentId { get; set; }
    public string? Skills { get; set; }
    public Guid? ReportsToId { get; set; }
    public UserRole Role { get; set; } = UserRole.Employee;
}

public class UpdateEmployeeDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime DateOfBirth { get; set; }
    public decimal Salary { get; set; }
    public EmploymentStatus Status { get; set; }
    public Guid DepartmentId { get; set; }
    public string? Skills { get; set; }
    public Guid? ReportsToId { get; set; }
}

public class EmployeeFilterParams
{
    public Guid? DepartmentId { get; set; }
    public EmploymentStatus? Status { get; set; }
    public UserRole? Role { get; set; }
    public DateTime? HireDateFrom { get; set; }
    public DateTime? HireDateTo { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
}
