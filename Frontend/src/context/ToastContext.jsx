import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 dark:border-emerald-500/20';
      case 'error':
        return 'border-rose-500/30 dark:border-rose-500/20';
      case 'warning':
        return 'border-amber-500/30 dark:border-amber-500/20';
      case 'info':
      default:
        return 'border-blue-500/30 dark:border-blue-500/20';
    }
  };

  const getProgressBarBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 dark:bg-emerald-400';
      case 'error':
        return 'bg-rose-500 dark:bg-rose-400';
      case 'warning':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'info':
      default:
        return 'bg-blue-500 dark:bg-blue-400';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden flex gap-3 items-start p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border shadow-2xl transition-all duration-300 animate-in slide-in-from-right-5 fade-in ${getBorderColor(toast.type)}`}
          >
            {getIcon(toast.type)}
            
            <div className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-200 pr-4 leading-normal">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition shrink-0 self-center"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Premium Animated Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/40">
              <div 
                className={`h-full ${getProgressBarBg(toast.type)}`}
                style={{
                  animation: `toast-progress ${toast.duration}ms linear forwards`,
                  transformOrigin: 'left'
                }}
              />
            </div>

            <style>{`
              @keyframes toast-progress {
                0% { transform: scaleX(1); }
                100% { transform: scaleX(0); }
              }
            `}</style>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
