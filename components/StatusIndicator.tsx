

import React from 'react';

interface StatusIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isConnected, isConnecting, isReconnecting }) => {
  let color = 'bg-red-500';
  let text = 'Desconectada';

  if (isReconnecting) {
    color = 'bg-amber-500 animate-pulse';
    text = 'Reconectando';
  } else if (isConnecting) {
    color = 'bg-amber-500 animate-pulse';
    text = 'Conectando';
  } else if (isConnected) {
    color = 'bg-green-500';
    text = 'Conectada';
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full transition-colors ${color}`}></div>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
};