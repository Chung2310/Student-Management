import React, { Suspense, lazy, useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { Mail, Phone, Calendar, Banknote, ShieldAlert, List, LayoutGrid } from 'lucide-react';
import { cn, parseVND } from '../../lib/utils';
import { Student } from '../../types';
import { TabType } from '../../App';
import { useErpTheme } from './ErpThemeContext';
import {
  ErpCard, ErpPageHeader, ErpPrimaryButton, ErpSearchBar,
  ErpFilterTab, ErpEmptyState, ErpLoadingState, ErpTableHead
} from '../../components/Erp/ErpUI';

const AddStudentModal = lazy(() => import('../../components/Student/AddStudentModal').then(m => ({ default: m.AddStudentModal })));

interface ErpLearnersProps {
  onSelectStudent: (student: Student, tab?: TabType) => void;
}

export function ErpLearners({ onSelectStudent }: ErpLearnersProps) {
  const { darkMode } = useErpTheme();
  const { students, loading } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('erp_view_mode_learners') as 'list' | 'grid') || 'list';
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.phone.includes(searchTerm) ||
                          (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && (s.status === 'Đang học' || s.status === 'Đang thi')) ||
                          (statusFilter === 'debt' && (s.paidAmount || 0) < parseInt(parseVND(s.fee) || '0')) ||
                          (statusFilter === 'inactive' && (s.status === 'Nghỉ học'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Quản lý Học viên"
        subtitle="Tra cứu thông tin hồ sơ, tiến độ đào tạo & học phí của học viên"
        action={
          <ErpPrimaryButton onClick={() => setShowAddModal(true)}>
            Thêm học viên mới
          </ErpPrimaryButton>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Tìm học viên bằng tên, số điện thoại hoặc email..."
        />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <ErpFilterTab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Tất cả</ErpFilterTab>
            <ErpFilterTab active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Đang học tập</ErpFilterTab>
            <ErpFilterTab active={statusFilter === 'debt'} onClick={() => setStatusFilter('debt')}>Còn nợ học phí</ErpFilterTab>
            <ErpFilterTab active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>Nghỉ học</ErpFilterTab>
          </div>

          <div className={cn("flex items-center border p-1 rounded-xl gap-0.5 shrink-0", darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); localStorage.setItem('erp_view_mode_learners', 'list'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'list' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-850 shadow-sm") 
                  : "text-slate-400 hover:text-slate-650"
              )}
              title="Hiển thị dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('grid'); localStorage.setItem('erp_view_mode_learners', 'grid'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-850 shadow-sm") 
                  : "text-slate-400 hover:text-slate-655"
              )}
              title="Hiển thị dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List content */}
      {loading && students.length === 0 ? (
        <ErpCard><ErpLoadingState message="Đang tải hồ sơ học viên..." /></ErpCard>
      ) : filteredStudents.length === 0 ? (
        <ErpCard>
          <ErpEmptyState
            icon={ShieldAlert}
            title="Không tìm thấy học viên nào"
            subtitle="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn."
          />
        </ErpCard>
      ) : viewMode === 'list' ? (
        <ErpCard className="rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <ErpTableHead columns={['Thông tin học viên', 'Hạng học/Khóa', 'Cơ sở/Khu vực', 'Tài chính', 'Trạng thái', 'Đăng ký']} />
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredStudents.map((student) => {
                  const totalFee = parseInt(parseVND(student.fee) || '0');
                  const debt = Math.max(0, totalFee - (student.paidAmount || 0));
                  const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(student.paidAmount || 0);
                  const formattedDebt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelectStudent(student)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        darkMode ? "hover:bg-slate-800/10 text-slate-300" : "hover:bg-slate-50/40 text-slate-600"
                      )}
                    >
                      {/* Name & Contact Info */}
                      <td className="py-4 px-6 space-y-1">
                        <div className={cn("font-black text-sm", darkMode ? "text-slate-200" : "text-slate-800")}>{student.fullName}</div>
                        <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-450" /> {student.phone}</span>
                          {student.email && (
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-450" /> {student.email}</span>
                          )}
                        </div>
                      </td>

                      {/* Course / License Rank */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-xl bg-brand-primary/10 text-brand-primary font-black border border-brand-primary/15 uppercase tracking-wide">
                          Khóa hạng {student.rank}
                        </span>
                      </td>

                      {/* Area */}
                      <td className="py-4 px-6 font-bold">
                        {student.area}
                      </td>

                      {/* Finance */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã nộp: {formattedPaid}</span>
                        </div>
                        {debt > 0 ? (
                          <div className="text-rose-500 font-bold text-[10px]">
                            Còn nợ: {formattedDebt}
                          </div>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50/10 px-1.5 py-0.5 rounded-md">
                            Đã đóng đủ
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border shadow-sm",
                          student.status === 'Đang học' || student.status === 'Đang thi' || student.status === 'Đã đậu'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : student.status === 'Nghỉ học'
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {student.status}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {student.registrationDate}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ErpCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const totalFee = parseInt(parseVND(student.fee) || '0');
            const debt = Math.max(0, totalFee - (student.paidAmount || 0));
            const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(student.paidAmount || 0);
            const formattedDebt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt);

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={cn(
                  "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300 group cursor-pointer",
                  darkMode
                    ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20"
                    : "bg-white border-slate-100 hover:border-brand-primary/20 shadow-sm shadow-slate-100/50"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 flex items-center justify-center text-xs font-black">
                      {student.fullName.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border shadow-sm",
                      student.status === 'Đang học' || student.status === 'Đang thi' || student.status === 'Đã đậu'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : student.status === 'Nghỉ học'
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {student.status}
                    </span>
                  </div>

                  <h4 className={cn("text-sm font-black line-clamp-1 transition-colors", darkMode ? "text-slate-100 group-hover:text-white" : "text-slate-850 group-hover:text-slate-950")}>
                    {student.fullName}
                  </h4>

                  <div className={cn("grid grid-cols-2 gap-y-3 gap-x-2 pt-2 text-[10px] font-bold border-t", darkMode ? "text-slate-400 border-slate-800/30" : "text-slate-550 border-slate-100")}>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-450" /> {student.phone}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-450" /> {student.registrationDate}</div>
                    <div className="flex items-center gap-1.5 col-span-2 text-emerald-600">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Đã nộp: {formattedPaid}
                    </div>
                    {debt > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2 text-rose-500 font-bold">
                        Còn nợ: {formattedDebt}
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn("flex items-center justify-between pt-4 mt-2 border-t text-[10px] font-bold text-slate-400", darkMode ? "border-slate-800/30" : "border-slate-100")}>
                  <span>Khu vực: {student.area}</span>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/15">
                    Hạng {student.rank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Learner Modal */}
      {showAddModal && (
        <Suspense fallback={null}>
          <AddStudentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={(student) => {
              setShowAddModal(false);
              onSelectStudent(student);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
