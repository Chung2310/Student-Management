import React, { useState } from 'react';
import { Phone, Mail, Award, GraduationCap, Trash2, RefreshCcw, List, LayoutGrid } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useInstructors } from '../../hooks/useInstructors';
import { Instructor, InstructorStatus } from '../../types';
import { useErpTheme } from './ErpThemeContext';
import {
  ErpPageHeader, ErpPrimaryButton, ErpSearchBar, ErpFilterTab,
  ErpModal, ErpField, ErpInput, ErpSubmitButton,
  ErpEmptyState, ErpLoadingState, ErpCard, ErpTableHead
} from '../../components/Erp/ErpUI';

const AVATAR_BGS = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-fuchsia-600', 'bg-amber-600', 'bg-cyan-600', 'bg-rose-600'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1
    ? parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    : name.substring(0, 2)
  ).toUpperCase();
}

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_BGS[hash % AVATAR_BGS.length];
}

const NEXT_STATUS: Record<InstructorStatus, InstructorStatus> = {
  'Available': 'Busy',
  'Busy': 'On Leave',
  'On Leave': 'Available',
};

const STATUS_LABEL: Record<InstructorStatus, string> = {
  'Available': 'Sẵn sàng',
  'Busy': 'Đang bận',
  'On Leave': 'Nghỉ phép',
};

