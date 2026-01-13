using System.Text;
using System.Text.Json;
using EMS.Application.Common;
using EMS.Application.DTOs.AI;
using EMS.Application.DTOs.Employee;
using EMS.Application.Interfaces;
using EMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EMS.Infrastructure.Services;

public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIService> _logger;

    public AIService(
        HttpClient httpClient,
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<AIService> logger)
    {
        _httpClient = httpClient;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ApiResponse<AISearchResponseDto>> ProcessNaturalLanguageSearchAsync(
        AISearchRequestDto request, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Parse natural language query to extract filters
            var parsedQuery = ParseNaturalLanguageQuery(request.Query);
            
            return ApiResponse<AISearchResponseDto>.SuccessResponse(parsedQuery);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing natural language search");
            return ApiResponse<AISearchResponseDto>.FailureResponse("Failed to process search query");
        }
    }

    public async Task<ApiResponse<List<EmployeeListDto>>> SmartSearchEmployeesAsync(
        string naturalLanguageQuery, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parsedQuery = ParseNaturalLanguageQuery(naturalLanguageQuery);
            
            var query = _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .AsQueryable();

            // Apply extracted filters from natural language
            foreach (var filter in parsedQuery.ExtractedFilters)
            {
                query = ApplyFilter(query, filter);
            }

            // If no specific filters, do a general search
            if (!parsedQuery.ExtractedFilters.Any())
            {
                var searchTerm = naturalLanguageQuery.ToLower();
                query = query.Where(e =>
                    e.User.FirstName.ToLower().Contains(searchTerm) ||
                    e.User.LastName.ToLower().Contains(searchTerm) ||
                    e.Position.ToLower().Contains(searchTerm) ||
                    e.Department.Name.ToLower().Contains(searchTerm) ||
                    (e.Skills != null && e.Skills.ToLower().Contains(searchTerm)));
            }

            var employees = await query.Take(50).ToListAsync(cancellationToken);

            var results = employees.Select(e => new EmployeeListDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeCode,
                FullName = e.User.FullName,
                Email = e.User.Email,
                Position = e.Position,
                DepartmentName = e.Department.Name,
                Status = e.Status.ToString(),
                ProfileImageUrl = e.ProfileImageUrl,
                HireDate = e.HireDate
            }).ToList();

            return ApiResponse<List<EmployeeListDto>>.SuccessResponse(results, parsedQuery.Interpretation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in smart search");
            return ApiResponse<List<EmployeeListDto>>.FailureResponse("An error occurred during smart search");
        }
    }

    public async Task<ApiResponse<AISkillInsightResponseDto>> GetEmployeeSkillInsightsAsync(
        AISkillInsightRequestDto request, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var employee = await _unitOfWork.Employees.Query()
                .Include(e => e.User)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, cancellationToken);

            if (employee == null)
            {
                return ApiResponse<AISkillInsightResponseDto>.FailureResponse("Employee not found");
            }

            // Generate AI insights (simulated - in production, call external AI API)
            var insights = GenerateSkillInsights(employee);
            
            return ApiResponse<AISkillInsightResponseDto>.SuccessResponse(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting skill insights for employee: {EmployeeId}", request.EmployeeId);
            return ApiResponse<AISkillInsightResponseDto>.FailureResponse("Failed to generate skill insights");
        }
    }

    public async Task<ApiResponse<AIResumeSummaryResponseDto>> SummarizeResumeAsync(
        AIResumeSummaryRequestDto request, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Call external AI API or use local processing
            var aiApiUrl = _configuration["AISettings:ApiUrl"];
            var apiKey = _configuration["AISettings:ApiKey"];

            if (!string.IsNullOrEmpty(aiApiUrl) && !string.IsNullOrEmpty(apiKey))
            {
                // Call external AI service
                var response = await CallExternalAIForResumeSummary(request.ResumeText, aiApiUrl, apiKey, cancellationToken);
                if (response != null)
                {
                    return ApiResponse<AIResumeSummaryResponseDto>.SuccessResponse(response);
                }
            }

            // Fallback to local processing
            var summary = GenerateLocalResumeSummary(request.ResumeText);
            return ApiResponse<AIResumeSummaryResponseDto>.SuccessResponse(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error summarizing resume");
            return ApiResponse<AIResumeSummaryResponseDto>.FailureResponse("Failed to summarize resume");
        }
    }

    private AISearchResponseDto ParseNaturalLanguageQuery(string query)
    {
        var filters = new List<string>();
        var interpretation = new StringBuilder("Searching for employees");
        var normalizedQuery = query.ToLower();

        // Department detection
        var departments = new[] { "it", "hr", "finance", "engineering", "sales", "marketing", "operations" };
        foreach (var dept in departments)
        {
            if (normalizedQuery.Contains(dept))
            {
                filters.Add($"department:{dept}");
                interpretation.Append($" in {dept.ToUpper()} department");
            }
        }

        // Status detection
        if (normalizedQuery.Contains("active"))
        {
            filters.Add("status:active");
            interpretation.Append(" with active status");
        }
        else if (normalizedQuery.Contains("on leave") || normalizedQuery.Contains("leave"))
        {
            filters.Add("status:onleave");
            interpretation.Append(" who are on leave");
        }
        else if (normalizedQuery.Contains("probation"))
        {
            filters.Add("status:probation");
            interpretation.Append(" in probation period");
        }

        // Role detection
        if (normalizedQuery.Contains("manager"))
        {
            filters.Add("role:manager");
            interpretation.Append(" who are managers");
        }
        else if (normalizedQuery.Contains("admin"))
        {
            filters.Add("role:admin");
            interpretation.Append(" who are admins");
        }

        // Skills detection
        var techSkills = new[] { "c#", ".net", "react", "angular", "java", "python", "sql", "azure", "aws" };
        foreach (var skill in techSkills)
        {
            if (normalizedQuery.Contains(skill))
            {
                filters.Add($"skill:{skill}");
                interpretation.Append($" with {skill.ToUpper()} skills");
            }
        }

        // New hires detection
        if (normalizedQuery.Contains("new hire") || normalizedQuery.Contains("recent") || normalizedQuery.Contains("joined"))
        {
            filters.Add("hiredate:recent");
            interpretation.Append(" who joined recently");
        }

        // Experience detection
        if (normalizedQuery.Contains("senior") || normalizedQuery.Contains("experienced"))
        {
            filters.Add("experience:senior");
            interpretation.Append(" with senior experience");
        }
        else if (normalizedQuery.Contains("junior") || normalizedQuery.Contains("entry"))
        {
            filters.Add("experience:junior");
            interpretation.Append(" at entry level");
        }

        return new AISearchResponseDto
        {
            ProcessedQuery = normalizedQuery,
            ExtractedFilters = filters,
            Interpretation = interpretation.ToString()
        };
    }

    private IQueryable<Domain.Entities.Employee> ApplyFilter(
        IQueryable<Domain.Entities.Employee> query, 
        string filter)
    {
        var parts = filter.Split(':');
        if (parts.Length != 2) return query;

        var filterType = parts[0].ToLower();
        var filterValue = parts[1].ToLower();

        return filterType switch
        {
            "department" => query.Where(e => e.Department.Name.ToLower().Contains(filterValue) || 
                                             e.Department.Code.ToLower().Contains(filterValue)),
            "status" => filterValue switch
            {
                "active" => query.Where(e => e.Status == EmploymentStatus.Active),
                "onleave" => query.Where(e => e.Status == EmploymentStatus.OnLeave),
                "probation" => query.Where(e => e.Status == EmploymentStatus.Probation),
                "terminated" => query.Where(e => e.Status == EmploymentStatus.Terminated),
                _ => query
            },
            "role" => filterValue switch
            {
                "manager" => query.Where(e => e.User.Role == UserRole.Manager),
                "admin" => query.Where(e => e.User.Role == UserRole.Admin),
                "employee" => query.Where(e => e.User.Role == UserRole.Employee),
                _ => query
            },
            "skill" => query.Where(e => e.Skills != null && e.Skills.ToLower().Contains(filterValue)),
            "hiredate" when filterValue == "recent" => 
                query.Where(e => e.HireDate >= DateTime.UtcNow.AddMonths(-3)),
            "experience" when filterValue == "senior" => 
                query.Where(e => e.HireDate <= DateTime.UtcNow.AddYears(-5)),
            "experience" when filterValue == "junior" => 
                query.Where(e => e.HireDate >= DateTime.UtcNow.AddYears(-2)),
            _ => query
        };
    }

    private AISkillInsightResponseDto GenerateSkillInsights(Domain.Entities.Employee employee)
    {
        var skills = employee.Skills?.Split(',').Select(s => s.Trim()).ToList() ?? new List<string>();
        var yearsAtCompany = (DateTime.UtcNow - employee.HireDate).Days / 365;

        var recommendedTraining = new List<string>();
        var careerPath = "";

        // Generate insights based on current skills and position
        if (skills.Any(s => s.Contains("C#", StringComparison.OrdinalIgnoreCase)))
        {
            recommendedTraining.Add("Advanced .NET Architecture");
            recommendedTraining.Add("Microservices with .NET");
        }

        if (skills.Any(s => s.Contains("React", StringComparison.OrdinalIgnoreCase)))
        {
            recommendedTraining.Add("Advanced React Patterns");
            recommendedTraining.Add("React Performance Optimization");
        }

        if (employee.Position.Contains("Developer", StringComparison.OrdinalIgnoreCase))
        {
            careerPath = yearsAtCompany >= 3 
                ? "Consider transitioning to Senior Developer or Technical Lead role"
                : "Focus on deepening technical expertise and take on mentorship opportunities";
        }
        else if (employee.Position.Contains("Manager", StringComparison.OrdinalIgnoreCase))
        {
            careerPath = "Progress towards Director or VP of Engineering track";
            recommendedTraining.Add("Executive Leadership Program");
        }

        return new AISkillInsightResponseDto
        {
            Summary = $"{employee.User.FullName} has {yearsAtCompany} years at the company with expertise in {string.Join(", ", skills.Take(3))}.",
            TopSkills = skills.Take(5).ToList(),
            RecommendedTraining = recommendedTraining,
            CareerPathSuggestion = careerPath
        };
    }

    private async Task<AIResumeSummaryResponseDto?> CallExternalAIForResumeSummary(
        string resumeText, 
        string apiUrl, 
        string apiKey, 
        CancellationToken cancellationToken)
    {
        try
        {
            var request = new
            {
                prompt = $"Summarize this resume and extract key skills:\n\n{resumeText}",
                max_tokens = 500
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync(apiUrl, content, cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                // Parse AI response and map to DTO
                return JsonSerializer.Deserialize<AIResumeSummaryResponseDto>(responseContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "External AI API call failed, falling back to local processing");
        }

        return null;
    }

    private AIResumeSummaryResponseDto GenerateLocalResumeSummary(string resumeText)
    {
        var words = resumeText.ToLower().Split(new[] { ' ', '\n', '\r', ',', '.', ';' }, 
            StringSplitOptions.RemoveEmptyEntries);
        
        var techKeywords = new[] { "c#", ".net", "react", "angular", "java", "python", "sql", 
            "azure", "aws", "docker", "kubernetes", "agile", "scrum", "javascript", "typescript" };
        
        var detectedSkills = techKeywords
            .Where(k => words.Any(w => w.Contains(k)))
            .Select(k => k.ToUpper())
            .ToList();

        // Estimate years of experience from numbers in the text
        var yearsMatch = System.Text.RegularExpressions.Regex.Match(resumeText, @"(\d+)\+?\s*years?");
        var years = yearsMatch.Success ? int.Parse(yearsMatch.Groups[1].Value) : 0;

        return new AIResumeSummaryResponseDto
        {
            Summary = $"Professional with {years}+ years of experience in software development.",
            KeySkills = detectedSkills,
            YearsOfExperience = years,
            Highlights = new List<string>
            {
                "Experienced software professional",
                $"Skilled in {string.Join(", ", detectedSkills.Take(3))}"
            }
        };
    }
}
