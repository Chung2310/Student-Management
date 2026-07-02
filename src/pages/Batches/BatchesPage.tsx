import React, { useState } from 'react';
import {
  School, Trash2, Pencil, Users, UserPlus, X, GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useBatches } from '../../hooks/useBatches';
import { useCourses } from '../../hooks/useCourses';
import { useInstructors } from '../../hooks/useInstructors';
import { useStudents } from '../../hooks/useStudents';
import { Batch, BatchStatus } from '../../types';
import {
  ErpPageHeader, ErpPrimaryButton, ErpSearchBar, ErpFilterTab,
  ErpModal, ErpField, ErpInput, ErpSelect, ErpSubmitButton,
  ErpEmptyState, ErpLoadingState, ErpCard, ErpConfirmModal, ErpTableHead
} from '../../components/Erp/ErpUI';

const BATCH_STATUSES: BatchStatus[] = ['Sắp khai giảng', 'Đang học', 'Đã kết thúc'];

// Thứ trong tuần theo giá trị getDay(): 0 = CN ... 6 = T7, hiển thị theo thứ tự T2 → CN
const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const formatDays = (days: number[]) =>
  DAY_OPTIONS.filter(d => days.includes(d.value)).map(d => d.label).join(', ');

const formatDate = (d: string) => (d ? d.split('-').reverse().join('/') : '');

const statusStyle = (status: BatchStatus) => {
  if (status === 'Đang học') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/15";
  if (status === 'Sắp khai giảng') return "bg-sky-500/10 text-sky-400 border-sky-500/15";
  return "bg-slate-500/10 text-slate-400 border-slate-500/15";
};

interface BatchForm {
  code: string;
  courseId: string;
  instructorId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  location: string;
  startDate: string;
  endDate: string;
  status: BatchStatus;
}

const EMPTY_FORM: BatchForm = {
  code: '',
  courseId: '',
  instructorId: '',
  daysOfWeek: [],
  startTime: '18:00',
  endTime: '20:00',
  location: '',
  startDate: '',
  endDate: '',
  status: 'Sắp khai giảng',
};

/** Bắn sự kiện để các hook liên quan tự refetch (lớp, khóa học, giảng viên, lịch) */
const notifyBatchMutation = () => {
  window.dispatchEvent(new Event('batch-mutation'));
  window.dispatchEvent(new Event('course-mutation'));
  window.dispatchEvent(new Event('instructor-mutation'));
};

