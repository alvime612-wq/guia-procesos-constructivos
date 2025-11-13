
import React from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start gap-3 animate-fade-in">
      <div>
        <AlertTriangleIcon />
      </div>
      <div>
        <h4 className="font-semibold">Ocurrió un error</h4>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};
