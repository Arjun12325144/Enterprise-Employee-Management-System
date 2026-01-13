import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Save, Loader2, Shield, Bell, Palette, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  leaveRequestUpdates: boolean;
  systemAnnouncements: boolean;
  weeklyDigest: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

const ACCENT_COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
];

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'appearance'>('profile');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('ems_notification_settings');
    return saved ? JSON.parse(saved) : {
      emailNotifications: true,
      leaveRequestUpdates: true,
      systemAnnouncements: true,
      weeklyDigest: false,
    };
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem('ems_appearance_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      accentColor: 'indigo',
      fontSize: 'medium',
    };
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  // Apply theme when appearance settings change
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      root.classList.add('dark');
    } else if (appearanceSettings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Apply font size
    root.style.fontSize = appearanceSettings.fontSize === 'small' ? '14px' : 
                          appearanceSettings.fontSize === 'large' ? '18px' : '16px';
    
    // Save to localStorage
    localStorage.setItem('ems_appearance_settings', JSON.stringify(appearanceSettings));
  }, [appearanceSettings]);

  // Save notification settings
  useEffect(() => {
    localStorage.setItem('ems_notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      await api.put('/auth/profile', data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success('Notification preference saved');
      return updated;
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setAppearanceSettings(prev => ({ ...prev, theme }));
    toast.success(`Theme changed to ${theme}`);
  };

  const handleAccentColorChange = (color: string) => {
    setAppearanceSettings(prev => ({ ...prev, accentColor: color }));
    toast.success('Accent color updated');
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    setAppearanceSettings(prev => ({ ...prev, fontSize }));
    toast.success('Font size updated');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <button type="button" className="btn btn-secondary">
                      Change Photo
                    </button>
                    <p className="text-sm text-secondary-500 mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="text"
                        className={`input pl-10 ${profileErrors.firstName ? 'border-red-500' : ''}`}
                        {...registerProfile('firstName', { required: 'First name is required' })}
                      />
                    </div>
                    {profileErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="text"
                        className={`input pl-10 ${profileErrors.lastName ? 'border-red-500' : ''}`}
                        {...registerProfile('lastName', { required: 'Last name is required' })}
                      />
                    </div>
                    {profileErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                      type="email"
                      className="input pl-10"
                      disabled
                      {...registerProfile('email')}
                    />
                  </div>
                  <p className="mt-1 text-sm text-secondary-500">
                    Contact your administrator to change your email address
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-secondary-100">
                  <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary">
                    {isUpdatingProfile ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="password"
                        className={`input pl-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                        {...registerPassword('currentPassword', {
                          required: 'Current password is required',
                        })}
                      />
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="password"
                        className={`input pl-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                        {...registerPassword('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                      <input
                        type="password"
                        className={`input pl-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                        {...registerPassword('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (value: string) =>
                            value === newPassword || 'Passwords do not match',
                        })}
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-secondary-100">
                    <button type="submit" disabled={isUpdatingPassword} className="btn btn-primary">
                      {isUpdatingPassword ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Changing...
                        </span>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Active Sessions</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">Current Session</p>
                      <p className="text-sm text-secondary-500">Windows • Chrome • Active now</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">
                Notification Preferences
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">Email Notifications</p>
                    <p className="text-sm text-secondary-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNotificationChange('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.emailNotifications ? 'bg-primary-600' : 'bg-secondary-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        notificationSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">Leave Request Updates</p>
                    <p className="text-sm text-secondary-500">
                      Get notified when leave requests are updated
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNotificationChange('leaveRequestUpdates')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.leaveRequestUpdates ? 'bg-primary-600' : 'bg-secondary-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        notificationSettings.leaveRequestUpdates ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">System Announcements</p>
                    <p className="text-sm text-secondary-500">
                      Important system updates and announcements
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNotificationChange('systemAnnouncements')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.systemAnnouncements ? 'bg-primary-600' : 'bg-secondary-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        notificationSettings.systemAnnouncements ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">Weekly Digest</p>
                    <p className="text-sm text-secondary-500">
                      Receive a weekly summary of activities
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleNotificationChange('weeklyDigest')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationSettings.weeklyDigest ? 'bg-primary-600' : 'bg-secondary-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        notificationSettings.weeklyDigest ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-100">
                <p className="text-sm text-secondary-500">
                  Your notification preferences are saved automatically and stored locally.
                </p>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">Appearance</h2>
              <div className="space-y-8">
                {/* Theme Selection */}
                <div>
                  <label className="label mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 border-2 rounded-lg bg-white relative ${
                        appearanceSettings.theme === 'light' ? 'border-primary-500' : 'border-secondary-200'
                      }`}
                    >
                      {appearanceSettings.theme === 'light' && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary-500" />
                      )}
                      <div className="w-full h-8 bg-secondary-100 rounded mb-2"></div>
                      <p className="text-sm font-medium text-secondary-900">Light</p>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 border-2 rounded-lg bg-secondary-900 relative ${
                        appearanceSettings.theme === 'dark' ? 'border-primary-500' : 'border-secondary-700'
                      }`}
                    >
                      {appearanceSettings.theme === 'dark' && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary-400" />
                      )}
                      <div className="w-full h-8 bg-secondary-700 rounded mb-2"></div>
                      <p className="text-sm font-medium text-white">Dark</p>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleThemeChange('system')}
                      className={`p-4 border-2 rounded-lg bg-gradient-to-b from-white to-secondary-900 relative ${
                        appearanceSettings.theme === 'system' ? 'border-primary-500' : 'border-secondary-200'
                      }`}
                    >
                      {appearanceSettings.theme === 'system' && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary-500" />
                      )}
                      <div className="w-full h-8 bg-gradient-to-r from-secondary-100 to-secondary-700 rounded mb-2"></div>
                      <p className="text-sm font-medium text-secondary-600">System</p>
                    </button>
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="label mb-3">Accent Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleAccentColorChange(color.value)}
                        className={`w-10 h-10 rounded-full ${color.class} flex items-center justify-center ${
                          appearanceSettings.accentColor === color.value 
                            ? 'ring-2 ring-offset-2 ring-secondary-400' 
                            : ''
                        }`}
                        title={color.name}
                      >
                        {appearanceSettings.accentColor === color.value && (
                          <Check className="w-5 h-5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="label mb-3">Font Size</label>
                  <div className="flex gap-3">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleFontSizeChange(size)}
                        className={`px-4 py-2 rounded-lg border-2 capitalize ${
                          appearanceSettings.fontSize === size
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-100">
                <p className="text-sm text-secondary-500">
                  Your appearance preferences are saved automatically and stored locally.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
