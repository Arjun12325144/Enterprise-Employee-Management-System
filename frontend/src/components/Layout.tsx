import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationDropdown from './NotificationDropdown';
import {
  LayoutDashboard,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Search,
  Sparkles,
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Employees', href: '/employees', icon: Users, gradient: 'from-violet-500 to-purple-500' },
    { name: 'Departments', href: '/departments', icon: Building2, gradient: 'from-amber-500 to-orange-500' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'Manager':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50/30">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-secondary-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-secondary-200/50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-secondary-200/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">EMS Pro</span>
              <p className="text-xs text-secondary-500">Enterprise Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-4">Main Menu</p>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 text-primary-700 shadow-sm'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive 
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                      : 'bg-secondary-100 group-hover:bg-secondary-200'
                  }`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-secondary-500 group-hover:text-secondary-700'}`} />
                  </div>
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200/50">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100/50 border border-secondary-200/50">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-secondary-900 truncate">
                {user?.fullName}
              </p>
              <span
                className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full shadow-sm ${getRoleBadgeColor(
                  user?.role || ''
                )}`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-secondary-200/50">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-secondary-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-secondary-600" />
              </button>
              
              {/* Search bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-80 pl-12 pr-4 py-3 bg-secondary-50/80 border border-secondary-200/50 rounded-xl text-sm placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationDropdown />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-secondary-100 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-secondary-700">{user?.fullName}</p>
                    <p className="text-xs text-secondary-500">{user?.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-secondary-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-secondary-200/50 py-2 z-20 animate-slide-down">
                      <div className="px-4 py-3 border-b border-secondary-100">
                        <p className="text-sm font-semibold text-secondary-900">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-secondary-500">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <NavLink
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 rounded-xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-secondary-600" />
                          </div>
                          Settings
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
