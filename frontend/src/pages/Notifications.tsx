import { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Check, 
  CheckCheck, 
  Trash2, 
  Send,
  AlertTriangle, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Megaphone, 
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { employeeService } from '../services/employeeService';
import { 
  Notification, 
  CreateNotification, 
  NotificationType, 
  NotificationPriority,
  PagedResult,
  EmployeeListItem
} from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const Notifications = () => {
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';
  
  const [notifications, setNotifications] = useState<PagedResult<Notification> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(page, 10, filter === 'unread');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (isManagerOrAdmin) {
      try {
        const response = await employeeService.getAll({ pageSize: 100 });
        if (response.success && response.data) {
          setEmployees(response.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchEmployees();
  }, [page, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationService.deleteNotification(id);
        fetchNotifications();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'Error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Announcement':
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case 'StatusChange':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-cyan-500" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    const styles = {
      Urgent: 'bg-red-100 text-red-600 border-red-200',
      High: 'bg-amber-100 text-amber-600 border-amber-200',
      Normal: 'bg-primary-100 text-primary-600 border-primary-200',
      Low: 'bg-secondary-100 text-secondary-600 border-secondary-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-secondary-200/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
              <p className="text-sm text-secondary-500">
                {notifications?.totalCount || 0} total notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center gap-1 p-1 bg-secondary-100/80 rounded-xl">
              <button
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-secondary-500 hover:text-secondary-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('unread'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'unread' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-secondary-500 hover:text-secondary-700'
                }`}
              >
                Unread
              </button>
            </div>

            {/* Mark All Read */}
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-600 hover:text-secondary-900 bg-secondary-100/80 hover:bg-secondary-200/80 rounded-xl transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>

            {/* Create Notification (Admin/Manager only) */}
            {isManagerOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-primary-500/25"
              >
                <Plus className="w-4 h-4" />
                Send Notification
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-secondary-200/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications && notifications.items.length > 0 ? (
          <div className="divide-y divide-secondary-100">
            {notifications.items.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-all duration-200 hover:bg-secondary-50 ${
                  !notification.isRead ? 'bg-primary-50/50 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-xl bg-secondary-100">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${notification.isRead ? 'text-secondary-600' : 'text-secondary-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      )}
                      {getPriorityBadge(notification.priority)}
                      <span className="px-2 py-0.5 text-xs font-medium text-secondary-500 bg-secondary-100 rounded-full">
                        {notification.type}
                      </span>
                    </div>
                    
                    <p className="text-secondary-600 mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-secondary-400">
                      <span>From: {notification.createdByName}</span>
                      <span>•</span>
                      <span title={formatDate(notification.createdAt)}>
                        {formatTime(notification.createdAt)}
                      </span>
                      {notification.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {formatDate(notification.expiresAt)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    {isManagerOrAdmin && (
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-secondary-400">
            <Bell className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm text-secondary-400 mt-1">
              {filter === 'unread' ? "You've read all your notifications!" : "You don't have any notifications yet"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {notifications && notifications.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-secondary-50/50 border-t border-secondary-200/50">
            <p className="text-sm text-secondary-500">
              Page {notifications.pageNumber} of {notifications.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!notifications.hasPreviousPage}
                className="p-2 text-secondary-500 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-100 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!notifications.hasNextPage}
                className="p-2 text-secondary-500 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-100 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
};

interface CreateNotificationModalProps {
  employees: EmployeeListItem[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateNotificationModal = ({ employees, onClose, onCreated }: CreateNotificationModalProps) => {
  const [formData, setFormData] = useState<CreateNotification>({
    title: '',
    message: '',
    type: 'Info',
    priority: 'Normal',
    targetUserId: undefined,
    expiresAt: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'broadcast' | 'specific'>('broadcast');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload: CreateNotification = {
        ...formData,
        targetUserId: targetType === 'broadcast' ? undefined : formData.targetUserId,
      };
      
      await notificationService.createNotification(payload);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes: NotificationType[] = ['Info', 'Warning', 'Success', 'Error', 'Announcement', 'StatusChange'];
  const priorityLevels: NotificationPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20">
              <Send className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900">Send Notification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Target Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-secondary-700">Send To</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'broadcast'}
                  onChange={() => setTargetType('broadcast')}
                  className="w-4 h-4 text-primary-500 border-secondary-300 focus:ring-primary-500"
                />
                <span className="text-secondary-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Employees (Broadcast)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                  className="w-4 h-4 text-primary-500 border-secondary-300 focus:ring-primary-500"
                />
                <span className="text-secondary-700">Specific Employee</span>
              </label>
            </div>
            
            {targetType === 'specific' && (
              <select
                value={formData.targetUserId || ''}
                onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value || undefined })}
                className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">Select an employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Notification title..."
              className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Write your notification message..."
              rows={4}
              className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              required
            />
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
                className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {priorityLevels.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">Expires At (Optional)</label>
            <input
              type="datetime-local"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
              className="w-full px-4 py-3 bg-white border border-secondary-200 rounded-xl text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <p className="text-xs text-secondary-500">Leave empty for notifications that don't expire</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-white bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
