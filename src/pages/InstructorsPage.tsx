import React from 'react';
import { ErpInstructors } from './ErpDemo/ErpInstructors';
import { ErpThemeProvider } from './ErpDemo/ErpThemeContext';

export function InstructorsPage() {
  return (
    <ErpThemeProvider>
      <ErpInstructors />
    </ErpThemeProvider>
  );
}
