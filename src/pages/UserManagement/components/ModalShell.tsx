import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function ModalShell({ open, onClose, icon: Icon, title, subtitle, children }: ModalShellProps) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
