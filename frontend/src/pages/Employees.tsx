import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Filter, Sparkles, X, User, Users, Briefcase, Building2, Calendar } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { aiService } from '../services/aiService';
import { EmployeeListItem, DepartmentListItem, PagedResult } from '../types';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const canManage = user?.role === 'Admin' || user?.role === 'Manager';

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const searchTerm = searchParams.get('search') || '';
  const departmentFilter = searchParams.get('department') || '';
  const statusFilter = searchParams.get('status') || '';

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await employeeService.getAll({
        pageNumber: page,
        pageSize,
        searchTerm: searchTerm || undefined,
        departmentId: departmentFilter || undefined,
        status: statusFilter || undefined,
      });

      if (response.success && response.data) {
        const data = response.data as PagedResult<EmployeeListItem>;
        setEmployees(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setAiSearchActive(false);
        setAiInterpretation('');
      }
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, departmentFilter, statusFilter]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllActive();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Failed to load departments');
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, [loadEmployees]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    setSearchParams((prev: URLSearchParams) => {
      if (search) {
        prev.set('search', search);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handleAISearch = async () => {
    if (!searchTerm) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiService.smartSearch(searchTerm);
      if (response.success && response.data) {
        setEmployees(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
        setAiSearchActive(true);
        setAiInterpretation(response.message);
        toast.success('AI search completed');
      } else {
        toast.error('AI search failed');
      }
    } catch (error) {
      toast.error('AI search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev: URLSearchParams) => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const response = await employeeService.delete(deleteId);
      if (response.success) {
        toast.success('Employee deleted successfully');
        loadEmployees();
      } else {
        toast.error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const hasActiveFilters = searchTerm || departmentFilter || statusFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Employees</h1>
            <p className="text-secondary-500">Manage your organization's workforce</p>
          </div>
        </div>
        {canManage && (
          <Link to="/employees/new" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            Add Employee
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-secondary-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                name="search"
                defaultValue={searchTerm}
                placeholder="Search employees by name, email, position..."
                className="w-full pl-12 pr-32 py-3.5 bg-secondary-50/80 border border-secondary-200/50 rounded-xl text-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleAISearch}
                  className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center gap-1.5 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  title="AI-powered natural language search"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Search
                </button>
              </div>
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} gap-2`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* AI Search Interpretation */}
        {aiSearchActive && aiInterpretation && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-800">AI Search Active</p>
              <p className="text-sm text-purple-600 mt-0.5">{aiInterpretation}</p>
            </div>
            <button
              onClick={loadEmployees}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="input"
              >
                <option value="">All Departments</option>
                {departments.map((dept: { id: string; name: string }) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="OnLeave">On Leave</option>
                <option value="Probation">Probation</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="btn btn-secondary w-full">
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-secondary-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" text="Loading employees..." />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-secondary-500">
            <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-secondary-400" />
            </div>
            <p className="text-lg font-semibold text-secondary-700">No employees found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Employee</th>
                    <th className="table-header">Position</th>
                    <th className="table-header">Department</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Hire Date</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {employees.map((employee: EmployeeListItem, index: number) => (
                    <tr 
                      key={employee.id} 
                      className="hover:bg-secondary-50/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-md">
                            {employee.profileImageUrl ? (
                              <img
                                src={employee.profileImageUrl}
                                alt={employee.fullName}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">
                                {employee.fullName
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/employees/${employee.id}`}
                              className="font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                            >
                              {employee.fullName}
                            </Link>
                            <p className="text-sm text-secondary-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Briefcase className="w-4 h-4 text-secondary-400" />
                          {employee.position}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Building2 className="w-4 h-4 text-secondary-400" />
                          {employee.departmentName}
                        </div>
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={employee.status} size="sm" />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Calendar className="w-4 h-4 text-secondary-400" />
                          {new Date(employee.hireDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/employees/${employee.id}`}
                            className="px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            View
                          </Link>
                          {canManage && (
                            <>
                              <Link
                                to={`/employees/${employee.id}/edit`}
                                className="px-3 py-1.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                              >
                                Edit
                              </Link>
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => setDeleteId(employee.id)}
                                  className="px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!aiSearchActive && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalCount={totalCount}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
