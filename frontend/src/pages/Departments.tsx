import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Building2,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { departmentService } from '../services/departmentService';
import { DepartmentDetails as DepartmentDetailsType, DepartmentListItem } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

export default function Departments() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetailsType | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAllActive();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await departmentService.getById(id);
      if (response.success && response.data) {
        setSelectedDepartment(response.data);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load department details');
    }
    setOpenDropdown(null);
  };

  const handleDeleteClick = (id: string) => {
    setDepartmentToDelete(id);
    setIsDeleteDialogOpen(true);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      const response = await departmentService.delete(departmentToDelete);
      if (response.success) {
        toast.success('Department deleted successfully');
        loadDepartments();
      } else {
        toast.error(response.message || 'Failed to delete department');
      }
    } catch (error) {
      toast.error('Failed to delete department');
    } finally {
      setIsDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const filteredDepartments = departments.filter((dept: DepartmentListItem) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEmployees = departments.reduce((sum: number, dept: DepartmentListItem) => sum + dept.employeeCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Departments</h1>
          <p className="text-secondary-500 mt-1">
            Manage organization departments and teams
          </p>
        </div>
        {isAdmin && (
          <Link to="/departments/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Department
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-secondary-500 text-sm">Total Departments</p>
              <p className="text-2xl font-bold text-secondary-900">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-secondary-500 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-secondary-900">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-secondary-500 text-sm">Avg. Team Size</p>
              <p className="text-2xl font-bold text-secondary-900">
                {departments.length > 0
                  ? Math.round(totalEmployees / departments.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
        <input
          type="text"
          placeholder="Search departments..."
          className="input pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept: DepartmentListItem) => (
          <div key={dept.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{dept.name}</h3>
                  <p className="text-sm text-secondary-500">{dept.employeeCount} employees</p>
                </div>
              </div>

              {/* Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === dept.id ? null : dept.id)
                  }
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-secondary-500" />
                </button>

                {openDropdown === dept.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-10">
                    <button
                      onClick={() => handleViewDetails(dept.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {isAdmin && (
                      <>
                        <Link
                          to={`/departments/${dept.id}/edit`}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(dept.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {dept.description && (
              <p className="mt-4 text-sm text-secondary-600 line-clamp-2">
                {dept.description}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-secondary-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-500">Budget</span>
                <span className="font-medium text-secondary-900">
                  ${(dept.budget || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <Building2 className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            No departments found
          </h3>
          <p className="text-secondary-500 mb-6">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by creating your first department'}
          </p>
          {isAdmin && !searchQuery && (
            <Link to="/departments/new" className="btn btn-primary inline-flex">
              <Plus className="w-4 h-4" />
              Add Department
            </Link>
          )}
        </div>
      )}

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Department Details"
      >
        {selectedDepartment && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-secondary-500">Name</label>
              <p className="font-medium text-secondary-900">{selectedDepartment.name}</p>
            </div>
            {selectedDepartment.description && (
              <div>
                <label className="text-sm text-secondary-500">Description</label>
                <p className="text-secondary-900">{selectedDepartment.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-secondary-500">Employees</label>
                <p className="font-medium text-secondary-900">
                  {selectedDepartment.employeeCount}
                </p>
              </div>
              <div>
                <label className="text-sm text-secondary-500">Budget</label>
                <p className="font-medium text-secondary-900">
                  ${selectedDepartment.budget?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            {selectedDepartment.headName && (
              <div>
                <label className="text-sm text-secondary-500">Department Head</label>
                <p className="font-medium text-secondary-900">
                  {selectedDepartment.headName}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-secondary-500">Created</label>
              <p className="text-secondary-900">
                {new Date(selectedDepartment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone. All employees in this department will need to be reassigned."
        confirmText="Delete"
        variant="danger"
      />

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
