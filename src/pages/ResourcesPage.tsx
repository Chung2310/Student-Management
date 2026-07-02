import React from 'react';
import { ErpResources } from './ErpDemo/ErpResources';
import { ErpThemeProvider } from './ErpDemo/ErpThemeContext';

export function ResourcesPage() {
  return (
    <ErpThemeProvider>
      <ErpResources />
    </ErpThemeProvider>
  );
}
