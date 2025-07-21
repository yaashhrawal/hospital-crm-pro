import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected?: boolean;
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ 
  isConnected = true,
  className = '' 
}) => {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected]);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <Wifi className={`h-4 w-4 text-green-500 ${showPulse ? 'animate-pulse' : ''}`} />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className="text-xs text-gray-500">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};