import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { ErpModal, ErpSelect } from '../Erp/ErpUI';
import { Batch, Student } from '../../types';

interface ManageLearnersModalProps {
  isOpen: boolean;
  batch: Batch;
  onClose: () => void;
  students: Student[];
  onSuccess: () => void;
}

export function ManageLearnersModal({
  isOpen,
  batch,
  onClose,
  students,
  onSuccess,
}: ManageLearnersModalProps) {
  const darkMode = false;
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const availableStudents = students.filter((s) => !batch.learnerIds.includes(s.id));
  const enrolledStudents = batch.learnerIds
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  const handleAddLearner = async () => {
    if (!selectedStudentId) return;
    try {
      await apiFetch(`/batches/${batch.id}/learners`, {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      setSelectedStudentId('');
      toast.success('Đã thêm học viên vào lớp.');
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm học viên.';
      toast.error(msg);
    }
  };

  const handleRemoveLearner = async (studentId: string) => {
    try {
      await apiFetch(`/batches/${batch.id}/learners/${studentId}`, { method: 'DELETE' });
      toast.success('Đã bỏ học viên khỏi lớp.');
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi bỏ học viên.';
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <ErpModal
      title={`Học viên lớp ${batch.code}`}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>
          {batch.courseTitle} • Sĩ số: {batch.learnerIds.length}
          {batch.maxLearners ? `/${batch.maxLearners}` : ''} học viên
        </p>

        {/* Add learner */}
        <div className="flex gap-2 text-left">
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
        <div className="space-y-2 text-left">
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
  );
}
