using EMS.Application.DTOs.Department;
using FluentValidation;

namespace EMS.Application.Validators;

public class CreateDepartmentValidator : AbstractValidator<CreateDepartmentDto>
{
    public CreateDepartmentValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required")
            .MaximumLength(100).WithMessage("Department name cannot exceed 100 characters");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Department code is required")
            .MaximumLength(20).WithMessage("Department code cannot exceed 20 characters")
            .Matches("^[A-Z0-9]+$").WithMessage("Department code must contain only uppercase letters and numbers");

        RuleFor(x => x.Description)
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description cannot exceed 500 characters");
    }
}

public class UpdateDepartmentValidator : AbstractValidator<UpdateDepartmentDto>
{
    public UpdateDepartmentValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Department name is required")
            .MaximumLength(100).WithMessage("Department name cannot exceed 100 characters");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Department code is required")
            .MaximumLength(20).WithMessage("Department code cannot exceed 20 characters")
            .Matches("^[A-Z0-9]+$").WithMessage("Department code must contain only uppercase letters and numbers");

        RuleFor(x => x.Description)
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description cannot exceed 500 characters");
    }
}
