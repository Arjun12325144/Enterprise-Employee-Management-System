using EMS.Application.Common;
using EMS.Application.DTOs.AI;
using EMS.Application.DTOs.Employee;

namespace EMS.Application.Interfaces;

public interface IAIService
{
    Task<ApiResponse<AISearchResponseDto>> ProcessNaturalLanguageSearchAsync(AISearchRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<EmployeeListDto>>> SmartSearchEmployeesAsync(string naturalLanguageQuery, CancellationToken cancellationToken = default);
    Task<ApiResponse<AISkillInsightResponseDto>> GetEmployeeSkillInsightsAsync(AISkillInsightRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AIResumeSummaryResponseDto>> SummarizeResumeAsync(AIResumeSummaryRequestDto request, CancellationToken cancellationToken = default);
}
