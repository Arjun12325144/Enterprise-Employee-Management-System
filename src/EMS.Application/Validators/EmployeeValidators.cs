using EMS.Application.DTOs.Employee;
using FluentValidation;

namespace EMS.Application.Validators;

public class CreateEmployeeValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name cannot exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters");

        RuleFor(x => x.Position)
            .NotEmpty().WithMessage("Position is required")
            .MaximumLength(100).WithMessage("Position cannot exceed 100 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^[\d\s\-\+\(\)]+$").When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Invalid phone number format");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required")
            .LessThan(DateTime.Today.AddYears(-18)).WithMessage("Employee must be at least 18 years old");

        RuleFor(x => x.HireDate)
            .NotEmpty().WithMessage("Hire date is required")
            .LessThanOrEqualTo(DateTime.Today.AddDays(30)).WithMessage("Hire date cannot be more than 30 days in the future");

        RuleFor(x => x.Salary)
            .GreaterThan(0).WithMessage("Salary must be greater than 0");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Invalid role");
    }
}

public class UpdateEmployeeValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name cannot exceed 100 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters");

        RuleFor(x => x.Position)
            .NotEmpty().WithMessage("Position is required")
            .MaximumLength(100).WithMessage("Position cannot exceed 100 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^[\d\s\-\+\(\)]+$").When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Invalid phone number format");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required")
            .LessThan(DateTime.Today.AddYears(-18)).WithMessage("Employee must be at least 18 years old");

        RuleFor(x => x.Salary)
            .GreaterThan(0).WithMessage("Salary must be greater than 0");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("Department is required");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid status");
    }
}
