import api from './api';
import {
  ApiResponse,
  Employee,
  EmployeeListItem,
  CreateEmployee,
  UpdateEmployee,
  PagedResult,
} from '../types';

interface GetEmployeesParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  searchTerm?: string;
  departmentId?: string;
  status?: string;
  role?: string;
  hireDateFrom?: string;
  hireDateTo?: string;
  minSalary?: number;
  maxSalary?: number;
}

export const employeeService = {
  async getAll(params: GetEmployeesParams = {}): Promise<ApiResponse<PagedResult<EmployeeListItem>>> {
    const response = await api.get<ApiResponse<PagedResult<EmployeeListItem>>>('/employees', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Employee>> {
    const response = await api.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data;
  },

  async create(data: CreateEmployee): Promise<ApiResponse<Employee>> {
    const response = await api.post<ApiResponse<Employee>>('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployee): Promise<ApiResponse<Employee>> {
    const response = await api.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/employees/${id}`);
    return response.data;
  },

  async getByDepartment(departmentId: string): Promise<ApiResponse<EmployeeListItem[]>> {
    const response = await api.get<ApiResponse<EmployeeListItem[]>>(
      `/employees/department/${departmentId}`
    );
    return response.data;
  },

  async getDirectReports(managerId: string): Promise<ApiResponse<EmployeeListItem[]>> {
    const response = await api.get<ApiResponse<EmployeeListItem[]>>(
      `/employees/${managerId}/direct-reports`
    );
    return response.data;
  },

  async search(term: string): Promise<ApiResponse<EmployeeListItem[]>> {
    const response = await api.get<ApiResponse<EmployeeListItem[]>>('/employees/search', {
      params: { term },
    });
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<Employee>> {
    const response = await api.put<ApiResponse<Employee>>(`/employees/${id}/status`, { status });
    return response.data;
  },
};
