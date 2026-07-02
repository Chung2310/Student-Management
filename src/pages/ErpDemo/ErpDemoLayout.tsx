import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  Warehouse, CalendarRange, ArrowLeft, Sun, Moon, Loader2,
  Wallet, MessageSquare, Shield, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { Student } from '../../types';
import { TabType } from '../../App';
import { ErpThemeProvider, useErpTheme } from './ErpThemeContext';

// Các phân hệ ERP
import { ErpDashboard } from './ErpDashboard';
import { ErpLearners } from './ErpLearners';
import { ErpCourses } from './ErpCourses';
import { ErpInstructors } from './ErpInstructors';
import { ErpResources } from './ErpResources';
import { ErpExams } from './ErpExams';

// Các trang nghiệp vụ tái sử dụng từ giao diện cũ (giữ nguyên logic)
const FeesPage = lazy(() => import('../Fees/FeesPage').then(m => ({ default: m.FeesPage })));
const NotificationsPage = lazy(() => import('../Notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const UserManagementPage = lazy(() => import('../UserManagement/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const SettingsPage = lazy(() => import('../Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StudentDetailModal = lazy(() => import('../../components/Student/StudentDetailModal').then(m => ({ default: m.StudentDetailModal })));
const ChatbotWidget = lazy(() => import('../../components/Chatbot/ChatbotWidget').then(m => ({ default: m.ChatbotWidget })));

type ErpTab = 'Dashboard' | 'Learners' | 'Courses' | 'Instructors' | 'Resources' | 'Exams' | 'Fees' | 'Notifications' | 'UserManagement' | 'Settings';

const TAB_TO_PATH: Record<ErpTab, string> = {
  Dashboard: '',
  Learners: 'learners',
  Courses: 'courses',
  Instructors: 'instructors',
  Resources: 'resources',
  Exams: 'exams',
  Fees: 'fees',
  Notifications: 'notifications',
  UserManagement: 'users',
  Settings: 'settings',
};

function getTabFromPath(): ErpTab {
  if (typeof window === 'undefined') return 'Dashboard';
  const path = window.location.pathname;
  const base = path.startsWith('/demo-erp') ? '/demo-erp' : '/erp';
  const segment = path.slice(base.length).replace(/^\//, '').split('/')[0];
  const entry = (Object.entries(TAB_TO_PATH) as [ErpTab, string][]).find(([, p]) => p === segment);
  return entry ? entry[0] : 'Dashboard';
}

const TabLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
  </div>
);

function ErpLayoutInner() {
  const { darkMode, toggleDarkMode } = useErpTheme();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ErpTab>(getTabFromPath);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<TabType>('Hồ sơ');

  // Đồng bộ tab với URL (back/forward)
  useEffect(() => {
    const handlePopState = () => setActiveTab(getTabFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTab = (tab: ErpTab) => {
    setActiveTab(tab);
    const suffix = TAB_TO_PATH[tab];
    const path = suffix ? `/erp/${suffix}` : '/erp';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const handleSelectStudent = (student: Student, tab: TabType = 'Hồ sơ') => {
    setSelectedStudent(student);
    setDetailTab(tab);
  };

  const menuItems: { id: ErpTab; name: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'Dashboard', name: 'Tổng quan & Lịch', icon: LayoutDashboard },
    { id: 'Learners', name: 'Quản lý Học viên', icon: Users },
    { id: 'Courses', name: 'Quản lý Khóa học', icon: BookOpen },
    { id: 'Instructors', name: 'Quản lý Giảng viên', icon: GraduationCap },
    { id: 'Resources', name: 'Thiết bị & Tài nguyên', icon: Warehouse },
    { id: 'Exams', name: 'Lịch thi & Kỳ thi', icon: CalendarRange },
    { id: 'Fees', name: 'Học phí & Thanh toán', icon: Wallet },
    { id: 'Notifications', name: 'BOT Thông báo', icon: MessageSquare },
    { id: 'UserManagement', name: 'Quản lý người dùng', icon: Shield, adminOnly: true },
    { id: 'Settings', name: 'Cài đặt & Quản trị', icon: SettingsIcon, adminOnly: true },
  ];

  const visibleMenuItems = menuItems.filter(item => !(item.adminOnly && user?.role === 'user'));

  const handleBackToLegacy = () => {
    window.location.href = '/dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <ErpDashboard />;
      case 'Learners':
        return <ErpLearners onSelectStudent={handleSelectStudent} />;
      case 'Courses':
        return <ErpCourses />;
      case 'Instructors':
        return <ErpInstructors />;
      case 'Resources':
        return <ErpResources />;
      case 'Exams':
        return <ErpExams />;
      case 'Fees':
        return <FeesPage onSelectStudent={handleSelectStudent} />;
      case 'Notifications':
        return <NotificationsPage />;
      case 'UserManagement':
        return <UserManagementPage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <TabLoader />;
    }
  };

  const userInitials = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      darkMode ? "bg-slate-950 text-slate-100" : "bg-brand-bg text-slate-800"
    )}>
      {/* Sidebar - Modern Premium Dark/Glassmorphic Style */}
      <aside className={cn(
        "w-64 border-r flex flex-col flex-shrink-0 transition-all duration-300",
        darkMode
          ? "bg-brand-sidebar text-slate-300 border-white/5 backdrop-blur-md"
          : "bg-white border-slate-200/80 shadow-lg shadow-slate-100"
      )}>
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/25">
              <span className="font-black text-white text-base">iG</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-brand-primary">iGen Unified ERP</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">Phân hệ quản trị</p>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 active:scale-[0.98]",
                  isActive
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : darkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-100/80"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-slate-400")} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer options */}
        <div className="p-4 border-t border-slate-800/20 space-y-2">
          {/* Quick theme toggle */}
          <div className={cn(
            "flex items-center justify-between p-2 rounded-xl text-xs font-bold",
            darkMode ? "bg-slate-800/30" : "bg-slate-100"
          )}>
            <span className="text-slate-400 pl-2">Giao diện</span>
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 transition-all"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Back to Legacy route button */}
          <button
            onClick={handleBackToLegacy}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black border transition-all active:scale-[0.97]",
              darkMode
                ? "border-slate-800 text-slate-300 hover:bg-slate-900"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về giao diện cũ
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className={cn(
          "h-16 px-8 border-b flex items-center justify-between flex-shrink-0 sticky top-0 z-30 backdrop-blur-md",
          darkMode ? "bg-slate-950/80 border-slate-800/80" : "bg-white/80 border-slate-200/80"
        )}>
          <div>
            <h2 className="text-base font-black tracking-tight uppercase">
              {menuItems.find(m => m.id === activeTab)?.name}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 hidden md:block truncate max-w-[220px]">
              {user?.displayName || user?.email || ''}
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary font-black text-xs flex items-center justify-center border border-brand-primary/20">
              {userInitials}
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 max-w-[1500px] w-full mx-auto flex-1">
          <Suspense fallback={<TabLoader />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>

      {/* Student Detail Modal (dùng chung cho Learners & Fees) */}
      {selectedStudent && (
        <Suspense fallback={null}>
          <StudentDetailModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            initialTab={detailTab}
          />
        </Suspense>
      )}

      {/* AI Chatbot Widget */}
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
    </div>
  );
}

export function ErpDemoLayout() {
  return (
    <ErpThemeProvider>
      <ErpLayoutInner />
    </ErpThemeProvider>
  );
}
