interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
          border: 'border-emerald-200',
        };
      case 'onleave':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
          text: 'text-amber-700',
          dot: 'bg-amber-500',
          border: 'border-amber-200',
        };
      case 'probation':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          text: 'text-blue-700',
          dot: 'bg-blue-500',
          border: 'border-blue-200',
        };
      case 'terminated':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          text: 'text-red-700',
          dot: 'bg-red-500',
          border: 'border-red-200',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-secondary-50 to-secondary-100',
          text: 'text-secondary-700',
          dot: 'bg-secondary-500',
          border: 'border-secondary-200',
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  const formatStatus = (status: string) => {
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`${dotSizes[size]} rounded-full ${config.dot} animate-pulse`} />
      {formatStatus(status)}
    </span>
  );
}
