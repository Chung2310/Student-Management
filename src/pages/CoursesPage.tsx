import React from 'react';
import { CoursesManager } from '../components/CoursesManager';
import { ManagementThemeProvider } from '../components/ManagementThemeContext';

export function CoursesPage() {
  return (
    <ManagementThemeProvider>
      <CoursesManager />
    </ManagementThemeProvider>
  );
}
