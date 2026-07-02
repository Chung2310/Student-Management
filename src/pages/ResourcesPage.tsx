import React from 'react';
import { ResourcesManager } from '../components/ResourcesManager';
import { ManagementThemeProvider } from '../components/ManagementThemeContext';

export function ResourcesPage() {
  return (
    <ManagementThemeProvider>
      <ResourcesManager />
    </ManagementThemeProvider>
  );
}
