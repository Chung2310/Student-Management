import { UserPlus, RefreshCcw, Home, ChevronRight, Menu } from 'lucide-react';
import { ViewType } from '../../App';

interface HeaderProps {
  currentView: ViewType;
  onMenuClick: () => void;
}

export function Header({ currentView, onMenuClick }: HeaderProps) {
  const getViewName = (view: ViewType) => {
    const names: Record<ViewType, string> = {
      Dashboard: 'Tổng quan',
      Students: 'Học viên',
      Exams: 'Lịch thi',
      Fees: 'Học phí',
      Results: 'Kết quả kinh doanh',
      Bot: 'BOT Thông báo',
      SettingsAdmin: 'Cài đặt',
      Admin: 'Admin'
    };
    return names[view];
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 shadow-sm active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <Home className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-900 font-semibold">{getViewName(currentView)}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-full transition-all">
          <UserPlus className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-full transition-all">
          <RefreshCcw className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
      </div>
    </header>
  );
}
