import React from 'react';
import { InstructorsManager } from '../components/InstructorsManager';
import { ManagementThemeProvider } from '../components/ManagementThemeContext';

export function InstructorsPage() {
  return (
    <ManagementThemeProvider>
      <InstructorsManager />
    </ManagementThemeProvider>
  );
}
