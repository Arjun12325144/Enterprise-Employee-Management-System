import api from './api';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>('/auth/change-password', data);
    return response.data;
  },
};
