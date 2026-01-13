using EMS.Application.Common;
using EMS.Application.DTOs.Employee;
using EMS.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IValidator<CreateEmployeeDto> _createValidator;
    private readonly IValidator<UpdateEmployeeDto> _updateValidator;

    public EmployeesController(
        IEmployeeService employeeService,
        IValidator<CreateEmployeeDto> createValidator,
        IValidator<UpdateEmployeeDto> updateValidator)
    {
        _employeeService = employeeService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<EmployeeListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? role = null,
        [FromQuery] DateTime? hireDateFrom = null,
        [FromQuery] DateTime? hireDateTo = null,
        [FromQuery] decimal? minSalary = null,
        [FromQuery] decimal? maxSalary = null,
        CancellationToken cancellationToken = default)
    {
        var pagination = new PaginationParams
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SortBy = sortBy,
            SortDescending = sortDescending,
            SearchTerm = searchTerm
        };

        var filters = new EmployeeFilterParams
        {
            DepartmentId = departmentId,
            Status = !string.IsNullOrEmpty(status) && Enum.TryParse<Domain.Enums.EmploymentStatus>(status, true, out var s) ? s : null,
            Role = !string.IsNullOrEmpty(role) && Enum.TryParse<Domain.Enums.UserRole>(role, true, out var r) ? r : null,
            HireDateFrom = hireDateFrom,
            HireDateTo = hireDateTo,
            MinSalary = minSalary,
            MaxSalary = maxSalary
        };

        var result = await _employeeService.GetAllAsync(pagination, filters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetByIdAsync(id, cancellationToken);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(ApiResponse<EmployeeDto>.FailureResponse(
                "Validation failed",
                validationResult.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var result = await _employeeService.CreateAsync(dto, cancellationToken);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return BadRequest(ApiResponse<EmployeeDto>.FailureResponse(
                "Validation failed",
                validationResult.Errors.Select(e => e.ErrorMessage).ToList()));
        }

        var result = await _employeeService.UpdateAsync(id, dto, cancellationToken);
        
        if (!result.Success)
        {
            return result.Message.Contains("not found") ? NotFound(result) : BadRequest(result);
        }

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _employeeService.DeleteAsync(id, cancellationToken);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    [HttpGet("department/{departmentId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDepartment(Guid departmentId, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetByDepartmentAsync(departmentId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{managerId:guid}/direct-reports")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDirectReports(Guid managerId, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetDirectReportsAsync(managerId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string term, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return BadRequest(ApiResponse<List<EmployeeListDto>>.FailureResponse("Search term is required"));
        }

        var result = await _employeeService.SearchAsync(term, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = "ManagerOrAdmin")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<Domain.Enums.EmploymentStatus>(dto.Status, true, out var status))
        {
            return BadRequest(ApiResponse<EmployeeDto>.FailureResponse("Invalid status value"));
        }

        var result = await _employeeService.UpdateStatusAsync(id, status, cancellationToken);
        
        if (!result.Success)
        {
            return result.Message.Contains("not found") ? NotFound(result) : BadRequest(result);
        }

        return Ok(result);
    }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
}
