using EMS.Application.Common;
using EMS.Application.DTOs.AI;
using EMS.Application.DTOs.Employee;
using EMS.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AIController : ControllerBase
{
    private readonly IAIService _aiService;

    public AIController(IAIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("search")]
    [ProducesResponseType(typeof(ApiResponse<List<EmployeeListDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SmartSearch([FromBody] AISearchRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
        {
            return BadRequest(ApiResponse<List<EmployeeListDto>>.FailureResponse("Search query is required"));
        }

        var result = await _aiService.SmartSearchEmployeesAsync(request.Query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("parse-query")]
    [ProducesResponseType(typeof(ApiResponse<AISearchResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ParseQuery([FromBody] AISearchRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _aiService.ProcessNaturalLanguageSearchAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("skill-insights")]
    [ProducesResponseType(typeof(ApiResponse<AISkillInsightResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSkillInsights([FromBody] AISkillInsightRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _aiService.GetEmployeeSkillInsightsAsync(request, cancellationToken);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    [HttpPost("summarize-resume")]
    [ProducesResponseType(typeof(ApiResponse<AIResumeSummaryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SummarizeResume([FromBody] AIResumeSummaryRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ResumeText))
        {
            return BadRequest(ApiResponse<AIResumeSummaryResponseDto>.FailureResponse("Resume text is required"));
        }

        var result = await _aiService.SummarizeResumeAsync(request, cancellationToken);
        return Ok(result);
    }
}
