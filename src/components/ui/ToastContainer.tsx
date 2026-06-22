import React, { useEffect, useState } from 'react';
import { useToast, Toast, ToastType } from '../../hooks/useToast';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string; text: string }> = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-500',
    bg: 'bg-white/95 dark:bg-slate-800/95',
    border: 'border-emerald-200 dark:border-emerald-700/50',
    text: 'text-slate-700 dark:text-slate-200',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'text-red-500',
    bg: 'bg-white/95 dark:bg-slate-800/95',
    border: 'border-red-200 dark:border-red-700/50',
    text: 'text-slate-700 dark:text-slate-200',
  },
  warning: {
    bar: 'bg-amber-400',
    icon: 'text-amber-500',
    bg: 'bg-white/95 dark:bg-slate-800/95',
    border: 'border-amber-200 dark:border-amber-600/50',
    text: 'text-slate-700 dark:text-slate-200',
  },
  info: {
    bar: 'bg-cyan-500',
    icon: 'text-cyan-500',
    bg: 'bg-white/95 dark:bg-slate-800/95',
    border: 'border-cyan-200 dark:border-cyan-700/50',
    text: 'text-slate-700 dark:text-slate-200',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 4000;
  const s = STYLES[toast.type];

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(showTimer);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  useEffect(() => {
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onDismiss(toast.id), 350);
    }, duration - 350);
    return () => clearTimeout(leaveTimer);
  }, [toast.id, duration, onDismiss]);

  const translateClass = visible && !leaving
    ? 'translate-x-0 opacity-100'
    : 'translate-x-full opacity-0';

  return (
    <div
      className={`
        relative flex items-start gap-3 min-w-[300px] max-w-sm w-full
        ${s.bg} backdrop-blur-md
        border ${s.border}
        rounded-xl shadow-2xl overflow-hidden
        transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${translateClass}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Left colored bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />

      {/* Content */}
      <div className={`flex items-start gap-3 pl-4 pr-3 py-3.5 w-full`}>
        <span className={s.icon}>{ICONS[toast.type]}</span>
        <p className={`text-sm font-medium leading-snug flex-1 ${s.text}`}>{toast.message}</p>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
          aria-label="Đóng thông báo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-1 right-0 h-0.5 ${s.bar} opacity-30`}>
        <div
          className={`h-full ${s.bar} opacity-60`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .duration-350 { transition-duration: 350ms; }
      `}</style>
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
        aria-label="Thông báo"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
