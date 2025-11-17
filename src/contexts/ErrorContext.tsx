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
