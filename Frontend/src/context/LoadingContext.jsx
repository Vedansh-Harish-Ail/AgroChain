import React, { createContext, useContext, useState } from 'react';
import { Loader2, Sprout } from 'lucide-react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isOpen: false,
    message: 'Loading...'
  });

  const showLoading = (message = 'Processing...') => {
    setLoadingState({ isOpen: true, message });
  };

  const hideLoading = () => {
    setLoadingState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {loadingState.isOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md animate-fade-in text-white p-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center space-y-6 text-center animate-in zoom-in-95 duration-200">
            {/* Spinning emerald circle and centered Sprout logo */}
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-16 w-16 text-emerald-500 animate-spin" />
              <Sprout className="h-6 w-6 text-emerald-400 absolute" />
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-white text-sm tracking-wide uppercase">AgroChain System</h4>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                {loadingState.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
