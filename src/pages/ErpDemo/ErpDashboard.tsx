import React, { useMemo, useState } from 'react';
import {
  Users, BookOpen, Warehouse, CalendarRange,
  ChevronLeft, ChevronRight, GraduationCap, Wallet
} from 'lucide-react';
import { cn, parseVND } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useExams } from '../../hooks/useExams';
import { useCourses } from '../../hooks/useCourses';
import { useResources } from '../../hooks/useResources';
import { useSchedule } from '../../hooks/useSchedule';
import { ScheduleEvent } from '../../types';
import { useErpTheme } from './ErpThemeContext';
import { ErpStatCard, ErpCard, ErpFilterTab } from '../../components/Erp/ErpUI';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function ErpDashboard() {
  const { darkMode } = useErpTheme();
  const { students } = useStudents();
  const { exams } = useExams();
  const { courses } = useCourses();
  const { resources } = useResources();

  const [selectedType, setSelectedType] = useState<'all' | 'class' | 'exam' | 'resource'>('all');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Khoảng ngày của tháng đang xem — nạp lịch tổng hợp từ server
  const fromDate = useMemo(() => `${year}-${pad2(month + 1)}-01`, [year, month]);
  const toDate = useMemo(() => `${year}-${pad2(month + 1)}-${pad2(daysInMonth)}`, [year, month, daysInMonth]);
  const { events } = useSchedule(fromDate, toDate);

  // ==== Số liệu thật ====
  const activeLearnersCount = students.filter(s => s.status === 'Đang học' || s.status === 'Đang thi').length;
  const activeCoursesCount = courses.filter(c => c.status === 'Hoạt động').length;
  const upcomingExamsCount = exams.filter(e => e.status === 'Sắp diễn ra' || e.status === 'Đã xác nhận').length;
  const availableResources = resources.filter(r => r.status !== 'MAINTENANCE').length;

  const totalCollected = students.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalDebt = students.reduce((sum, s) => {
    const fee = parseInt(parseVND(s.fee) || '0');
    return sum + Math.max(0, fee - (s.paidAmount || 0));
  }, 0);
  const compactVND = (v: number) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + 'đ';

  const stats = [
    { name: 'Học viên Đang học', value: activeLearnersCount, icon: Users, change: `${students.length} tổng hồ sơ`, color: 'from-blue-600 to-cyan-500' },
    { name: 'Khóa học Hoạt động', value: `${activeCoursesCount} khóa`, icon: BookOpen, change: `${courses.length} chương trình`, color: 'from-brand-primary to-cyan-500' },
    { name: 'Tài nguyên sẵn sàng', value: `${availableResources}/${resources.length}`, icon: Warehouse, change: 'Phòng • Xe • Thiết bị', color: 'from-emerald-600 to-teal-500' },
    { name: 'Kỳ thi sắp tới', value: `${upcomingExamsCount} đợt`, icon: CalendarRange, change: `${exams.length} tổng đợt thi`, color: 'from-amber-600 to-orange-500' },
  ];

  // ==== Calendar ====
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Chủ nhật

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

  const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
  const daysArray = Array.from({ length: totalGridCells }, (_, index) => {
    const dayNumber = index - startDayOfWeek + 1;
    const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
    const dateString = isValidDay ? `${year}-${pad2(month + 1)}-${pad2(dayNumber)}` : '';
    return { dayNumber, isValidDay, dateString };
  });

  const filteredEvents = events.filter(evt => selectedType === 'all' || evt.type === selectedType);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const evt of filteredEvents) {
      const list = map.get(evt.date) || [];
      list.push(evt);
      map.set(evt.date, list);
    }
    return map;
  }, [filteredEvents]);

  const todayString = new Date().toISOString().slice(0, 10);
  const upcomingEvents = filteredEvents.filter(e => e.date >= todayString).slice(0, 6);

  const typeStyle = (type: ScheduleEvent['type']) => {
    switch (type) {
      case 'exam':
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case 'resource':
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
    }
  };

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
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-2",
            darkMode ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"
          )}>
            <Wallet className="w-3.5 h-3.5" />
            Đã thu: {compactVND(totalCollected)}
          </div>
          <div className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-2",
            darkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-100 text-rose-600"
          )}>
            <GraduationCap className="w-3.5 h-3.5" />
            Còn nợ: {compactVND(totalDebt)}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <ErpStatCard key={i} name={stat.name} value={stat.value} change={stat.change} icon={stat.icon} color={stat.color} />
        ))}
      </div>

      {/* Calendar + upcoming events */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <ErpCard className="xl:col-span-2 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className={cn("p-2 rounded-xl border transition-all", darkMode ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-600")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className={cn("text-sm font-black capitalize tracking-tight min-w-[140px] text-center", darkMode ? "text-white" : "text-slate-800")}>
                {monthLabel}
              </h3>
              <button
                onClick={nextMonth}
                className={cn("p-2 rounded-xl border transition-all", darkMode ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-600")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ErpFilterTab active={selectedType === 'all'} onClick={() => setSelectedType('all')}>Tất cả</ErpFilterTab>
              <ErpFilterTab active={selectedType === 'exam'} onClick={() => setSelectedType('exam')}>Kỳ thi</ErpFilterTab>
              <ErpFilterTab active={selectedType === 'resource'} onClick={() => setSelectedType('resource')}>Tài nguyên</ErpFilterTab>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 py-2">{day}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, idx) => {
              const dayEvents = day.isValidDay ? (eventsByDate.get(day.dateString) || []) : [];
              const isToday = day.dateString === todayString;
              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[72px] p-1.5 rounded-xl border text-left transition-all",
                    !day.isValidDay && "opacity-0 pointer-events-none",
                    isToday
                      ? "border-brand-primary/50 bg-brand-primary/5"
                      : darkMode ? "border-slate-800/60 hover:border-slate-700" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  {day.isValidDay && (
                    <>
                      <span className={cn(
                        "text-[10px] font-black",
                        isToday ? "text-brand-primary" : darkMode ? "text-slate-400" : "text-slate-500"
                      )}>
                        {day.dayNumber}
                      </span>
                      <div className="space-y-0.5 mt-1">
                        {dayEvents.slice(0, 2).map(evt => (
                          <div
                            key={evt.id}
                            title={`${evt.title} (${evt.time}) — ${evt.details}`}
                            className={cn("px-1.5 py-0.5 rounded-md border text-[8px] font-black truncate", typeStyle(evt.type))}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[8px] font-black text-slate-400 px-1">+{dayEvents.length - 2} sự kiện</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ErpCard>

        {/* Upcoming events list */}
        <ErpCard className="p-6 space-y-4">
          <h3 className={cn("text-sm font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Sự kiện sắp tới</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-8 text-center">
              Không có sự kiện nào trong thời gian tới.<br />
              Tạo đợt thi hoặc đặt lịch tài nguyên để hiển thị tại đây.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(evt => (
                <div
                  key={evt.id}
                  className={cn(
                    "p-3 rounded-2xl border space-y-1",
                    darkMode ? "border-slate-800/60 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-wider", typeStyle(evt.type))}>
                      {evt.type === 'exam' ? 'Kỳ thi' : evt.type === 'resource' ? 'Tài nguyên' : 'Lớp học'}
                    </span>
                    <span className="text-[9px] font-black text-slate-400">
                      {evt.date.split('-').reverse().join('/')} • {evt.time}
                    </span>
                  </div>
                  <p className={cn("text-xs font-black truncate", darkMode ? "text-slate-200" : "text-slate-800")}>{evt.title}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{evt.details}</p>
                </div>
              ))}
            </div>
          )}
        </ErpCard>
      </div>
    </div>
  );
}
