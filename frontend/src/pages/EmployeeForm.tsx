import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { DepartmentListItem, EmployeeListItem } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  position: string;
  phone?: string;
  address?: string;
  dateOfBirth: string;
  hireDate: string;
  salary: number;
  status?: number;
  departmentId: string;
  skills?: string;
  reportsToId?: string;
  role: number;
}

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [managers, setManagers] = useState<EmployeeListItem[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      role: 1,
      status: 1,
    },
  });

  useEffect(() => {
    loadDepartments();
    loadManagers();
    if (isEditMode && id) {
      loadEmployee();
    }
  }, [id]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllActive();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const loadManagers = async () => {
    try {
      const response = await employeeService.getAll({ pageSize: 100, role: 'Manager' });
      if (response.success && response.data) {
        setManagers(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load managers');
    }
  };

  const loadEmployee = async () => {
    try {
      const response = await employeeService.getById(id!);
      if (response.success && response.data) {
        const emp = response.data;
        reset({
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          position: emp.position,
          phone: emp.phone || '',
          address: emp.address || '',
          dateOfBirth: emp.dateOfBirth.split('T')[0],
          hireDate: emp.hireDate.split('T')[0],
          salary: emp.salary,
          status: getStatusValue(emp.status),
          departmentId: emp.departmentId,
          skills: emp.skills || '',
          reportsToId: emp.reportsToId || '',
          role: getRoleValue(emp.role),
        });
      } else {
        toast.error('Employee not found');
        navigate('/employees');
      }
    } catch (error) {
      toast.error('Failed to load employee');
      navigate('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusValue = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      Active: 1,
      OnLeave: 2,
      Terminated: 3,
      Probation: 4,
    };
    return statusMap[status] || 1;
  };

  const getRoleValue = (role: string): number => {
    const roleMap: { [key: string]: number } = {
      Employee: 1,
      Manager: 2,
      Admin: 3,
    };
    return roleMap[role] || 1;
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const response = await employeeService.update(id!, {
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          phone: data.phone || undefined,
          address: data.address || undefined,
          dateOfBirth: data.dateOfBirth,
          salary: Number(data.salary),
          status: Number(data.status) || 1,
          departmentId: data.departmentId,
          skills: data.skills || undefined,
          reportsToId: data.reportsToId || undefined,
        });

        if (response.success) {
          toast.success('Employee updated successfully');
          navigate(`/employees/${id}`);
        } else {
          toast.error(response.message || 'Failed to update employee');
        }
      } else {
        const response = await employeeService.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password!,
          position: data.position,
          phone: data.phone || undefined,
          address: data.address || undefined,
          dateOfBirth: data.dateOfBirth,
          hireDate: data.hireDate,
          salary: Number(data.salary),
          departmentId: data.departmentId,
          skills: data.skills || undefined,
          reportsToId: data.reportsToId || undefined,
          role: Number(data.role),
        });

        if (response.success && response.data) {
          toast.success('Employee created successfully');
          navigate(`/employees/${response.data.id}`);
        } else {
          toast.error(response.message || 'Failed to create employee');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/employees"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </h1>
        <p className="text-secondary-500 mt-1">
          {isEditMode
            ? 'Update employee information'
            : 'Fill in the details to add a new employee'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                disabled={isEditMode}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            {!isEditMode && (
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className={`input ${errors.password ? 'border-red-500' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input
                type="date"
                className={`input ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input type="text" className="input" {...register('address')} />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Employment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Position *</label>
              <input
                type="text"
                className={`input ${errors.position ? 'border-red-500' : ''}`}
                {...register('position', { required: 'Position is required' })}
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
              )}
            </div>
            <div>
              <label className="label">Department *</label>
              <select
                className={`input ${errors.departmentId ? 'border-red-500' : ''}`}
                {...register('departmentId', { required: 'Department is required' })}
              >
                <option value="">Select Department</option>
                {departments.map((dept: DepartmentListItem) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
              )}
            </div>
            {!isEditMode && (
              <div>
                <label className="label">Hire Date *</label>
                <input
                  type="date"
                  className={`input ${errors.hireDate ? 'border-red-500' : ''}`}
                  {...register('hireDate', { required: 'Hire date is required' })}
                />
                {errors.hireDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hireDate.message}</p>
                )}
              </div>
            )}
            <div>
              <label className="label">Salary *</label>
              <input
                type="number"
                step="0.01"
                className={`input ${errors.salary ? 'border-red-500' : ''}`}
                {...register('salary', {
                  required: 'Salary is required',
                  min: { value: 0, message: 'Salary must be positive' },
                  valueAsNumber: true,
                })}
              />
              {errors.salary && (
                <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
              )}
            </div>
            {isEditMode && (
              <div>
                <label className="label">Status</label>
                <select className="input" {...register('status', { valueAsNumber: true })}>
                  <option value={1}>Active</option>
                  <option value={2}>On Leave</option>
                  <option value={3}>Terminated</option>
                  <option value={4}>Probation</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Role *</label>
              <select
                className={`input ${errors.role ? 'border-red-500' : ''}`}
                {...register('role', { required: 'Role is required', valueAsNumber: true })}
              >
                <option value={1}>Employee</option>
                <option value={2}>Manager</option>
                <option value={3}>Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Reports To</label>
              <select className="input" {...register('reportsToId')}>
                <option value="">None</option>
                {managers.map((manager: EmployeeListItem) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Skills (comma-separated)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., JavaScript, React, Node.js"
                {...register('skills')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link to="/employees" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              <>{isEditMode ? 'Update Employee' : 'Create Employee'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
