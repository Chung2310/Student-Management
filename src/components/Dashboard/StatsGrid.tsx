import { Users, Stethoscope, CheckCircle2, FolderIcon, BookOpen, GraduationCap, Trophy, RotateCcw, Wallet } from 'lucide-react';
import { LuxuryCard } from '../ui/LuxuryCard';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../hooks/useAuth';

export function StatsGrid() {
  const { students, loading } = useStudents();
  const { user } = useAuth();

  const mockStats = [
    { label: 'Tổng học viên', value: 15, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Chờ KSK', value: 2, icon: Stethoscope, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Đã KSK', value: 2, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Đã nộp HS', value: 2, icon: FolderIcon, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Đang học', value: 4, icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Đang thi', value: 2, icon: GraduationCap, color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Đã đậu', value: 1, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Thi lại', value: 1, icon: RotateCcw, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Còn nợ học phí', value: 15, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Trạng thái riêng quy trình lái xe — ẩn thẻ khi không có học viên nào mang trạng thái đó
  const DRIVING_STATS = ['Chờ KSK', 'Đã KSK', 'Đã nộp HS'];

  const getRealStats = () => {
    if (!user) return mockStats;

    const hasStatus = (s: (typeof students)[number], st: string) =>
      Array.isArray(s.status) ? s.status.includes(st as (typeof s.status)[number]) : s.status === st;

    const statsMap = {
      'Tổng học viên': students.length,
      'Chờ KSK': students.filter(s => hasStatus(s, 'Chờ KSK')).length,
      'Đã KSK': students.filter(s => hasStatus(s, 'Đã KSK')).length,
      'Đã nộp HS': students.filter(s => hasStatus(s, 'Đã nộp HS')).length,
      'Đang học': students.filter(s => hasStatus(s, 'Đang học')).length,
      'Đang thi': students.filter(s => hasStatus(s, 'Đang thi')).length,
      'Đã đậu': students.filter(s => hasStatus(s, 'Đã đậu')).length,
      'Thi lại': students.filter(s => hasStatus(s, 'Thi lại')).length,
      'Còn nợ học phí': students.filter(s => hasStatus(s, 'Nợ học phí')).length,
    };

    return mockStats
      .map(stat => ({
        ...stat,
        value: statsMap[stat.label as keyof typeof statsMap] ?? 0
      }))
      .filter(stat => !(DRIVING_STATS.includes(stat.label) && stat.value === 0));
  };

  const displayStats = getRealStats();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-9 gap-4">
      {displayStats.map((stat, idx) => (
        <LuxuryCard key={idx} padding="sm" className="flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-105`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 leading-tight">
              {loading && user ? '...' : stat.value}
            </p>
            <p className="text-[10px] font-medium text-slate-500">{stat.label}</p>
          </div>
        </LuxuryCard>
      ))}
    </div>
  );
}
