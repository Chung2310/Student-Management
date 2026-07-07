import React from 'react';
import { cn } from '../../../lib/utils';

export function SettingsPanel({
  title,
  icon: Icon,
  iconClassName,
  actions,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6 lg:col-span-2">
      <div className="flex flex-col gap-4 border-b border-slate-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Icon className={cn('w-5 h-5 text-cyan-600', iconClassName)} />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-9 px-4 rounded-xl bg-slate-900 hover:bg-black active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-4 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {children}
    </button>
  );
}

export function SettingsInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

export function SysStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

export function AdminToggle({
  label,
  enabled = false,
  disabled = false,
}: {
  label: string;
  enabled?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic transition-all">
      <span className={cn('text-xs font-bold', disabled ? 'text-slate-400' : 'text-slate-700')}>{label}</span>
      <button
        type="button"
        className={cn('relative w-12 h-6 rounded-full transition-all duration-300', enabled ? 'bg-cyan-600' : 'bg-slate-200')}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300',
            enabled ? 'left-7' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

export interface DataActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  actionLabel: string;
  color: 'indigo' | 'blue' | 'rose';
  onClick: () => void;
}

export function DataActionCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  color,
  onClick,
}: DataActionCardProps) {
  const colorMap: Record<DataActionCardProps['color'], string> = {
    indigo: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
  };

  const btnColorMap: Record<DataActionCardProps['color'], string> = {
    indigo: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-100',
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex flex-col items-center text-center space-y-4 group">
      <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', colorMap[color])}>
        <Icon size={40} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed px-4">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn('w-full py-4 mt-4 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95', btnColorMap[color])}
      >
        {actionLabel}
      </button>
    </div>
  );
}
