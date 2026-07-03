import React from 'react';
import { Search, Filter, ChevronDown, List, LayoutGrid } from 'lucide-react';
import { cn } from '../../../lib/utils';

type RoleFilter = 'all' | 'superadmin' | 'admin' | 'user';

interface UserFilterProps {
  search: string;
  setSearch: (val: string) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (val: RoleFilter) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  isSA: boolean;
}

export function UserFilter({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  viewMode,
  setViewMode,
  isSA,
}: UserFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
          >
            <option value="all">Tất cả</option>
            {isSA && <option value="superadmin">Superadmin</option>}
            <option value="admin">Admin</option>
            <option value="user">{isSA ? 'Nhân viên' : 'Giảng viên'}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1 h-10">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Dạng danh sách"
            className={cn(
              "p-1.5 rounded-lg transition-all cursor-pointer",
              viewMode === 'list' ? "bg-white text-cyan-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Dạng thẻ"
            className={cn(
              "p-1.5 rounded-lg transition-all cursor-pointer",
              viewMode === 'grid' ? "bg-white text-cyan-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
