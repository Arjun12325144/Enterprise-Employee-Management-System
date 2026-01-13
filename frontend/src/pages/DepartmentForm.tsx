import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { employeeService } from '../services/employeeService';
import { EmployeeListItem } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
}

export default function DepartmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<EmployeeListItem[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>();

  useEffect(() => {
    loadManagers();
    if (isEditMode && id) {
      loadDepartment();
    }
  }, [id]);

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

  const loadDepartment = async () => {
    try {
      const response = await departmentService.getById(id!);
      if (response.success && response.data) {
        const dept = response.data;
        reset({
          name: dept.name,
          code: dept.code || '',
          description: dept.description || '',
          managerId: dept.managerId || '',
        });
      } else {
        toast.error('Department not found');
        navigate('/departments');
      }
    } catch (error) {
      toast.error('Failed to load department');
      navigate('/departments');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        code: data.code,
        description: data.description,
        managerId: data.managerId || undefined,
      };

      if (isEditMode) {
        const response = await departmentService.update(id!, payload);
        if (response.success) {
          toast.success('Department updated successfully');
          navigate('/departments');
        } else {
          toast.error(response.message || 'Failed to update department');
        }
      } else {
        const response = await departmentService.create(payload);
        if (response.success) {
          toast.success('Department created successfully');
          navigate('/departments');
        } else {
          toast.error(response.message || 'Failed to create department');
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
        to="/departments"
        className="inline-flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Departments
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Department' : 'Add New Department'}
        </h1>
        <p className="text-secondary-500 mt-1">
          {isEditMode
            ? 'Update department information'
            : 'Fill in the details to create a new department'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="card p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="label">Department Name *</label>
            <input
              type="text"
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Engineering"
              {...register('name', {
                required: 'Department name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="label">Department Code *</label>
            <input
              type="text"
              className={`input ${errors.code ? 'border-red-500' : ''}`}
              placeholder="e.g., ENG, HR, FIN"
              {...register('code', {
                required: 'Department code is required',
                minLength: {
                  value: 2,
                  message: 'Code must be at least 2 characters',
                },
                maxLength: {
                  value: 10,
                  message: 'Code must be at most 10 characters',
                },
              })}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
            <p className="mt-1 text-sm text-secondary-500">
              A short unique code for the department (e.g., ENG, HR, FIN)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Brief description of the department..."
              {...register('description')}
            />
          </div>

          {/* Department Manager */}
          <div>
            <label className="label">Department Manager</label>
            <select className="input" {...register('managerId')}>
              <option value="">Select Manager</option>
              {managers.map((manager: EmployeeListItem) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName} - {manager.position}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-secondary-500">
              Only managers can be assigned as department heads
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Link to="/departments" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <>{isEditMode ? 'Update Department' : 'Create Department'}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