export function BatchesPage() {
  const darkMode = false;
  const { toast } = useToast();
  const { batches, loading } = useBatches();
  const { courses } = useCourses();
  const { instructors } = useInstructors();
  const { students } = useStudents();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BatchForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manageLearnersId, setManageLearnersId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; code: string }>({
    isOpen: false,
    id: '',
    code: '',
  });

  // Lấy bản mới nhất từ danh sách để modal học viên không bị dữ liệu cũ sau refetch
  const manageBatch = manageLearnersId ? batches.find(b => b.id === manageLearnersId) : undefined;

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, courseId: courses[0]?.id || '' });
    setShowFormModal(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingId(batch.id);
    setForm({
      code: batch.code,
      courseId: batch.courseId,
      instructorId: batch.instructorId || '',
      daysOfWeek: batch.daysOfWeek,
      startTime: batch.startTime,
      endTime: batch.endTime,
      location: batch.location || '',
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
    });
    setShowFormModal(true);
  };

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.courseId || !form.startDate || !form.endDate) {
      toast.error('Vui lòng nhập đầy đủ thông tin lớp học.');
      return;
    }
    if (form.daysOfWeek.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày học trong tuần.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, code: form.code.toUpperCase() };
      if (editingId) {
        await apiFetch(`/batches/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success(`Đã cập nhật lớp ${payload.code}.`);
      } else {
        await apiFetch('/batches', { method: 'POST', body: JSON.stringify(payload) });
        toast.success(`Đã mở lớp ${payload.code} thành công!`);
      }
      notifyBatchMutation();
      setShowFormModal(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu lớp học.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (batch: Batch, status: BatchStatus) => {
    try {
      await apiFetch(`/batches/${batch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      notifyBatchMutation();
      toast.success(`Lớp ${batch.code} đã chuyển sang "${status}".`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật trạng thái.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiFetch(`/batches/${deleteConfirm.id}`, { method: 'DELETE' });
      notifyBatchMutation();
      toast.success(`Đã xóa lớp ${deleteConfirm.code}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa lớp.';
      toast.error(msg);
    } finally {
      setDeleteConfirm({ isOpen: false, id: '', code: '' });
    }
  };

  const handleAddLearner = async () => {
    if (!manageBatch || !selectedStudentId) return;
    try {
      await apiFetch(`/batches/${manageBatch.id}/learners`, {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      notifyBatchMutation();
      setSelectedStudentId('');
      toast.success('Đã thêm học viên vào lớp.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm học viên.';
      toast.error(msg);
    }
  };

  const handleRemoveLearner = async (studentId: string) => {
    if (!manageBatch) return;
    try {
      await apiFetch(`/batches/${manageBatch.id}/learners/${studentId}`, { method: 'DELETE' });
      notifyBatchMutation();
      toast.success('Đã bỏ học viên khỏi lớp.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi bỏ học viên.';
      toast.error(msg);
    }
  };

  const filteredBatches = batches.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = b.code.toLowerCase().includes(term) ||
                          b.courseTitle.toLowerCase().includes(term) ||
                          b.instructorName.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableStudents = manageBatch
    ? students.filter(s => !manageBatch.learnerIds.includes(s.id))
    : [];
  const enrolledStudents = manageBatch
    ? manageBatch.learnerIds
        .map(id => students.find(s => s.id === id))
        .filter((s): s is NonNullable<typeof s> => !!s)
    : [];

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Lớp & Khai giảng"
        subtitle="Mở lớp theo khóa học, xếp lịch định kỳ, gán giảng viên & học viên"
        action={
          <ErpPrimaryButton onClick={openCreateModal}>
            Mở lớp mới
          </ErpPrimaryButton>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Tìm theo mã lớp, khóa học, giảng viên..." />
        <div className="flex items-center gap-2 overflow-x-auto">
          <ErpFilterTab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Tất cả
          </ErpFilterTab>
          {BATCH_STATUSES.map((st) => (
            <ErpFilterTab key={st} active={statusFilter === st} onClick={() => setStatusFilter(st)}>
              {st}
            </ErpFilterTab>
          ))}
        </div>
      </div>

      {/* Batch table */}
      {loading && batches.length === 0 ? (
        <ErpCard><ErpLoadingState message="Đang tải danh sách lớp..." /></ErpCard>
      ) : filteredBatches.length === 0 ? (
        <ErpCard>
          <ErpEmptyState
            icon={School}
            title="Chưa có lớp nào"
            subtitle="Bấm 'Mở lớp mới' để khai giảng lớp đầu tiên cho một khóa học."
          />
        </ErpCard>
      ) : (
        <ErpCard className="rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <ErpTableHead columns={['Mã lớp', 'Khóa học', 'Giảng viên', 'Lịch học', 'Thời gian', 'Sĩ số', 'Trạng thái', 'Thao tác']} />
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredBatches.map((b) => (
                  <tr key={b.id} className={cn("transition-colors", darkMode ? "text-slate-350 hover:bg-slate-800/10" : "text-slate-600 hover:bg-slate-50/40")}>
                    <td className="py-4 px-6 font-black text-sm">{b.code}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold">{b.courseTitle}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{b.courseCode}</p>
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {b.instructorName ? (
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {b.instructorName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa gán</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      <p>{formatDays(b.daysOfWeek)}</p>
                      <p className="text-[10px] text-slate-400">{b.startTime} - {b.endTime}{b.location ? ` • ${b.location}` : ''}</p>
                    </td>
                    <td className="py-4 px-6 font-bold whitespace-nowrap">
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => { setManageLearnersId(b.id); setSelectedStudentId(''); }}
                        title="Quản lý học viên trong lớp"
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all border cursor-pointer",
                          darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60"
                        )}
                      >
                        <Users className="w-3 h-3 text-brand-primary" />
                        {b.learnerIds.length}{b.maxLearners ? `/${b.maxLearners}` : ''} HV
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={b.status}
                        onChange={(e) => handleChangeStatus(b, e.target.value as BatchStatus)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase border outline-none cursor-pointer",
                          statusStyle(b.status),
                          darkMode ? "bg-slate-900" : "bg-white"
                        )}
                      >
                        {BATCH_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          title="Chỉnh sửa lớp"
                          className={cn(
                            "p-1.5 rounded-lg transition-all border cursor-pointer",
                            darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-transparent" : "bg-slate-50 hover:bg-slate-100 text-slate-450 hover:text-slate-700 border-slate-200/60"
                          )}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: b.id, code: b.code })}
                          title="Xóa lớp"
                          className={cn(
                            "p-1.5 rounded-lg transition-all border cursor-pointer",
                            darkMode ? "bg-slate-800 hover:bg-rose-900/40 text-slate-450 hover:text-rose-450 border-transparent" : "bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-550 border-slate-200/60"
                          )}
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Create / Edit Batch Modal */}
      {showFormModal && (
        <ErpModal title={editingId ? 'Chỉnh sửa lớp học' : 'Mở lớp mới'} onClose={() => setShowFormModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Mã lớp">
                <ErpInput
                  type="text"
                  required
                  placeholder="Ví dụ: K32"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </ErpField>
              <ErpField label="Khóa học">
                <ErpSelect
                  required
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                >
                  <option value="" disabled>-- Chọn khóa học --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                  ))}
                </ErpSelect>
              </ErpField>
            </div>

            <ErpField label="Giảng viên phụ trách">
              <ErpSelect
                value={form.instructorId}
                onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
              >
                <option value="">— Chưa gán giảng viên —</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.specializations.join(', ') || 'GV'})</option>
                ))}
              </ErpSelect>
            </ErpField>

            <ErpField label="Ngày học trong tuần">
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer",
                      form.daysOfWeek.includes(d.value)
                        ? "bg-brand-primary text-white border-brand-primary"
                        : darkMode
                          ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </ErpField>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Giờ bắt đầu">
                <ErpInput
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </ErpField>
              <ErpField label="Giờ kết thúc">
                <ErpInput
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </ErpField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Ngày khai giảng">
                <ErpInput
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </ErpField>
              <ErpField label="Ngày kết thúc">
                <ErpInput
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </ErpField>
            </div>

            <ErpField label="Địa điểm (tùy chọn)">
              <ErpInput
                type="text"
                placeholder="Ví dụ: Phòng 201 / Sân tập số 2"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </ErpField>

            <ErpSubmitButton>
              {isSubmitting ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Khai giảng lớp'}
            </ErpSubmitButton>
          </form>
        </ErpModal>
      )}

      {/* Manage Learners Modal */}
      {manageBatch && (
        <ErpModal
          title={`Học viên lớp ${manageBatch.code}`}
          onClose={() => setManageLearnersId(null)}
          maxWidth="max-w-lg"
        >
          <div className="space-y-6">
            <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>
              {manageBatch.courseTitle} • Sĩ số: {manageBatch.learnerIds.length}
              {manageBatch.maxLearners ? `/${manageBatch.maxLearners}` : ''} học viên
            </p>

            {/* Add learner */}
            <div className="flex gap-2">
              <div className="flex-1">
                <ErpSelect
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Chọn học viên để thêm vào lớp --</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.phone})</option>
                  ))}
                </ErpSelect>
              </div>
              <button
                type="button"
                onClick={handleAddLearner}
                disabled={!selectedStudentId}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold transition-all hover:bg-brand-primary/95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Thêm
              </button>
            </div>

            {/* Enrolled learners */}
            <div className="space-y-2">
              <h5 className={cn("text-xs font-black uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500")}>
                Danh sách học viên trong lớp
              </h5>
              {enrolledStudents.length === 0 ? (
                <p className="text-xs text-slate-400">Lớp chưa có học viên nào.</p>
              ) : (
                <div className={cn("border rounded-2xl p-2 max-h-72 overflow-y-auto divide-y", darkMode ? "border-slate-800 divide-slate-800/40" : "border-slate-100 divide-slate-100/60")}>
                  {enrolledStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 px-3">
                      <div>
                        <p className={cn("text-xs font-bold", darkMode ? "text-slate-200" : "text-slate-700")}>{s.fullName}</p>
                        <p className="text-[10px] text-slate-400">{s.phone}{s.rank ? ` • Hạng ${s.rank}` : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLearner(s.id)}
                        title="Bỏ khỏi lớp"
                        className={cn(
                          "p-1.5 rounded-lg transition-all border cursor-pointer",
                          darkMode
                            ? "bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border-transparent"
                            : "bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border-slate-200/60"
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErpModal>
      )}

      {/* Confirm Delete Modal */}
      <ErpConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp "${deleteConfirm.code}" không? Danh sách học viên trong lớp sẽ bị gỡ liên kết. Hành động này không thể hoàn tác.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', code: '' })}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />
    </div>
  );
}
