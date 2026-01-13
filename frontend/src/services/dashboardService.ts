import api from './api';
import { ApiResponse, DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },
};
