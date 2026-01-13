import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  description?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, color = 'blue', description }: StatCardProps) {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      shadow: 'shadow-blue-500/20',
      glow: 'group-hover:shadow-blue-500/30',
      ring: 'ring-blue-500/20',
    },
    green: {
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      shadow: 'shadow-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/30',
      ring: 'ring-emerald-500/20',
    },
    purple: {
      gradient: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      shadow: 'shadow-violet-500/20',
      glow: 'group-hover:shadow-violet-500/30',
      ring: 'ring-violet-500/20',
    },
    orange: {
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      shadow: 'shadow-orange-500/20',
      glow: 'group-hover:shadow-orange-500/30',
      ring: 'ring-orange-500/20',
    },
    pink: {
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      shadow: 'shadow-pink-500/20',
      glow: 'group-hover:shadow-pink-500/30',
      ring: 'ring-pink-500/20',
    },
    cyan: {
      gradient: 'from-cyan-500 to-sky-500',
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      shadow: 'shadow-cyan-500/20',
      glow: 'group-hover:shadow-cyan-500/30',
      ring: 'ring-cyan-500/20',
    },
  };

  const config = colorConfig[color];

  return (
    <div className={`group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl border border-secondary-100 p-6 transition-all duration-300 hover:shadow-xl ${config.glow} hover:-translate-y-1 hover:border-secondary-200`}>
      {/* Background decoration */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 blur-2xl transition-all duration-300 group-hover:opacity-20`} />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-secondary-900 tracking-tight">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                trend.isPositive 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-secondary-400">{description}</p>
          )}
        </div>
        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.shadow} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
    </div>
  );
}
