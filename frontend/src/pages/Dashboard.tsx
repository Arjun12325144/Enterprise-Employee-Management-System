import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, Building2, UserPlus, DollarSign, TrendingUp, Activity, Calendar, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        toast.error('Failed to load dashboard stats');
      }
    } catch (error) {
      toast.error('An error occurred while loading dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{getGreeting()}, {user?.firstName}! 👋</h1>
            <p className="text-white/70 max-w-lg">
              Welcome to your employee management dashboard. Here's an overview of your organization's performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">System Status</p>
                <p className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  All systems operational
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
            color="blue"
            description="All registered employees"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={Users}
            color="green"
            description="Currently working"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <StatCard
            title="Departments"
            value={stats.totalDepartments}
            icon={Building2}
            color="purple"
            description="Active departments"
          />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <StatCard
            title="New Hires"
            value={stats.newHiresThisMonth}
            icon={UserPlus}
            color="orange"
            description="This month"
          />
        </div>
      </div>

      {/* Average Salary Card - Enhanced */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-sm font-medium">Average Salary</p>
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(stats.averageSalary)}</p>
            <div className="flex items-center gap-2 mt-2 text-emerald-100">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Across all departments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-secondary-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-secondary-900">Employees by Department</h3>
              <p className="text-sm text-secondary-500 mt-1">Distribution across departments</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentStats} layout="vertical">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="departmentName"
                  type="category"
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                />
                <Bar dataKey="employeeCount" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-secondary-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-secondary-900">Employment Status</h3>
              <p className="text-sm text-secondary-500 mt-1">Current workforce distribution</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={stats.statusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {stats.statusStats.map((_: { status: string; count: number }, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#pieGradient${index % COLORS.length})`}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {stats.statusStats.map((item: { status: string; count: number }, index: number) => (
              <div key={item.status} className="flex items-center gap-2 bg-secondary-50 px-3 py-1.5 rounded-full">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-secondary-600">{item.status}</span>
                <span className="text-sm font-bold text-secondary-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
