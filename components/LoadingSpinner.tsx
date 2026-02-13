import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "", size = 24 }) => {
  return (
    <Loader2 className={`animate-spin ${className}`} size={size} />
  );
};
