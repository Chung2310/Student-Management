import React from 'react';
import { StatsGrid } from '../../components/Dashboard/StatsGrid';
import { ScheduleCalendar } from '../../components/Dashboard/ScheduleCalendar';
import { DrivingDashboardTables } from '../../components/Dashboard/DrivingDashboardTables';
import { LuxuryButton } from '../../components/ui/LuxuryButton';
import { Plus } from 'lucide-react';
import { Student } from '../../types';

interface DashboardPageProps {
  formattedDate: string;
  onAddStudent: () => void;
  onSelectStudent: (student: Student) => void;
  onNavigate: (view: string) => void;
  selectedCenter?: string;
}

export function DashboardPage({ formattedDate, onAddStudent, onSelectStudent, onNavigate, selectedCenter }: DashboardPageProps) {
  return (
    <>
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tổng quan</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Hôm nay: {formattedDate}</p>
        </div>
        <LuxuryButton 
          onClick={onAddStudent}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg shadow-purple-200"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm học viên
        </LuxuryButton>
      </section>
      <section><StatsGrid selectedCenter={selectedCenter} /></section>
      <section><ScheduleCalendar selectedCenter={selectedCenter} /></section>
      <section><DrivingDashboardTables onSelectStudent={onSelectStudent} onNavigate={onNavigate} selectedCenter={selectedCenter} /></section>
    </>
  );
}
