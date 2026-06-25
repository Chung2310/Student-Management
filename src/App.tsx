/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Dashboard/Sidebar';
import { Header } from './components/Dashboard/Header';
import { StatsGrid } from './components/Dashboard/StatsGrid';
import { DrivingDashboardTables } from './components/Dashboard/DrivingDashboardTables';
import { AddStudentModal } from './components/Student/AddStudentModal';
import { StudentDetailModal } from './components/Student/StudentDetailModal';
import { LuxuryButton } from './components/ui/LuxuryButton';
import { Plus } from 'lucide-react';
import { Student } from './types';

import { StudentManagement } from './components/Student/StudentManagement';
import { ExamManagement } from './components/Exams/ExamManagement';
import { FeeManagement } from './components/Fees/FeeManagement';
import { NotificationBot } from './components/Notifications/NotificationBot';
import { SettingsView } from './components/Settings/SettingsView';
import { useAuth } from './hooks/useAuth';
import { useRealtimePayment } from './hooks/useRealtimePayment';
import { LoginView } from './components/Auth/LoginView';
import { Loader2 } from 'lucide-react';
import { ChatbotWidget } from './components/Chatbot/ChatbotWidget';
import { cn } from './lib/utils';

export type ViewType = 'Dashboard' | 'Students' | 'Exams' | 'Fees' | 'Bot' | 'SettingsAdmin';

export default function App() {
  const { user, loading } = useAuth();
  useRealtimePayment();
  const [currentView, setCurrentView] = React.useState<ViewType>('Dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const currentDate = new Date();
  const formattedDate = `Thứ Sáu, ${currentDate.getDate()} tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;

  const handleOpenProfile = (student: Student) => {
    setSelectedStudent(student);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Đang nạp hệ thống...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return (
          <>
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tổng quan</h1>
                <p className="text-slate-400 text-sm font-medium mt-1">Hôm nay: {formattedDate}</p>
              </div>
              <LuxuryButton 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg shadow-purple-200"
              >
                <Plus className="w-4 h-4 mr-2" /> Thêm học viên
              </LuxuryButton>
            </section>
            <section><StatsGrid /></section>
            <section><DrivingDashboardTables onSelectStudent={handleOpenProfile} onNavigate={setCurrentView} /></section>
          </>
        );
      case 'Students':
        return (
          <StudentManagement 
            onSelectStudent={handleOpenProfile} 
            onAddStudent={() => setIsAddModalOpen(true)}
          />
        );
      case 'Exams':
        return <ExamManagement />;
      case 'Fees':
        return <FeeManagement />;
      case 'Bot':
        return <NotificationBot />;
      case 'SettingsAdmin':
        return <SettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <p className="text-lg font-bold">Tính năng đang phát triển</p>
            <p className="text-sm">Trang {currentView} sẽ sớm ra mắt.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bg relative">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-0"
      )}>
        <Header 
          currentView={currentView} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {renderView()}
        </main>

        <footer className="p-6 text-center text-slate-400">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            &copy; 2026 IGEN Quản lý học viên Lái xe • Phần mềm quản lý đào tạo & sát hạch
          </p>
        </footer>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleOpenProfile}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
