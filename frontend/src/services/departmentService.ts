import api from './api';
import {
  ApiResponse,
  Department,
  DepartmentListItem,
  CreateDepartment,
  UpdateDepartment,
  PagedResult,
} from '../types';

interface GetDepartmentsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  searchTerm?: string;
}

export const departmentService = {
  async getAll(params: GetDepartmentsParams = {}): Promise<ApiResponse<PagedResult<DepartmentListItem>>> {
    const response = await api.get<ApiResponse<PagedResult<DepartmentListItem>>>('/departments', {
      params,
    });
    return response.data;
  },

  async getAllActive(): Promise<ApiResponse<DepartmentListItem[]>> {
    const response = await api.get<ApiResponse<DepartmentListItem[]>>('/departments/active');
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Department>> {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data;
  },

  async create(data: CreateDepartment): Promise<ApiResponse<Department>> {
    const response = await api.post<ApiResponse<Department>>('/departments', data);
    return response.data;
  },

  async update(id: string, data: UpdateDepartment): Promise<ApiResponse<Department>> {
    const response = await api.put<ApiResponse<Department>>(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/departments/${id}`);
    return response.data;
  },
};
