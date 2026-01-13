import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`relative ${containerSizes[size]}`}>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 opacity-20 blur-lg animate-pulse" />
        
        {/* Spinning gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 animate-spin-slow opacity-30" />
        
        {/* Inner circle */}
        <div className="absolute inset-1 rounded-full bg-white/90 backdrop-blur-sm" />
        
        {/* Spinner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
        </div>
      </div>
      
      {text && (
        <p className="text-sm font-medium text-secondary-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}
