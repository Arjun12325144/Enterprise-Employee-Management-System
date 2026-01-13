import api from './api';
import { ApiResponse, EmployeeListItem, AISearchResult, SkillInsight } from '../types';

export const aiService = {
  async smartSearch(query: string): Promise<ApiResponse<EmployeeListItem[]>> {
    const response = await api.post<ApiResponse<EmployeeListItem[]>>('/ai/search', { query });
    return response.data;
  },

  async parseQuery(query: string): Promise<ApiResponse<AISearchResult>> {
    const response = await api.post<ApiResponse<AISearchResult>>('/ai/parse-query', { query });
    return response.data;
  },

  async getSkillInsights(employeeId: string): Promise<ApiResponse<SkillInsight>> {
    const response = await api.post<ApiResponse<SkillInsight>>('/ai/skill-insights', {
      employeeId,
    });
    return response.data;
  },

  async summarizeResume(resumeText: string): Promise<ApiResponse<{
    summary: string;
    keySkills: string[];
    yearsOfExperience: number;
    highlights: string[];
  }>> {
    const response = await api.post('/ai/summarize-resume', { resumeText });
    return response.data;
  },
};