export function ErpInstructors() {
  const { darkMode } = useErpTheme();
  const { toast } = useToast();
  const { instructors, loading } = useInstructors();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('erp_view_mode_instructors') as 'list' | 'grid') || 'grid';
  });

  const [newInstructor, setNewInstructor] = useState({
    name: '',
    phone: '',
    email: '',
    spec: '',
  });

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructor.name || !newInstructor.phone || !newInstructor.email || !newInstructor.spec) {
      toast.warning('Vui lòng điền đầy đủ các thông tin giảng viên.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/instructors', {
        method: 'POST',
        body: JSON.stringify({
          name: newInstructor.name,
          phone: newInstructor.phone,
          email: newInstructor.email,
          specializations: newInstructor.spec.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      window.dispatchEvent(new Event('instructor-mutation'));
      setShowAddModal(false);
      setNewInstructor({ name: '', phone: '', email: '', spec: '' });
      toast.success('Đã thêm giảng viên mới thành công!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm giảng viên.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCycleStatus = async (ins: Instructor) => {
    const next = NEXT_STATUS[ins.status];
    try {
      await apiFetch(`/instructors/${ins.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      window.dispatchEvent(new Event('instructor-mutation'));
      toast.success(`${ins.name}: chuyển trạng thái "${STATUS_LABEL[next]}".`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật trạng thái.';
      toast.error(msg);
    }
  };

  const handleDelete = async (ins: Instructor) => {
    try {
      await apiFetch(`/instructors/${ins.id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('instructor-mutation'));
      toast.success(`Đã xóa hồ sơ giảng viên ${ins.name}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa giảng viên.';
      toast.error(msg);
    }
  };

  const filteredInstructors = instructors.filter(ins => {
    const matchesSearch = ins.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ins.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ||
                          (statusFilter === 'available' && ins.status === 'Available') ||
                          (statusFilter === 'leave' && ins.status === 'On Leave');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Hồ sơ Giảng viên"
        subtitle="Danh sách đội ngũ giáo viên, chuyên môn giảng dạy & phân công lớp"
        action={
          <ErpPrimaryButton onClick={() => setShowAddModal(true)}>
            Thêm giảng viên mới
          </ErpPrimaryButton>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Tìm giảng viên theo tên hoặc chuyên môn..." />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <ErpFilterTab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Tất cả</ErpFilterTab>
            <ErpFilterTab active={statusFilter === 'available'} onClick={() => setStatusFilter('available')}>Sẵn sàng dạy</ErpFilterTab>
            <ErpFilterTab active={statusFilter === 'leave'} onClick={() => setStatusFilter('leave')}>Đang nghỉ phép</ErpFilterTab>
          </div>

          <div className={cn("flex items-center border p-1 rounded-xl gap-0.5 shrink-0", darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); localStorage.setItem('erp_view_mode_instructors', 'list'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'list' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-855 shadow-sm") 
                  : "text-slate-400 hover:text-slate-600"
              )}
              title="Hiển thị dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('grid'); localStorage.setItem('erp_view_mode_instructors', 'grid'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-855 shadow-sm") 
                  : "text-slate-400 hover:text-slate-600"
              )}
              title="Hiển thị dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List Content */}
      {loading && instructors.length === 0 ? (
        <ErpCard><ErpLoadingState message="Đang tải hồ sơ giảng viên..." /></ErpCard>
      ) : filteredInstructors.length === 0 ? (
        <ErpCard>
          <ErpEmptyState
            icon={GraduationCap}
            title="Chưa có giảng viên nào"
            subtitle="Bấm 'Thêm giảng viên mới' để tạo hồ sơ đầu tiên."
          />
        </ErpCard>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInstructors.map((ins) => (
            <div
              key={ins.id}
              className={cn(
                "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300 group",
                darkMode
                  ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20"
                  : "bg-white border-slate-100 shadow-sm shadow-slate-100/50 hover:border-brand-primary/20"
              )}
            >
              <div className="space-y-4">
                {/* Profile Head */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md flex-shrink-0",
                      getAvatarBg(ins.name)
                    )}>
                      {getInitials(ins.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={cn("text-sm font-black truncate", darkMode ? "text-slate-100" : "text-slate-800")}>{ins.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          ins.status === 'Available' && "bg-emerald-500",
                          ins.status === 'Busy' && "bg-amber-500",
                          ins.status === 'On Leave' && "bg-rose-500",
                        )} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                          {STATUS_LABEL[ins.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCycleStatus(ins)}
                      title="Đổi trạng thái làm việc"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        darkMode ? "text-slate-500 hover:text-brand-primary hover:bg-slate-800" : "text-slate-400 hover:text-brand-primary hover:bg-slate-100"
                      )}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ins)}
                      title="Xóa giảng viên"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        darkMode ? "text-slate-500 hover:text-rose-455 hover:bg-slate-800" : "text-slate-400 hover:text-rose-500 hover:bg-slate-100"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specializations tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {ins.specializations.map((spec, sIdx) => (
                    <span key={sIdx} className={cn("px-2 py-0.5 border rounded-lg text-[9px] font-bold uppercase tracking-wide", darkMode ? "bg-slate-800/80 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600")}>
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Contact info list */}
                <div className={cn("space-y-2 pt-4 border-t text-[10px] font-bold", darkMode ? "border-slate-800/30 text-slate-400" : "border-slate-100 text-slate-500")}>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {ins.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {ins.email}</div>
                </div>
              </div>

              {/* Rating and active classes footer */}
              <div className={cn("flex items-center justify-between pt-4 mt-4 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span className={cn("text-[10px] font-black", darkMode ? "text-slate-200" : "text-slate-700")}>{ins.rating} / 5.0</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/10 px-2 py-1 rounded-xl">
                  Đang dạy: {ins.activeClasses} lớp
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ErpCard className="rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <ErpTableHead columns={['Giảng viên', 'Trạng thái', 'Chuyên môn', 'Liên hệ', 'Đánh giá', 'Quy mô', 'Thao tác']} />
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredInstructors.map((ins) => (
                  <tr key={ins.id} className={cn("transition-colors", darkMode ? "text-slate-350 hover:bg-slate-800/10" : "text-slate-600 hover:bg-slate-50/40")}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0",
                          getAvatarBg(ins.name)
                        )}>
                          {getInitials(ins.name)}
                        </div>
                        <span className="font-black text-sm">{ins.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          ins.status === 'Available' && "bg-emerald-500",
                          ins.status === 'Busy' && "bg-amber-500",
                          ins.status === 'On Leave' && "bg-rose-500",
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {STATUS_LABEL[ins.status]}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {ins.specializations.map((spec, sIdx) => (
                          <span key={sIdx} className={cn("px-2 py-0.5 border rounded-lg text-[8px] font-bold uppercase tracking-wide", darkMode ? "bg-slate-800 border-slate-700/50 text-slate-350" : "bg-slate-50 border-slate-200 text-slate-650")}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5 font-bold">
                      <div>{ins.phone}</div>
                      <div className="text-[10px] text-slate-400">{ins.email}</div>
                    </td>
                    <td className="py-4 px-6 font-bold">
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{ins.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {ins.activeClasses} lớp đang dạy
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCycleStatus(ins)}
                          title="Đổi trạng thái làm việc"
                          className={cn(
                            "p-1.5 rounded-lg transition-colors border cursor-pointer",
                            darkMode ? "text-slate-400 hover:text-brand-primary bg-slate-800 hover:bg-slate-700 border-transparent" : "text-slate-500 hover:text-brand-primary bg-slate-50 hover:bg-slate-100 border-slate-200/60"
                          )}
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ins)}
                          title="Xóa giảng viên"
                          className={cn(
                            "p-1.5 rounded-lg transition-colors border cursor-pointer",
                            darkMode ? "text-slate-450 hover:text-rose-455 bg-slate-800 hover:bg-rose-900/40 border-transparent" : "text-slate-500 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border-slate-200/60"
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ErpCard>
      )}

      {/* Add Instructor Modal */}
      {showAddModal && (
        <ErpModal title="Thêm giảng viên mới" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddInstructor} className="space-y-4">
            <ErpField label="Họ và tên giảng viên">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Minh Thầy"
                value={newInstructor.name}
                onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
              />
            </ErpField>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Số điện thoại">
                <ErpInput
                  type="text"
                  required
                  placeholder="Ví dụ: 0905..."
                  value={newInstructor.phone}
                  onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                />
              </ErpField>
              <ErpField label="Email liên hệ">
                <ErpInput
                  type="email"
                  required
                  placeholder="Ví dụ: thay@igen.vn"
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                />
              </ErpField>
            </div>

            <ErpField label="Chuyên môn (Phân cách bằng dấu phẩy)">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Lý thuyết B2/C, IELTS Speaking, TOEIC"
                value={newInstructor.spec}
                onChange={(e) => setNewInstructor({ ...newInstructor, spec: e.target.value })}
              />
            </ErpField>

            <ErpSubmitButton>{isSubmitting ? 'Đang lưu...' : 'Lưu hồ sơ giảng viên'}</ErpSubmitButton>
          </form>
        </ErpModal>
      )}
    </div>
  );
}
