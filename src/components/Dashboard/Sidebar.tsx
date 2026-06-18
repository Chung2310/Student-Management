import React from 'react';
import { LayoutDashboard, Users, Calendar, Wallet, TrendingUp, MessageSquare, Settings, UserCheck, LogOut, Car, LogIn, RefreshCcw, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useStudents } from '../../hooks/useStudents';
import { useExams } from '../../hooks/useExams';
import { ViewType } from '../../App';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { user, login, logout, isLoggingIn } = useAuth();
  const { students } = useStudents();
  const { exams } = useExams();

  const menuItems: { icon: React.ComponentType<{ className?: string }>; label: string; view: ViewType; count?: number }[] = [
    { icon: LayoutDashboard, label: 'Tổng quan', view: 'Dashboard' },
    { icon: Users, label: 'Học viên', view: 'Students', count: user ? students.length : 0 },
    { icon: Calendar, label: 'Lịch thi', view: 'Exams', count: user ? exams.length : 0 },
    { icon: Wallet, label: 'Học phí', view: 'Fees' },
    { icon: TrendingUp, label: 'Kết quả KD', view: 'Results' },
    { icon: MessageSquare, label: 'BOT Thông báo', view: 'Bot' },
    { icon: Settings, label: 'Cài đặt', view: 'SettingsAdmin' },
    { icon: UserCheck, label: 'Admin', view: 'Admin' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "bg-brand-sidebar flex flex-col h-screen sticky top-0 transition-all duration-300 z-[50] text-slate-300",
        "fixed lg:sticky lg:translate-x-0 w-72 lg:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:flex" // Show on large screens by default
      )}>
        <div className="p-6 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">QLHV Lái Xe</h1>
                <p className="text-[10px] text-slate-400 font-medium">Quản lý học viên</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        <nav className="space-y-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                currentView === item.view 
                  ? "bg-brand-primary text-white shadow-lg" 
                  : "hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn("w-4 h-4", currentView === item.view ? "text-white" : "text-slate-400 group-hover:text-white")} />
                {item.label}
              </div>
              {item.count && item.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  currentView === item.view ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400 group-hover:bg-slate-600"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs font-bold text-white leading-none mb-1 truncate">{user.displayName || 'Người dùng'}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-slate-500 hover:text-white transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={login}
            disabled={isLoggingIn}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              isLoggingIn ? "bg-slate-700 text-slate-400" : "bg-brand-primary/20 hover:bg-brand-primary/30 text-white"
            )}
          >
            {isLoggingIn ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Đang kết nối...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Đăng nhập Google
              </>
            )}
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
