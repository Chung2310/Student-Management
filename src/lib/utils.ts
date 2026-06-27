import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for combining Tailwind classes with merging support.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number or string into a dot-separated currency format (VND).
 * Example: 4000000 -> 4.000.000
 */
export function formatVND(amount: number | string): string {
  const num = typeof amount === 'string' ? parseInt(amount.replace(/\D/g, ''), 10) : amount;
  if (isNaN(num as number) || num === null) return '';
  return num.toLocaleString('vi-VN');
}

/**
 * Removes all non-digit characters from a formatted currency string.
 * Example: 4.000.000 -> 4000000
 */

export function parseVND(formattedValue: string): string {
  return formattedValue.replace(/\D/g, '');
}

/**
 * Formats a date string for display (DD/MM/YYYY).
 * Handles YYYY-MM-DD (from date inputs) and existing DD/MM/YYYY formats.
 */
export function formatDisplayDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Chưa cập nhật';
  
  // If it's already DD/MM/YYYY, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  // If it's YYYY-MM-DD (from HTML date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
}

/**
 * Converts a Vietnamese string into a clean URL-friendly slug.
 */
export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s-])/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
