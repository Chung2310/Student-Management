/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Sidebar } from './components/Dashboard/Sidebar';
import { Header } from './components/Dashboard/Header';
import { Student } from './types';

import { useAuth } from './hooks/useAuth';
import { useRealtimePayment } from './hooks/useRealtimePayment';
import { useStudents } from './hooks/useStudents';
import { Loader2 } from 'lucide-react';
import { cn, toSlug } from './lib/utils';

// Helper wrapper to handle dynamic import (chunk load) failures after server updates
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const result = await importFn();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('chunk-load-reload');
      }
      return result;
    } catch (error) {
      console.error("Lỗi tải module/chunk:", error);
      if (typeof window !== 'undefined') {
        const hasReloaded = sessionStorage.getItem('chunk-load-reload');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk-load-reload', 'true');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}

// Lazy load pages
const LoginPage = lazyWithRetry(() => import('./pages/Auth/LoginPage').then(m => ({ default: m.LoginPage })));
const LandingPage = lazyWithRetry(() => import('./pages/Landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LookupPage = lazyWithRetry(() => import('./pages/Lookup/LookupPage').then(m => ({ default: m.LookupPage })));
const PrivacyPolicyPage = lazyWithRetry(() => import('./pages/Legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazyWithRetry(() => import('./pages/Legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const DashboardPage = lazyWithRetry(() => import('./pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const StudentsPage = lazyWithRetry(() => import('./pages/Students/StudentsPage').then(m => ({ default: m.StudentsPage })));
const ExamsPage = lazyWithRetry(() => import('./pages/Exams/ExamsPage').then(m => ({ default: m.ExamsPage })));
const FeesPage = lazyWithRetry(() => import('./pages/Fees/FeesPage').then(m => ({ default: m.FeesPage })));
const NotificationsPage = lazyWithRetry(() => import('./pages/Notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const UserManagementPage = lazyWithRetry(() => import('./pages/UserManagement/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const SettingsPage = lazyWithRetry(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Lazy load modals and heavy widgets
const AddStudentModal = lazyWithRetry(() => import('./components/Student/AddStudentModal').then(m => ({ default: m.AddStudentModal })));
const StudentDetailModal = lazyWithRetry(() => import('./components/Student/StudentDetailModal').then(m => ({ default: m.StudentDetailModal })));
const ChatbotWidget = lazyWithRetry(() => import('./components/Chatbot/ChatbotWidget').then(m => ({ default: m.ChatbotWidget })));

const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center">
    <Loader2 className="w-10 h-10 text-cyan-600 animate-spin mb-3" />
    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider animate-pulse">Đang tải trang...</p>
  </div>
);

export type ViewType = 'Dashboard' | 'Students' | 'Exams' | 'Fees' | 'Bot' | 'UserManagement' | 'SettingsAdmin';
export type TabType = 'Hồ sơ' | 'KSK' | 'Tiến độ học' | 'Lịch thi & KQ' | 'Học phí' | 'Lịch sử' | 'Trợ lý AI';

export default function App() {
  const { user, loading } = useAuth();
  useRealtimePayment();
  const { students } = useStudents();
  
  const [currentPath, setCurrentPath] = React.useState(() => typeof window !== 'undefined' ? window.location.pathname : '/');

  // Helper to parse current path to ViewType
  const getViewFromPath = (): ViewType => {
    if (typeof window === 'undefined') return 'Dashboard';
    const path = window.location.pathname;
    if (path.startsWith('/students')) return 'Students';
    if (path.startsWith('/exams')) return 'Exams';
    if (path.startsWith('/fees')) return 'Fees';
    if (path.startsWith('/bot')) return 'Bot';
    if (path.startsWith('/user-management')) return 'UserManagement';
    if (path.startsWith('/settings')) return 'SettingsAdmin';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    return 'Dashboard';
  };

  const [currentView, setCurrentView] = React.useState<ViewType>(getViewFromPath);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [initialTab, setInitialTab] = React.useState<TabType>('Hồ sơ');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const currentDate = new Date();
  const formattedDate = `Thứ Sáu, ${currentDate.getDate()} tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;

  const navigateTo = (newPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newPath);
      setCurrentPath(newPath);
      setCurrentView(getViewFromPath());
    }
  };

  const updateUrlForView = (view: ViewType, studentSlug?: string) => {
    if (typeof window === 'undefined') return;
    let path = '/dashboard';
    if (view === 'Students') {
      path = studentSlug ? `/students/${studentSlug}` : '/students';
    } else if (view === 'Exams') path = '/exams';
    else if (view === 'Fees') path = '/fees';
    else if (view === 'Bot') path = '/bot';
    else if (view === 'UserManagement') path = '/user-management';
    else if (view === 'SettingsAdmin') path = '/settings';
    else if (view === 'Dashboard') path = '/dashboard';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
      setCurrentPath(path);
    }
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    updateUrlForView(view);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleOpenProfile = (student: Student, tab: TabType = 'Hồ sơ') => {
    setSelectedStudent(student);
    setInitialTab(tab);
    const slug = student.slug || toSlug(student.fullName);
    updateUrlForView('Students', slug);
  };

  const handleCloseProfile = () => {
    setSelectedStudent(null);
    updateUrlForView(currentView);
  };

  // Redirect logged-in users from / or /login to /dashboard
  React.useEffect(() => {
    if (user && (window.location.pathname === '/' || window.location.pathname === '/login')) {
      window.history.replaceState(null, '', '/dashboard');
      setTimeout(() => {
        setCurrentPath('/dashboard');
        setCurrentView('Dashboard');
      }, 0);
    }
  }, [user]);

  // Synchronize history navigation (back/forward buttons)
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath());
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle deep-linked student slugs
  React.useEffect(() => {
    if (loading || students.length === 0) return;
    const path = window.location.pathname;
    if (path.startsWith('/students/')) {
      const slug = path.replace('/students/', '');
      if (slug) {
        const found = students.find(s => (s.slug || toSlug(s.fullName)) === slug);
        if (found) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedStudent(found);
        }
      }
    }
  }, [students, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Đang nạp hệ thống...</p>
      </div>
    );
  }

  const isPrivacyPath = currentPath.startsWith('/privacy');
  const isTermsPath = currentPath.startsWith('/terms');
  const isLookupPath = currentPath.startsWith('/lookup');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo(user ? '/dashboard' : '/');
    }
  };

  if (isPrivacyPath || isTermsPath || isLookupPath) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Đang tải...</p>
        </div>
      }>
        {isPrivacyPath ? (
          <PrivacyPolicyPage onBack={handleBack} />
        ) : isTermsPath ? (
          <TermsOfServicePage onBack={handleBack} />
        ) : (
          <LookupPage onBack={handleBack} />
        )}
      </Suspense>
    );
  }

  if (!user) {
    const isLoginPath = currentPath.startsWith('/login');

    return (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Đang tải...</p>
        </div>
      }>
        {isLoginPath ? (
          <LoginPage onNavigateToPath={navigateTo} />
        ) : (
          <LandingPage 
            onNavigateToLogin={() => navigateTo('/login')} 
            onNavigateToPath={navigateTo}
          />
        )}
      </Suspense>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return (
          <DashboardPage 
            formattedDate={formattedDate}
            onAddStudent={() => setIsAddModalOpen(true)}
            onSelectStudent={handleOpenProfile}
            onNavigate={handleViewChange}
          />
        );
      case 'Students':
        return (
          <StudentsPage 
            onSelectStudent={handleOpenProfile} 
            onAddStudent={() => setIsAddModalOpen(true)}
          />
        );
      case 'Exams':
        return <ExamsPage />;
      case 'Fees':
        return <FeesPage onSelectStudent={handleOpenProfile} />;
      case 'Bot':
        return <NotificationsPage />;
      case 'UserManagement':
        return <UserManagementPage />;
      case 'SettingsAdmin':
        return <SettingsPage />;
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
        onViewChange={handleViewChange} 
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
          <Suspense fallback={<PageLoader />}>
            {renderView()}
          </Suspense>
        </main>

        <footer className="p-6 text-center text-slate-400">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            &copy; 2026 IGEN • Hệ thống Quản lý Đào tạo & Học viên thông minh
          </p>
        </footer>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <Suspense fallback={null}>
          <AddStudentModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleOpenProfile}
          />
        </Suspense>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Suspense fallback={null}>
          <StudentDetailModal
            student={selectedStudent}
            onClose={handleCloseProfile}
            initialTab={initialTab}
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
