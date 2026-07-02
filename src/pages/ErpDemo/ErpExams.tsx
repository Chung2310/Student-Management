import React, { useState } from 'react';
import {
  Plus, ClipboardList, CheckCircle2, Clock, Users as UsersIcon, X, Trash2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useExams } from '../../hooks/useExams';
import { useStudents } from '../../hooks/useStudents';
import { ExamSession, ExamStatus } from '../../types';
import { AddExamModal } from '../../components/Exams/AddExamModal';
import { ExamStatusModal } from '../../components/Exams/ExamStatusModal';
import { AssignStudentModal } from '../../components/Exams/AssignStudentModal';
import { ExamCard } from '../../components/Exams/ExamCard';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../../components/ui/Pagination';
import { useErpTheme } from './ErpThemeContext';
import {
  ErpPageHeader, ErpPrimaryButton, ErpStatCard, ErpSearchBar, ErpFilterTab, ErpModal
} from '../../components/Erp/ErpUI';

export function ErpExams() {
  const { darkMode } = useErpTheme();
  const { exams, loading: examsLoading } = useExams();
  const { students } = useStudents();
  const { toast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSession | null>(null);
  const [statusModalExam, setStatusModalExam] = useState<ExamSession | null>(null);
  const [assignModalExam, setAssignModalExam] = useState<ExamSession | null>(null);
  const [deleteModalExam, setDeleteModalExam] = useState<ExamSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  React.useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 0);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const stats = {
    totalExams: exams.length,
    upcoming: exams.filter(e => e.status === 'Sắp diễn ra' || e.status === 'Đã xác nhận').length,
    completed: exams.filter(e => e.status === 'Đã hoàn thành').length,
    unassignedStudents: students.filter(s => s.status === 'Đang học' && !s.examId).length,
  };

  const filteredExams = exams.filter(exam => {
    if (statusFilter !== 'Tất cả' && exam.status !== statusFilter) return false;
    if (searchQuery && !exam.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredExams.length / pageSize);
  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusInfo = (status: ExamStatus) => {
    switch (status) {
      case 'Đã hoàn thành':
        return { color: 'text-emerald-500 bg-emerald-50 border-emerald-100', icon: CheckCircle2, label: 'Đã hoàn thành' };
      case 'Sắp diễn ra':
        return { color: 'text-amber-500 bg-amber-50 border-amber-100', icon: Clock, label: 'Sắp diễn ra' };
      case 'Đã xác nhận':
        return { color: 'text-blue-500 bg-blue-50 border-blue-100', icon: CheckCircle2, label: 'Đã xác nhận' };
      case 'Đã hủy':
        return { color: 'text-rose-500 bg-rose-50 border-rose-100', icon: X, label: 'Đã hủy' };
      default:
        return { color: 'text-slate-500 bg-slate-50 border-slate-100', icon: ClipboardList, label: status };
    }
  };

  const handleDeleteExam = async () => {
    if (!deleteModalExam) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/exams/${deleteModalExam.id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event("exam-mutation"));
      setDeleteModalExam(null);
      toast.success("Xóa đợt thi thành công!");
    } catch (error: unknown) {
      console.error("Error deleting exam:", error);
      const msg = error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa đợt thi.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (filteredExams.length === 0) {
      toast.warning('Không có dữ liệu đợt thi để xuất.');
      return;
    }
    const headers = ['Tên đợt thi', 'Hạng', 'Trạng thái', 'Ngày dự kiến', 'Ngày chính thức', 'Địa điểm', 'Số học viên', 'Đậu', 'Trượt'];
    const rows = filteredExams.map(exam => [
      exam.name, exam.rank, exam.status, exam.tentativeDate, exam.officialDate || '',
      exam.location, exam.studentCount, exam.passCount, exam.failCount
    ]);
    try {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách đợt thi");
      XLSX.writeFile(wb, `danh_sach_lich_thi_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
      toast.success('Xuất file Excel thành công.');
    } catch (error) {
      console.error('Error exporting exams to excel:', error);
      toast.error('Có lỗi xảy ra khi xuất file Excel.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Lịch thi & Kỳ thi"
        subtitle="Quản lý đợt thi, gắn học viên và theo dõi kết quả sát hạch"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className={cn(
                "flex items-center gap-2 px-5 py-3 border rounded-2xl text-xs font-black transition-all active:scale-95",
                darkMode ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <ErpPrimaryButton onClick={() => setIsAddModalOpen(true)} icon={Plus}>
              Tạo đợt thi
            </ErpPrimaryButton>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <ErpStatCard name="Tổng đợt thi" value={stats.totalExams} icon={ClipboardList} color="from-brand-primary to-cyan-500" />
        <ErpStatCard name="Sắp diễn ra" value={stats.upcoming} icon={Clock} color="from-amber-600 to-orange-500" />
        <ErpStatCard name="Đã hoàn thành" value={stats.completed} icon={CheckCircle2} color="from-emerald-600 to-teal-500" />
        <ErpStatCard name="HV chưa có lịch" value={stats.unassignedStudents} icon={UsersIcon} color="from-violet-600 to-fuchsia-500" />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Tìm đợt thi theo tên..." />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['Tất cả', 'Sắp diễn ra', 'Đã xác nhận', 'Đã hoàn thành', 'Đã hủy'].map(st => (
            <ErpFilterTab key={st} active={statusFilter === st} onClick={() => setStatusFilter(st)}>{st}</ErpFilterTab>
          ))}
        </div>
      </div>

      {/* Exam List - tái sử dụng ExamCard nghiệp vụ đầy đủ (gắn HV, kết quả, import Excel) */}
      <div className="space-y-4">
        {examsLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm italic">Đang nạp dữ liệu đợt thi...</div>
        ) : paginatedExams.length === 0 ? (
          <div className={cn(
            "py-20 rounded-3xl border text-center text-slate-400 text-sm italic",
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"
          )}>
            Không tìm thấy đợt thi nào.
          </div>
        ) : paginatedExams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            assignedStudents={students.filter(s => s.examId === exam.id)}
            getStatusInfo={getStatusInfo}
            onDelete={() => setDeleteModalExam(exam)}
            onEdit={() => { setEditingExam(exam); setIsAddModalOpen(true); }}
            onStatusClick={() => setStatusModalExam(exam)}
            onAssignClick={() => setAssignModalExam(exam)}
            onUnassignStudent={async (studentId) => {
              try {
                await apiFetch(`/exams/${exam.id}/unassign`, {
                  method: 'POST',
                  body: JSON.stringify({ studentId })
                });
                window.dispatchEvent(new Event("student-mutation"));
                window.dispatchEvent(new Event("exam-mutation"));
                toast.success("Đã xóa học viên khỏi đợt thi.");
              } catch (error) {
                console.error("Error unassigning student:", error);
                toast.error("Có lỗi xảy ra khi xóa học viên khỏi đợt thi.");
              }
            }}
            onUpdateStudentResult={async (studentId, overallResult) => {
              try {
                await apiFetch(`/exams/${exam.id}/students/${studentId}/result`, {
                  method: 'POST',
                  body: JSON.stringify({ overallResult })
                });
                window.dispatchEvent(new Event("student-mutation"));
                window.dispatchEvent(new Event("exam-mutation"));
                toast.success("Cập nhật kết quả thi thành công.");
              } catch (error) {
                console.error("Error updating student result:", error);
                toast.error("Có lỗi xảy ra khi cập nhật kết quả thi.");
              }
            }}
            onImportExcelResults={async (results) => {
              try {
                const res = await apiFetch(`/exams/${exam.id}/import-results`, {
                  method: 'POST',
                  body: JSON.stringify({ results })
                });
                window.dispatchEvent(new Event("student-mutation"));
                window.dispatchEvent(new Event("exam-mutation"));
                if (res.success) {
                  toast.success(`Đã cập nhật kết quả: ${res.successCount} thành công, ${res.failedCount} thất bại.`);
                }
              } catch (error) {
                console.error("Error importing exam results:", error);
                toast.error("Có lỗi xảy ra khi nhập kết quả thi từ Excel.");
              }
            }}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredExams.length}
        pageSize={pageSize}
        itemName="đợt thi"
        className={cn("mt-4 shadow-sm rounded-3xl border", darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100")}
      />

      {/* Modals nghiệp vụ tái sử dụng từ giao diện cũ */}
      <AddExamModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExam(null);
        }}
        onSuccess={() => {}}
        initialData={editingExam}
      />

      <ExamStatusModal
        isOpen={!!statusModalExam}
        exam={statusModalExam}
        onClose={() => setStatusModalExam(null)}
        onSuccess={() => {}}
      />

      <AssignStudentModal
        isOpen={!!assignModalExam}
        exam={assignModalExam}
        onClose={() => setAssignModalExam(null)}
        onSuccess={() => {}}
      />

      {/* Delete Confirmation */}
      {deleteModalExam && (
        <ErpModal title="Xác nhận xóa đợt thi" onClose={() => setDeleteModalExam(null)} maxWidth="max-w-sm">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Bạn có chắc chắn muốn xóa đợt thi <span className={cn("font-bold", darkMode ? "text-white" : "text-slate-800")}>"{deleteModalExam.name}"</span>?
              Dữ liệu của học viên trong đợt thi này sẽ bị xóa khỏi lịch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalExam(null)}
                className={cn(
                  "flex-1 px-6 py-3 font-bold rounded-2xl transition-all border",
                  darkMode ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700" : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                )}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteExam}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Đúng, xóa nó'}
              </button>
            </div>
          </div>
        </ErpModal>
      )}
    </div>
  );
}
