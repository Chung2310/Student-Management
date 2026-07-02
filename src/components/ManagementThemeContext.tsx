/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

interface ManagementThemeValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ManagementThemeContext = createContext<ManagementThemeValue>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export function ManagementThemeProvider({ children }: { children: React.ReactNode }) {
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
    <ManagementThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ManagementThemeContext.Provider>
  );
}

export function useManagementTheme() {
  return useContext(ManagementThemeContext);
}
