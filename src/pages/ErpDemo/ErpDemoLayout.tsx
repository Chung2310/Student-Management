import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  Warehouse, CalendarRange, ArrowLeft, Sun, Moon, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Import trực tiếp các trang con trong phân hệ ERP Demo
import { ErpDashboard } from './ErpDashboard';
import { ErpLearners } from './ErpLearners';
import { ErpCourses } from './ErpCourses';
import { ErpInstructors } from './ErpInstructors';
import { ErpResources } from './ErpResources';
import { ErpExams } from './ErpExams';

type ErpTab = 'Dashboard' | 'Learners' | 'Courses' | 'Instructors' | 'Resources' | 'Exams';

export function ErpDemoLayout() {
  const [activeTab, setActiveTab] = useState<ErpTab>('Dashboard');
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { id: 'Dashboard' as ErpTab, name: 'Tổng quan & Lịch', icon: LayoutDashboard },
    { id: 'Learners' as ErpTab, name: 'Quản lý Học viên', icon: Users },
    { id: 'Courses' as ErpTab, name: 'Quản lý Khóa học', icon: BookOpen },
    { id: 'Instructors' as ErpTab, name: 'Quản lý Giảng viên', icon: GraduationCap },
    { id: 'Resources' as ErpTab, name: 'Thiết bị & Tài nguyên', icon: Warehouse },
    { id: 'Exams' as ErpTab, name: 'Lịch thi & Kỳ thi', icon: CalendarRange },
  ];

  const handleBackToLegacy = () => {
    window.location.href = '/dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <ErpDashboard darkMode={darkMode} />;
      case 'Learners':
        return <ErpLearners darkMode={darkMode} />;
      case 'Courses':
        return <ErpCourses darkMode={darkMode} />;
      case 'Instructors':
        return <ErpInstructors darkMode={darkMode} />;
      case 'Resources':
        return <ErpResources darkMode={darkMode} />;
      case 'Exams':
        return <ErpExams darkMode={darkMode} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        );
    }
  };

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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
              onClick={() => setDarkMode(!darkMode)}
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
            Về QL Trường Lái
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
            <span className="text-xs font-bold text-slate-400">Hệ thống ERP Đa Dụng (Bản Demo)</span>
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary font-black text-xs flex items-center justify-center border border-brand-primary/20">
              AD
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 max-w-[1500px] w-full mx-auto flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
