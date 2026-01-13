import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, CheckCircle, AlertCircle, Megaphone, RefreshCw } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { Notification, NotificationSummary } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotificationSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      fetchSummary();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchSummary();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'Warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'Success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Announcement':
        return <Megaphone className="w-4 h-4 text-purple-500" />;
      case 'StatusChange':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getPriorityStyle = (priority: Notification['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'border-l-red-500 bg-red-50/50';
      case 'High':
        return 'border-l-amber-500 bg-amber-50/50';
      case 'Low':
        return 'border-l-secondary-400 bg-secondary-50/50';
      default:
        return 'border-l-primary-500 bg-primary-50/30';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-xl hover:bg-secondary-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-secondary-600" />
        {summary && summary.unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {summary.unreadCount > 99 ? '99+' : summary.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-secondary-200/50 overflow-hidden z-50 animate-slide-down">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-b border-secondary-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-secondary-900">Notifications</h3>
                {summary && summary.unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium text-primary-600 bg-primary-500/20 rounded-full">
                    {summary.unreadCount} new
                  </span>
                )}
              </div>
              {summary && summary.unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-xs text-secondary-500 hover:text-primary-600 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && !summary ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : summary && summary.recentNotifications.length > 0 ? (
              <div className="divide-y divide-secondary-100">
                {summary.recentNotifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-l-4 transition-all duration-200 hover:bg-secondary-50 ${getPriorityStyle(notification.priority)} ${
                      !notification.isRead ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium truncate ${notification.isRead ? 'text-secondary-600' : 'text-secondary-900'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-secondary-500 line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-secondary-400">
                            {formatTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-secondary-400">
                <Bell className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-secondary-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-secondary-50/50 border-t border-secondary-200/50">
            <Link
              to="/notifications"
              className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
