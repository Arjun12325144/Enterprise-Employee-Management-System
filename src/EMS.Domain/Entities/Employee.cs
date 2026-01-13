using EMS.Domain.Enums;

namespace EMS.Domain.Entities;

public class Employee : BaseEntity
{
    public string EmployeeCode { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid DepartmentId { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public decimal Salary { get; set; }
    public EmploymentStatus Status { get; set; } = EmploymentStatus.Active;
    public string? Skills { get; set; }
    public string? ResumeUrl { get; set; }
    public string? ProfileImageUrl { get; set; }
    public Guid? ReportsToId { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public Employee? ReportsTo { get; set; }
    public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
}
