'use client';

import React from 'react';
import { useToast, Toast as ToastType } from '../contexts/ToastContext';

const Toast: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const { removeToast } = useToast();

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'error': 
        return 'bg-red-100 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'info':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className={`w-80 p-4 mb-4 border rounded-lg shadow-lg ${getToastStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <span className="text-lg font-bold mr-3">{getIcon()}</span>
          <div>
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.message && (
              <p className="text-sm mt-1 opacity-80">{toast.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold ml-4"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 w-80"
      style={{
        maxWidth: '320px',
        zIndex: 9999
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
