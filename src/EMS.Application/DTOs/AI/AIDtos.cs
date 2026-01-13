namespace EMS.Application.DTOs.AI;

public class AISearchRequestDto
{
    public string Query { get; set; } = string.Empty;
}

public class AISearchResponseDto
{
    public string ProcessedQuery { get; set; } = string.Empty;
    public List<string> ExtractedFilters { get; set; } = new();
    public string Interpretation { get; set; } = string.Empty;
}

public class AISkillInsightRequestDto
{
    public Guid EmployeeId { get; set; }
}

public class AISkillInsightResponseDto
{
    public string Summary { get; set; } = string.Empty;
    public List<string> TopSkills { get; set; } = new();
    public List<string> RecommendedTraining { get; set; } = new();
    public string CareerPathSuggestion { get; set; } = string.Empty;
}

public class AIResumeSummaryRequestDto
{
    public string ResumeText { get; set; } = string.Empty;
}

public class AIResumeSummaryResponseDto
{
    public string Summary { get; set; } = string.Empty;
    public List<string> KeySkills { get; set; } = new();
    public int YearsOfExperience { get; set; }
    public List<string> Highlights { get; set; } = new();
}
