import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ErrorContextType = {
  showError: (message: string) => void;
};

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  const closeError = useCallback(() => {
    setIsShowing(false);
    setTimeout(() => setError(null), 300); // Wait for animation
  }, []);
  
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    if (error) {
      setIsShowing(true);
      hideTimer = setTimeout(closeError, 6000);
    }
    return () => {
      clearTimeout(hideTimer);
    };
  }, [error, closeError]);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && (
        <div 
          className={`fixed top-5 right-5 z-[200] max-w-sm bg-red-800 border border-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 transition-all duration-300 ${isShowing ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
          role="alert"
        >
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="font-mono text-sm">{error}</p>
            <button onClick={closeError} className="p-1 -mr-2 rounded-full hover:bg-red-700 transition-colors" aria-label="Fechar notificação">
                <X className="w-4 h-4" />
            </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
};