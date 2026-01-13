import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  User,
  Edit,
  Trash2,
  Sparkles,
  Award,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { aiService } from '../services/aiService';
import { Employee, SkillInsight } from '../types';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = user?.role === 'Admin' || user?.role === 'Manager';
  const canDelete = user?.role === 'Admin';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<SkillInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    setIsLoading(true);
    try {
      const response = await employeeService.getById(id!);
      if (response.success && response.data) {
        setEmployee(response.data);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await employeeService.delete(id!);
      if (response.success) {
        toast.success('Employee deleted successfully');
        navigate('/employees');
      } else {
        toast.error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const loadSkillInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await aiService.getSkillInsights(id!);
      if (response.success && response.data) {
        setInsights(response.data);
        setShowInsights(true);
      } else {
        toast.error('Failed to load skill insights');
      }
    } catch (error) {
      toast.error('Failed to load skill insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await employeeService.updateStatus(id!, newStatus);
      if (response.success && response.data) {
        setEmployee(response.data);
        toast.success(`Employee status updated to ${newStatus}`);
        setShowStatusModal(false);
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update employee status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return null;
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

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              {employee.profileImageUrl ? (
                <img
                  src={employee.profileImageUrl}
                  alt={employee.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {employee.fullName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">{employee.fullName}</h1>
              <p className="text-secondary-600">{employee.position}</p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={employee.status} />
                <span className="text-sm text-secondary-500">{employee.employeeCode}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadSkillInsights}
              disabled={loadingInsights}
              className="btn btn-secondary gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loadingInsights ? 'Loading...' : 'AI Insights'}
            </button>
            {canManage && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="btn btn-secondary gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Change Status
              </button>
            )}
            {canManage && (
              <Link to={`/employees/${id}/edit`} className="btn btn-primary gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="btn btn-danger gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Email</p>
                <p className="font-medium text-secondary-900">{employee.email}</p>
              </div>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Phone</p>
                  <p className="font-medium text-secondary-900">{employee.phone}</p>
                </div>
              </div>
            )}
            {employee.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Address</p>
                  <p className="font-medium text-secondary-900">{employee.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employment Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Employment Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Department</p>
                <p className="font-medium text-secondary-900">{employee.departmentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Hire Date</p>
                <p className="font-medium text-secondary-900">{formatDate(employee.hireDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Salary</p>
                <p className="font-medium text-secondary-900">{formatCurrency(employee.salary)}</p>
              </div>
            </div>
            {employee.reportsToName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Reports To</p>
                  <p className="font-medium text-secondary-900">{employee.reportsToName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Date of Birth</p>
                <p className="font-medium text-secondary-900">{formatDate(employee.dateOfBirth)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Role</p>
                <p className="font-medium text-secondary-900">{employee.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {employee.skills && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {employee.skills.split(',').map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />

      {/* AI Insights Modal */}
      <Modal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        title="AI Skill Insights"
        size="lg"
      >
        {insights && (
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-purple-800">{insights.summary}</p>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-secondary-900 mb-3">
                <Award className="w-5 h-5 text-primary-600" />
                Top Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {insights.topSkills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {insights.recommendedTraining.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-secondary-900 mb-3">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Recommended Training
                </h3>
                <ul className="space-y-2">
                  {insights.recommendedTraining.map((training: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-secondary-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      {training}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.careerPathSuggestion && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-secondary-900 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Career Path Suggestion
                </h3>
                <p className="text-secondary-700">{insights.careerPathSuggestion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Employee Status"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Current status: <StatusBadge status={employee.status} />
          </p>
          <p className="text-secondary-600 mb-4">Select a new status for {employee.fullName}:</p>
          
          <div className="grid grid-cols-2 gap-3">
            {['Active', 'OnLeave', 'Terminated', 'Probation'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdatingStatus || employee.status === status}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  employee.status === status
                    ? 'border-primary-500 bg-primary-50 cursor-default'
                    : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      status === 'Active' ? 'bg-green-100 text-green-700' :
                      status === 'OnLeave' ? 'bg-amber-100 text-amber-700' :
                      status === 'Terminated' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {status === 'OnLeave' ? 'On Leave' : status}
                    </span>
                    <p className="text-xs text-secondary-500 mt-2">
                      {status === 'Active' && 'Employee is actively working'}
                      {status === 'OnLeave' && 'Employee is on temporary leave'}
                      {status === 'Terminated' && 'Employment has been terminated'}
                      {status === 'Probation' && 'Employee is on probation period'}
                    </p>
                  </div>
                  {employee.status === status && (
                    <span className="text-primary-600 text-xs font-medium">Current</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {isUpdatingStatus && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-secondary-600">Updating status...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
