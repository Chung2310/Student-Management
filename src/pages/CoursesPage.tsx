import React from 'react';
import { ErpCourses } from './ErpDemo/ErpCourses';
import { ErpThemeProvider } from './ErpDemo/ErpThemeContext';

export function CoursesPage() {
  return (
    <ErpThemeProvider>
      <ErpCourses />
    </ErpThemeProvider>
  );
}
