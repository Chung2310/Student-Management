import React, { useState } from 'react';
import { 
  Users, BookOpen, Warehouse, CalendarRange, 
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'class' | 'exam' | 'resource';
  date: string; // YYYY-MM-DD
  time: string;
  details: string;
}

export function ErpDashboard({ darkMode = false }: { darkMode?: boolean }) {
  const { students } = useStudents();
  const [selectedType, setSelectedType] = useState<'all' | 'class' | 'exam' | 'resource'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1)); // Tháng 7 năm 2026

  // Mapped learners count from real database
  const activeLearnersCount = students.filter(s => s.status === 'Đang học' || s.status === 'Đang thi').length || 120;

  // Mock generic ERP statistics
  const stats = [
    { name: 'Học viên Đang học', value: activeLearnersCount, icon: Users, change: '+12%', color: 'from-blue-600 to-cyan-500' },
    { name: 'Khóa học Đang chạy', value: '18 khóa', icon: BookOpen, change: 'Hoạt động', color: 'from-brand-primary to-cyan-500' },
    { name: 'Tài nguyên sử dụng', value: '82%', icon: Warehouse, change: 'Tốt', color: 'from-emerald-600 to-teal-500' },
    { name: 'Kỳ thi sắp tới', value: '5 đợt', icon: CalendarRange, change: 'Trong tuần', color: 'from-amber-600 to-orange-500' },
  ];

  // Calendar events data (combination of generic English center, Driving school, and resources)
  const [events] = useState<CalendarEvent[]>([
    // Classes
    { id: '1', title: 'Lớp Tiếng Anh IELTS Speaking 7.0', type: 'class', date: '2026-07-02', time: '18:30 - 20:30', details: 'Phòng Lab 102 - Giảng viên: Ms. Sarah' },
    { id: '2', title: 'Lớp Kỹ năng thuyết trình Batch 5', type: 'class', date: '2026-07-06', time: '14:00 - 16:30', details: 'Phòng học 301 - Giảng viên: Mr. David' },
    { id: '3', title: 'Thực hành sa hình B2 (Khóa K32)', type: 'class', date: '2026-07-10', time: '08:00 - 11:30', details: 'Sân thực hành số 2 - Xe Toyota Vios #08' },
    { id: '4', title: 'Lớp Lập trình React cơ bản', type: 'class', date: '2026-07-15', time: '19:00 - 21:00', details: 'Phòng máy tính 204 - Giảng viên: Thầy Nam' },
    // Exams
    { id: '5', title: 'Thi thử IELTS Mock Test (Nghe - Đọc)', type: 'exam', date: '2026-07-05', time: '09:00 - 12:00', details: 'Học viên đăng ký tự do - Phòng Lab 101' },
    { id: '6', title: 'Thi tốt nghiệp khóa B2-K31', type: 'exam', date: '2026-07-12', time: '07:30 - 17:00', details: 'Sân thi sát hạch trung tâm - 45 học viên' },
    { id: '7', title: 'Thi kết thúc môn Lập trình Web', type: 'exam', date: '2026-07-20', time: '14:00 - 16:00', details: 'Phòng máy 204 - Giảng viên gác thi: Cô Lan' },
    // Resources
    { id: '8', title: 'Bảo dưỡng Xe Vios tập lái #03', type: 'resource', date: '2026-07-04', time: '08:00 - 17:00', details: 'Xưởng dịch vụ kỹ thuật trung tâm' },
    { id: '9', title: 'Thầy Cường mượn Máy chiếu Projector B', type: 'resource', date: '2026-07-08', time: '13:30 - 17:00', details: 'Dạy lớp Kỹ năng mềm - Phòng 301' },
    { id: '10', title: 'Cô Linh đăng ký Phòng Lab 102', type: 'resource', date: '2026-07-15', time: '08:00 - 11:30', details: 'Dạy bổ trợ kỹ năng Speaking IELTS' },
  ]);

  // Calendar logic helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  // Generate blank grids + day grids
  const totalGridCells = 35; // 5 weeks standard
  const daysArray = Array.from({ length: totalGridCells }, (_, index) => {
    const dayNumber = index - startDayOfWeek + 1;
    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
    const dateString = isValidDay 
      ? `2026-07-${dayNumber.toString().padStart(2, '0')}`
      : '';
    return { dayNumber, isValidDay, dateString };
  });

  const filteredEvents = events.filter(evt => {
    if (selectedType !== 'all' && evt.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Banner */}
      <div className={cn(
        "p-6 rounded-[2rem] flex items-center justify-between border transition-all duration-300",
        darkMode 
          ? "bg-gradient-to-r from-brand-sidebar/40 to-cyan-900/40 border-brand-primary/20 text-white backdrop-blur-md" 
          : "bg-white border-slate-200/80 shadow-sm shadow-slate-100/50 text-slate-800"
      )}>
        <div>
          <h1 className={cn("text-xl font-black tracking-tight mb-1", darkMode ? "text-white" : "text-slate-800")}>iGen Unified ERP Dashboard</h1>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Xem trực quan hiệu năng quản trị đào tạo đa dụng.</p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border",
          darkMode 
            ? "bg-brand-primary/20 border-brand-primary/30 text-brand-primary" 
            : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
        )}>
          Chế độ Demo hoạt động
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={cn(
              "p-6 rounded-[2rem] border flex items-center justify-between group transition-all duration-300",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/30" 
                : "bg-white border-slate-100 shadow-sm shadow-slate-100/50 hover:border-brand-primary/30"
            )}>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                <h3 className={cn("text-2xl font-black", darkMode ? "text-white" : "text-slate-850")}>{stat.value}</h3>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">{stat.change}</span>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300",
                stat.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Main Interactive Calendar View */}
        <div className={cn(
          "xl:col-span-2 p-8 rounded-[2.5rem] border space-y-6 transition-all duration-300",
          darkMode 
            ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md" 
            : "bg-white border-slate-100 shadow-sm shadow-slate-100/50"
        )}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Lịch biểu tích hợp</h3>
              <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Đồng bộ lịch học, thi và đặt tài nguyên</p>
            </div>
            
            {/* Calendar Controls */}
            <div className="flex items-center gap-3">
              <button 
                onClick={prevMonth}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-90",
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={cn("text-xs font-black uppercase tracking-wider min-w-[120px] text-center", darkMode ? "text-white" : "text-slate-800")}>
                {monthLabel}
              </span>
              <button 
                onClick={nextMonth}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-90",
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Event Filter buttons */}
          <div className={cn("flex flex-wrap items-center gap-2 pt-2 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                selectedType === 'all' 
                  ? (darkMode ? "bg-white text-slate-950 font-black" : "bg-slate-900 text-white font-black") 
                  : (darkMode ? "bg-slate-800/50 text-slate-400 hover:bg-slate-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedType('class')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                selectedType === 'class' 
                  ? "bg-blue-600 text-white font-black border-blue-600" 
                  : (darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100")
              )}
            >
              Lớp học
            </button>
            <button
              onClick={() => setSelectedType('exam')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                selectedType === 'exam' 
                  ? "bg-rose-600 text-white font-black border-rose-600" 
                  : (darkMode ? "bg-rose-50/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100")
              )}
            >
              Kỳ thi
            </button>
            <button
              onClick={() => setSelectedType('resource')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                selectedType === 'resource' 
                  ? "bg-brand-primary text-white font-black border-brand-primary" 
                  : (darkMode ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20" : "bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100")
              )}
            >
              Tài nguyên
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {/* Days header */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
              <span key={idx} className={cn("text-[10px] font-black uppercase tracking-widest py-2", darkMode ? "text-slate-500" : "text-slate-400")}>
                {day}
              </span>
            ))}

            {/* Days block */}
            {daysArray.map((day, idx) => {
              const dayEvents = day.isValidDay
                ? filteredEvents.filter(e => e.date === day.dateString)
                : [];
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "min-h-[85px] p-2 rounded-2xl border transition-all flex flex-col items-start gap-1 justify-between",
                    day.isValidDay 
                      ? (darkMode 
                          ? "bg-slate-900/30 border-slate-800/40 hover:border-slate-700" 
                          : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200")
                      : "bg-transparent border-transparent opacity-10"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                    dayEvents.length > 0 
                      ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/15" 
                      : (darkMode ? "text-slate-400" : "text-slate-500")
                  )}>
                    {day.isValidDay ? day.dayNumber : ''}
                  </span>
                  
                  {/* Event Indicators */}
                  <div className="w-full space-y-1">
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id}
                        className={cn(
                          "text-[8px] font-black p-1 rounded-lg truncate w-full text-left border uppercase tracking-wider",
                          evt.type === 'class' && (darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/15" : "bg-blue-50 text-blue-600 border-blue-100"),
                          evt.type === 'exam' && (darkMode ? "bg-rose-500/10 text-rose-400 border-rose-500/15" : "bg-rose-50 text-rose-600 border-rose-100"),
                          evt.type === 'resource' && (darkMode ? "bg-brand-primary/10 text-brand-primary border-brand-primary/15" : "bg-cyan-50 text-cyan-600 border-cyan-100"),
                        )}
                        title={`${evt.title} (${evt.time})`}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events & Quick stats list */}
        <div className={cn(
          "p-8 rounded-[2.5rem] border space-y-6 transition-all duration-300",
          darkMode 
            ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md" 
            : "bg-white border-slate-100 shadow-sm shadow-slate-100/50"
        )}>
          <div>
            <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-855")}>Kế hoạch chi tiết</h3>
            <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Danh sách các sự kiện trong tháng 7/2026</p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredEvents.map(evt => (
              <div 
                key={evt.id} 
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-start gap-4",
                  evt.type === 'class' && (darkMode ? "bg-blue-500/5 border-blue-500/10 hover:border-blue-500/20" : "bg-blue-50/20 border-blue-100/50 hover:border-blue-200 text-slate-800"),
                  evt.type === 'exam' && (darkMode ? "bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20" : "bg-rose-50/20 border-rose-100/50 hover:border-rose-200 text-slate-800"),
                  evt.type === 'resource' && (darkMode ? "bg-brand-primary/5 border-brand-primary/10 hover:border-brand-primary/20" : "bg-cyan-50/20 border-cyan-100/50 hover:border-cyan-200 text-slate-800"),
                )}
              >
                {/* Visual Icon indicator */}
                <div className={cn(
                  "p-2 rounded-xl flex-shrink-0 mt-0.5",
                  evt.type === 'class' && (darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-600"),
                  evt.type === 'exam' && (darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-100 text-rose-600"),
                  evt.type === 'resource' && (darkMode ? "bg-brand-primary/10 text-brand-primary" : "bg-cyan-100 text-cyan-600"),
                )}>
                  {evt.type === 'class' ? <BookOpen className="w-3.5 h-3.5" /> : evt.type === 'exam' ? <CalendarRange className="w-3.5 h-3.5" /> : <Warehouse className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {evt.date} · {evt.time}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      evt.type === 'class' && (darkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"),
                      evt.type === 'exam' && (darkMode ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"),
                      evt.type === 'resource' && (darkMode ? "bg-brand-primary/20 text-brand-primary" : "bg-cyan-100 text-cyan-700"),
                    )}>
                      {evt.type === 'class' ? 'Lớp học' : evt.type === 'exam' ? 'Kỳ thi' : 'Tài nguyên'}
                    </span>
                  </div>
                  <h4 className={cn("text-xs font-black line-clamp-1", darkMode ? "text-slate-200" : "text-slate-800")}>{evt.title}</h4>
                  <p className={cn("text-[10px] font-bold line-clamp-1", darkMode ? "text-slate-400" : "text-slate-500")}>{evt.details}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick status report footer */}
          <div className={cn("pt-4 border-t space-y-3", darkMode ? "border-slate-800/30" : "border-slate-200")}>
            <div className={cn("flex items-center justify-between text-xs font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Xe tập lái hoạt động
              </span>
              <span className={cn("font-black", darkMode ? "text-white" : "text-slate-800")}>12/15 chiếc</span>
            </div>
            <div className={cn("flex items-center justify-between text-xs font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Phòng học khả dụng
              </span>
              <span className={cn("font-black", darkMode ? "text-white" : "text-slate-800")}>4/5 phòng</span>
            </div>
            <div className={cn("flex items-center justify-between text-xs font-bold", darkMode ? "text-slate-300" : "text-slate-600")}>
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Giảng viên đang nghỉ phép
              </span>
              <span className={cn("font-black", darkMode ? "text-white" : "text-slate-800")}>2 người</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
