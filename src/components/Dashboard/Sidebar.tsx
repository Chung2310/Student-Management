import React from 'react';
import {
  LayoutDashboard, Users, Calendar, Wallet, MessageSquare, Settings,
  Shield, LogOut, LogIn, RefreshCcw, X, BookOpen, Warehouse, School, LucideIcon
} from 'lucide-react';
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

interface MenuItem {
  icon: LucideIcon;
  label: string;
  view: ViewType;
  count?: number;
}

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { user, login, logout, isLoggingIn } = useAuth();
  const { students } = useStudents();
  const { exams } = useExams();

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Tổng quan', view: 'Dashboard' },
    { icon: Users, label: 'Học viên', view: 'Students', count: user ? students.length : 0 },
    { icon: Calendar, label: 'Lịch thi', view: 'Exams', count: user ? exams.length : 0 },
    { icon: Wallet, label: 'Học phí', view: 'Fees' },
    { icon: MessageSquare, label: 'BOT Thông báo', view: 'Bot' },
    { icon: BookOpen, label: 'Khóa học', view: 'Courses' },
    { icon: School, label: 'Lớp & Khai giảng', view: 'Batches' },
    { icon: Warehouse, label: 'Thiết bị', view: 'Resources' },
    { icon: Shield, label: user?.role === 'superadmin' ? 'Quản lý người dùng' : 'Quản lý giảng viên', view: 'UserManagement' },
    { icon: Settings, label: 'Cài đặt & Quản trị', view: 'SettingsAdmin' },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    // Hide SettingsAdmin and UserManagement for regular users
    if ((item.view === 'SettingsAdmin' || item.view === 'UserManagement') && user?.role === 'user') {
      return false;
    }
    // Restrict other views for user role based on permissions
    if (user?.role === 'user') {
      // Dashboard is always visible
      if (item.view === 'Dashboard') return true;
      // If user.permissions exists, filter by it
      if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(item.view);
      }
      // If permissions array is missing/legacy, default to true
      return true;
    }
    return true;
  });

  return (
    <>
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
        "bg-white border-r border-slate-200/60 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] flex flex-col h-screen fixed top-0 left-0 transition-all duration-300 z-[50] text-slate-600",
        "w-72 lg:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img
                src="/logo-igen.png"
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-lg"
              />
              <div>
                <h1 className="font-bold text-slate-900 text-sm leading-tight">iGen Education</h1>
                <p className="text-[10px] text-slate-500 font-medium">Quản lý đào tạo & học viên</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
 
          <nav className="space-y-1">
            {visibleMenuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer",
                  currentView === item.view
                    ? "bg-cyan-50 text-cyan-600 font-bold shadow-sm shadow-cyan-100/30"
                    : "hover:text-slate-900 hover:bg-slate-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={cn("w-4 h-4", currentView === item.view ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600")} />
                  {item.label}
                </div>
                {item.count && item.count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    currentView === item.view ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
 
        <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/80">
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 leading-none mb-1 truncate">{user.displayName || 'Người dùng'}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
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
                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                isLoggingIn ? "bg-slate-100 text-slate-400" : "bg-cyan-50 hover:bg-cyan-100 text-cyan-600"
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
