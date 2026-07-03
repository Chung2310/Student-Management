import React from 'react';
import { Users, ShieldCheck, Building2, User as UserIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface UserStatsProps {
  stats: {
    total: number;
    superadmin: number;
    admin: number;
    user: number;
  };
  isSA: boolean;
}

export function UserStats({ stats, isSA }: UserStatsProps) {
  const cards = [
    { label: 'Tổng cộng', value: stats.total, icon: Users, accent: 'text-slate-700' },
    ...(isSA ? [{ label: 'Superadmin', value: stats.superadmin, icon: ShieldCheck, accent: 'text-amber-600' }] : []),
    { label: 'Trung tâm', value: stats.admin, icon: Building2, accent: 'text-cyan-600' },
    { label: isSA ? 'Nhân viên' : 'Giảng viên', value: stats.user, icon: UserIcon, accent: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50', s.accent)}>
            <s.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className="text-lg font-bold text-slate-900">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
