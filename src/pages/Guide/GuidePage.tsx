import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminCenters } from '../../hooks/useAdminCenters';
import { DrivingCenterGuide } from './components/DrivingCenterGuide';
import { GeneralCenterGuide } from './components/GeneralCenterGuide';
import { 
  Sparkles, LayoutDashboard, Users, Stethoscope, 
  TrendingUp, Calendar, Wallet, BookOpen, School, Handshake, 
  Warehouse, Shield, Settings, HelpCircle, ClipboardCheck, Search, X, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { ViewType } from '../../App';

type CenterType = 'driving' | 'general';

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface GuidePageProps {
  selectedCenter?: string;
  onNavigate?: (view: ViewType) => void;
}

export function GuidePage({ selectedCenter = 'all', onNavigate }: GuidePageProps) {
  const { user } = useAuth();
  const { centers } = useAdminCenters();
  
  // Determine active center type automatically
  const activeCenterType = useMemo<CenterType>(() => {
    if (user?.role === 'superadmin' && selectedCenter !== 'all') {
      const matchingCenter = centers.find(c => c.uid === selectedCenter);
      if (matchingCenter && matchingCenter.businessType) {
        return matchingCenter.businessType === 'driving' ? 'driving' : 'general';
      }
    }
    return user?.businessType === 'driving' ? 'driving' : 'general';
  }, [selectedCenter, centers, user]);

  const [activeSection, setActiveSection] = useState<string>('quickstart');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Accordion open/close states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quickstart: true,
    dashboard: true,
  });

  // Sidebar items definitions matching the exact system sidebar
  const sidebarItemsMap: Record<CenterType, SidebarItem[]> = {
    driving: [
      { key: 'quickstart', label: 'Bắt đầu nhanh', icon: Sparkles },
      { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { key: 'students', label: 'Học viên', icon: Users },
      { key: 'exams', label: 'Lịch thi', icon: Calendar },
      { key: 'fees', label: 'Học phí', icon: Wallet },
      { key: 'bot', label: 'BOT Thông báo', icon: MessageSquare },
      { key: 'courses', label: 'Khóa học', icon: BookOpen },
      { key: 'batches', label: 'Lớp & Khai giảng', icon: School },
      { key: 'partners', label: 'Đối tác & CTV', icon: Handshake },
      { key: 'resources', label: 'Thiết bị', icon: Warehouse },
      { key: 'usermanagement', label: 'Quản lý nhân sự', icon: Shield },
      { key: 'settings', label: 'Cài đặt & Quản trị', icon: Settings },
      { key: 'faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
    ],
    general: [
      { key: 'quickstart', label: 'Bắt đầu nhanh', icon: Sparkles },
      { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { key: 'students', label: 'Học viên', icon: Users },
      { key: 'exams', label: 'Lịch thi', icon: Calendar },
      { key: 'fees', label: 'Học phí', icon: Wallet },
      { key: 'bot', label: 'BOT Thông báo', icon: MessageSquare },
      { key: 'courses', label: 'Khóa học', icon: BookOpen },
      { key: 'batches', label: 'Lớp & Khai giảng', icon: School },
      { key: 'partners', label: 'Đối tác & CTV', icon: Handshake },
      { key: 'resources', label: 'Thiết bị', icon: Warehouse },
      { key: 'usermanagement', label: 'Quản lý nhân sự', icon: Shield },
      { key: 'settings', label: 'Cài đặt & Quản trị', icon: Settings },
      { key: 'faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
    ]
  };

  const currentSidebarItems = sidebarItemsMap[activeCenterType];

  // Sync active section when sidebar items or center type changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSection('quickstart');
      setExpandedSections({
        quickstart: true,
        dashboard: true,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCenterType]);

  // Toggle accordion card
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Click sidebar item -> expands and scrolls to the card
  const handleSidebarClick = (key: string) => {
    setActiveSection(key);
    setExpandedSections(prev => ({
      ...prev,
      [key]: true
    }));
    
    const element = document.getElementById(`section-${key}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter sections by search query
  const filteredSidebarItems = useMemo(() => {
    if (!searchQuery.trim()) return currentSidebarItems;
    const query = searchQuery.trim().toLowerCase();
    return currentSidebarItems.filter(item => {
      return item.label.toLowerCase().includes(query) || item.key.includes(query);
    });
  }, [currentSidebarItems, searchQuery]);

  // Quick Start step definitions for Driving
  const drivingSteps = [
    { step: 1, title: 'Quản lý hạng bằng', icon: Settings, desc: 'Cấu hình các hạng bằng đào tạo (A1, B2, C...).', view: 'Students' as ViewType },
    { step: 2, title: 'Tiếp nhận hồ sơ', icon: Users, desc: 'Nhập học viên mới, tải ảnh CCCD 2 mặt.', view: 'Students' as ViewType },
    { step: 3, title: 'Khám sức khỏe', icon: Stethoscope, desc: 'Cập nhật giấy khám sức khỏe đạt tiêu chuẩn.', view: 'Students' as ViewType },
    { step: 4, title: 'Tiến độ học', icon: TrendingUp, desc: 'Theo dõi số km DAT và cabin mô phỏng.', view: 'Students' as ViewType },
    { step: 5, title: 'Kỳ thi & Lịch thi', icon: Calendar, desc: 'Sắp xếp danh sách thi và cập nhật kết quả.', view: 'Exams' as ViewType }
  ];

  // Quick Start step definitions for General (Ngoại ngữ & Đào tạo khác)
  const generalSteps = [
    { step: 1, title: 'Tạo khóa học', icon: BookOpen, desc: 'Đặt tên, học phí và số buổi cho khóa học đầu tiên.', view: 'Courses' as ViewType },
    { step: 2, title: 'Thêm học viên', icon: Users, desc: 'Nhập hồ sơ học viên thủ công hoặc từ Excel.', view: 'Students' as ViewType },
    { step: 3, title: 'Mở lớp học', icon: School, desc: 'Chọn khóa học, gán giáo viên và thêm học viên.', view: 'Batches' as ViewType },
    { step: 4, title: 'Xếp lớp học viên', icon: Handshake, desc: 'Ghi danh các học viên đã tạo ở Bước 2 vào lớp.', view: 'Batches' as ViewType },
    { step: 5, title: 'Điểm danh', icon: ClipboardCheck, desc: 'Điểm danh nhanh buổi học đầu tiên.', view: 'Batches' as ViewType }
  ];

  const currentSteps = activeCenterType === 'driving' ? drivingSteps : generalSteps;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
        
        {/* Header Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hướng dẫn sử dụng</h1>
            <p className="text-xs text-slate-500 mt-1">Tất cả những gì bạn cần biết để vận hành trung tâm.</p>
          </div>
          
          {/* Right Search Input */}
          <div className="relative mt-4 md:mt-0 w-80">
            <input
              type="text"
              placeholder="Tìm kiếm hướng dẫn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-emerald-600 transition-all bg-white"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Navigation Menu (Simple bullet dots, no icons) */}
          <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              NỘI DUNG
            </span>
            <div className="space-y-1.5">
              {filteredSidebarItems.map((item) => {
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSidebarClick(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-all text-left rounded-lg ${
                      isActive 
                        ? 'text-emerald-700 bg-emerald-50/50' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Panel (Stacked Accordion Deck) */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Quick Start Section */}
            {activeSection === 'quickstart' && (
              <div 
                id="section-quickstart" 
                className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden mb-6"
              >
                <div 
                  onClick={() => toggleSection('quickstart')}
                  className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs md:text-sm">🚀 Bắt đầu nhanh</span>
                  </div>
                  {expandedSections.quickstart ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {expandedSections.quickstart && (
                  <div className="border-t border-slate-100 p-6">
                    <p className="text-xs text-slate-500 mb-6">
                      Làm theo các bước sau để làm quen với hệ thống trong 5 phút.
                    </p>

                    {/* Step Timeline Progress */}
                    <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between w-full gap-6 py-4">
                      {/* Horizontal progress bar */}
                      <div className="hidden md:block absolute top-4 left-12 right-12 h-[2px] bg-slate-200 -z-10" />

                      {currentSteps.map((s) => {
                        const StepIcon = s.icon;
                        return (
                          <div key={s.step} className="flex flex-col items-center text-center z-10 md:w-1/5">
                            {/* Step Badge */}
                            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs mb-3 shadow-md shadow-emerald-100">
                              {s.step}
                            </div>
                            
                            {/* Step Icon Box */}
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 mb-3 shadow-inner hover:bg-slate-100 transition-colors">
                              <StepIcon className="w-5 h-5 text-slate-500" />
                            </div>

                            <span className="font-bold text-slate-800 text-xs mb-1">{s.title}</span>
                            <span className="text-slate-400 text-[10px] leading-normal max-w-[130px] mb-2">{s.desc}</span>
                            
                            {onNavigate && (
                              <button
                                onClick={() => onNavigate(s.view)}
                                className="text-emerald-700 hover:text-emerald-800 font-black text-[10px] flex items-center gap-1 cursor-pointer select-none active:scale-95 transition-all mt-auto"
                              >
                                Mở trang <span className="text-[9px]">➜</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Accordion Deck for other sections */}
            {filteredSidebarItems.filter(item => item.key !== 'quickstart').map((item) => {
              const isExpanded = expandedSections[item.key] || false;
              const SectionIcon = item.icon;
              return (
                <div 
                  key={item.key} 
                  id={`section-${item.key}`}
                  className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden"
                >
                  <div 
                    onClick={() => toggleSection(item.key)}
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <SectionIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 text-xs md:text-sm">{item.label}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-6 space-y-4">
                      {activeCenterType === 'driving' ? (
                        <DrivingCenterGuide activeSection={item.key} searchQuery={searchQuery} />
                      ) : (
                        <GeneralCenterGuide activeSection={item.key} searchQuery={searchQuery} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}
export default GuidePage;
