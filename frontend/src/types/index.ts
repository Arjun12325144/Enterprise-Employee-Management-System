export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Employee';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  position: string;
  phone?: string;
  address?: string;
  dateOfBirth: string;
  hireDate: string;
  terminationDate?: string;
  salary: number;
  status: 'Active' | 'OnLeave' | 'Terminated' | 'Probation';
  skills?: string;
  resumeUrl?: string;
  profileImageUrl?: string;
  departmentId: string;
  departmentName: string;
  reportsToId?: string;
  reportsToName?: string;
  role: string;
  createdAt: string;
}

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  position: string;
  departmentName: string;
  status: string;
  profileImageUrl?: string;
  hireDate: string;
}

export interface CreateEmployee {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
  phone?: string;
  address?: string;
  dateOfBirth: string;
  hireDate: string;
  salary: number;
  departmentId: string;
  skills?: string;
  reportsToId?: string;
  role: number;
}

export interface UpdateEmployee {
  firstName: string;
  lastName: string;
  position: string;
  phone?: string;
  address?: string;
  dateOfBirth: string;
  salary: number;
  status: number;
  departmentId: string;
  skills?: string;
  reportsToId?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  budget?: number;
  headId?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface DepartmentListItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
  managerName?: string;
  employeeCount: number;
  isActive: boolean;
}

export interface DepartmentDetails {
  id: string;
  name: string;
  code?: string;
  description?: string;
  budget?: number;
  headId?: string;
  headName?: string;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDepartment {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartment {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  newHiresThisMonth: number;
  averageSalary: number;
  departmentStats: { departmentName: string; employeeCount: number }[];
  statusStats: { status: string; count: number }[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
}

export interface AISearchResult {
  processedQuery: string;
  extractedFilters: string[];
  interpretation: string;
}

export interface SkillInsight {
  summary: string;
  topSkills: string[];
  recommendedTraining: string[];
  careerPathSuggestion: string;
}

// Notification Types
export type NotificationType = 'Info' | 'Warning' | 'Success' | 'Error' | 'Announcement' | 'StatusChange';
export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  createdById: string;
  createdByName: string;
  targetUserId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateNotification {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetUserId?: string;
  expiresAt?: string;
}

export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  recentNotifications: Notification[];
}
