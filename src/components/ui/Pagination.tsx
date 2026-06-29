import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  itemName?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemName = 'học viên',
  className
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = ((currentPage - 1) * pageSize) + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100 gap-4 sm:gap-0 no-print",
      className
    )}>
      <div className="text-xs font-medium text-slate-400 order-2 sm:order-1">
        Hiển thị {startItem} - {endItem} của {totalItems} {itemName}
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button 
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          title="Trang trước"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                currentPage === page 
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-100" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-cyan-600 hover:text-cyan-600"
              )}
            >
              {page}
            </button>
          ))}
        </div>

        <span className="sm:hidden text-xs font-bold text-slate-600 px-3">
          Trang {currentPage} / {totalPages}
        </span>

        <button 
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          title="Trang sau"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
