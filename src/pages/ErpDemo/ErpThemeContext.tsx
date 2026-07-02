/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

interface ErpThemeValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ErpThemeContext = createContext<ErpThemeValue>({ darkMode: false, toggleDarkMode: () => {} });

export function ErpThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('erp-dark-mode') === '1'
  );

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('erp-dark-mode', next ? '1' : '0');
      return next;
    });
  };

  return (
    <ErpThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ErpThemeContext.Provider>
  );
}

export function useErpTheme() {
  return useContext(ErpThemeContext);
}
