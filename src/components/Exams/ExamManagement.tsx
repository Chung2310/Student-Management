import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Download, Printer, Calendar as CalendarIcon, 
  ChevronDown, UserPlus, Edit3, Trash2,
  ClipboardList, CheckCircle2, Clock, Users as UsersIcon,
  X, MapPin, Map
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useExams } from '../../hooks/useExams';
import { useStudents } from '../../hooks/useStudents';
import { ExamSession, ExamStatus } from '../../types';
import { AddExamModal } from './AddExamModal';
import { ExamStatusModal } from './ExamStatusModal';
import { AssignStudentModal } from './AssignStudentModal';
import { useToast } from '../../hooks/useToast';

export function ExamManagement() {
  const { exams, loading: examsLoading } = useExams();
  const { students } = useStudents();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'exams' | 'students'>('exams');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamSession | null>(null);
  const [statusModalExam, setStatusModalExam] = useState<ExamSession | null>(null);
  const [assignModalExam, setAssignModalExam] = useState<ExamSession | null>(null);
  const [deleteModalExam, setDeleteModalExam] = useState<ExamSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Stats
  const stats = {
    totalExams: exams.length,
    upcoming: exams.filter(e => e.status === 'Sắp diễn ra' || e.status === 'Đã xác nhận').length,
    confirmed: exams.filter(e => e.status === 'Đã xác nhận').length,
    completed: exams.filter(e => e.status === 'Đã hoàn thành').length,
    unassignedStudents: students.filter(s => s.status === 'Đang học').length // Example logic
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('Tất cả hạng');
  const [areaFilter, setAreaFilter] = useState('Tất cả khu vực');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Helper to parse DD/MM/YYYY to Date object
  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/').map(Number);
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredExams = exams.filter(exam => {
    if (rankFilter !== 'Tất cả hạng' && exam.rank !== rankFilter) return false;
    if (areaFilter !== 'Tất cả khu vực' && exam.area !== areaFilter) return false;
    if (statusFilter !== 'Tất cả' && exam.status !== statusFilter) return false;
    if (searchQuery && !exam.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Date filter
    const examDateStr = exam.officialDate || exam.tentativeDate;
    if (examDateStr) {
      const examDate = parseDateString(examDateStr);
      if (examDate) {
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          examDate.setHours(0, 0, 0, 0);
          if (examDate < from) return false;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          examDate.setHours(0, 0, 0, 0);
          if (examDate > to) return false;
        }
      }
    }
    return true;
  });

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

  const handleEditExam = (exam: ExamSession) => {
    setEditingExam(exam);
    setIsAddModalOpen(true);
  };

  const handleStatusUpdate = (exam: ExamSession) => {
    setStatusModalExam(exam);
  };

  const handleAssignStudent = (exam: ExamSession) => {
    setAssignModalExam(exam);
  };

  const handleExport = () => {
    if (filteredExams.length === 0) {
      toast.warning('Không có dữ liệu đợt thi để xuất.');
      return;
    }

    // Define CSV headers
    const headers = ['Tên đợt thi', 'Hạng', 'Trạng thái', 'Ngày dự kiến', 'Ngày chính thức', 'Địa điểm', 'Số học viên', 'Đậu', 'Trượt'];
    
    // Map data to CSV rows
    const rows = filteredExams.map(exam => [
      exam.name,
      exam.rank,
      exam.status,
      exam.tentativeDate,
      exam.officialDate || '',
      exam.location,
      exam.studentCount,
      exam.passCount,
      exam.failCount
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create a blob and download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_lich_thi_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (filteredExams.length === 0) {
      toast.warning('Không có dữ liệu đợt thi để in.');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép bật lên để in hoặc mở ứng dụng trong tab mới.');
      return;
    }

    // Prepare table rows html
    const rowsHtml = filteredExams.map(exam => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${exam.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exam.rank}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exam.status}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exam.tentativeDate}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exam.officialDate || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${exam.location}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${exam.studentCount}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #10b981;">${exam.passCount}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #f43f5e;">${exam.failCount}</td>
      </tr>
    `).join('');

    // Construct print html content
    const printContent = `
      <html>
        <head>
          <title>Danh sách lịch thi - ${new Date().toLocaleDateString('vi-VN')}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; }
            p.info { text-align: center; margin-bottom: 30px; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; text-transform: uppercase; font-size: 12px; padding: 12px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .footer { margin-top: 30px; text-align: right; font-size: 12px; font-style: italic; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>DANH SÁCH LỊCH THI</h1>
          <p class="info">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Tổng số: ${filteredExams.length} đợt thi</p>
          <table>
            <thead>
              <tr>
                <th>Tên đợt thi</th>
                <th>Hạng</th>
                <th>Trạng thái</th>
                <th>Dự kiến</th>
                <th>Chính thức</th>
                <th>Địa điểm</th>
                <th>HV</th>
                <th>Đậu</th>
                <th>Trượt</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            Xuất bởi Hệ thống Quản lý Học viên Lái xe
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lịch thi</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Quản lý đợt thi, gắn học viên và theo dõi kết quả</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" /> Xuất
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-5 h-5" /> In
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-8 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition-all"
          >
            <Plus className="w-5 h-5" /> Tạo đợt thi
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 no-print">
        <StatCard label="Tổng đợt thi" value={stats.totalExams} icon={ClipboardList} color="text-cyan-600" bgColor="bg-cyan-50" />
        <StatCard label="Sắp diễn ra" value={stats.upcoming} icon={Clock} color="text-orange-500" bgColor="bg-orange-50" />
        <StatCard label="Đã xác nhận" value={stats.confirmed} icon={CheckCircle2} color="text-emerald-500" bgColor="bg-emerald-50" />
        <StatCard label="Đã hoàn thành" value={stats.completed} icon={CheckCircle2} color="text-sky-500" bgColor="bg-sky-50" />
        <StatCard label="HV chưa có lịch" value={stats.unassignedStudents} icon={UsersIcon} color="text-purple-500" bgColor="bg-purple-50" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-10 border-b border-slate-200 mt-2 overflow-x-auto no-scrollbar no-print">
        <button 
          onClick={() => setActiveTab('exams')}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-4 sm:py-5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap",
            activeTab === 'exams' ? "text-cyan-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <ClipboardList className="w-4 h-4 sm:w-5 h-5" /> Đợt thi
          {activeTab === 'exams' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-4 sm:py-5 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap",
            activeTab === 'students' ? "text-cyan-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <UsersIcon className="w-4 h-4 sm:w-5 h-5" /> HV chưa có lịch
          <span className="hidden xs:inline px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold ml-1">{stats.unassignedStudents}</span>
          {activeTab === 'students' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />}
        </button>
      </div>

      {activeTab === 'exams' ? (
        <>
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-3xl border border-slate-100 shadow-sm no-print">
            <FilterItem label="Từ ngày">
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-bold relative" 
              />
            </FilterItem>
            <FilterItem label="Đến ngày">
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-transparent outline-none text-xs font-bold relative" 
              />
            </FilterItem>
            <FilterSelect label="Hạng bằng" value={rankFilter} onChange={setRankFilter} options={['Tất cả hạng', 'A1', 'A2', 'B1', 'B2', 'C']} />
            <FilterSelect label="Khu vực" value={areaFilter} onChange={setAreaFilter} options={['Tất cả khu vực', 'Nội thành', 'Ngoại thành']} />
            <FilterSelect label="Trạng thái" value={statusFilter} onChange={setStatusFilter} options={['Tất cả', 'Sắp diễn ra', 'Đã xác nhận', 'Đã hoàn thành']} />
            <div className="flex items-end pb-2 col-span-2 sm:col-span-1">
              <button 
                onClick={() => {
                  setRankFilter('Tất cả hạng'); 
                  setAreaFilter('Tất cả khu vực'); 
                  setStatusFilter('Tất cả'); 
                  setSearchQuery('');
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa lọc
              </button>
            </div>
          </div>

          {/* Exam List */}
          <div className="space-y-4">
            {examsLoading ? (
              <div className="py-20 text-center text-slate-400 text-sm italic">Đang nạp dữ liệu đợt thi...</div>
            ) : filteredExams.length === 0 ? (
              <div className="py-20 bg-white rounded-3xl border border-slate-100 text-center text-slate-400 text-sm italic">Không tìm thấy đợt thi nào.</div>
            ) : filteredExams.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                getStatusInfo={getStatusInfo} 
                onDelete={() => setDeleteModalExam(exam)}
                onEdit={() => handleEditExam(exam)}
                onStatusClick={() => handleStatusUpdate(exam)}
                onAssignClick={() => handleAssignStudent(exam)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="py-20 bg-white rounded-3xl border border-slate-100 text-center text-slate-400 text-sm italic">Danh sách học viên chưa có lịch thi.</div>
      )}

      {/* Add Exam Modal */}
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

      {/* Delete Confirmation Modal */}
      {deleteModalExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModalExam(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 max-w-sm w-full text-center"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              Bạn có chắc chắn muốn xóa đợt thi <span className="font-bold text-slate-800">"{deleteModalExam.name}"</span>? 
              Dữ liệu của học viên trong đợt thi này sẽ bị xóa khỏi lịch.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModalExam(null)}
                className="flex-1 px-6 py-3 bg-slate-50 text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDeleteExam}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Đúng, xóa nó'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", bgColor)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{label}</p>
      </div>
    </div>
  );
}

interface FilterItemProps {
  label: string;
  children: React.ReactNode;
}

function FilterItem({ label, children }: FilterItemProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 h-11 flex items-center relative">
        {children}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 bg-slate-50 px-4 pr-10 rounded-xl border border-slate-100 text-sm font-bold text-slate-800 outline-none appearance-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-500/5 transition-all"
        >
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

interface ExamCardProps {
  key?: string | number;
  exam: ExamSession;
  getStatusInfo: (status: ExamStatus) => { 
    color: string; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
  };
  onDelete: () => void;
  onEdit: () => void;
  onStatusClick: () => void;
  onAssignClick: () => void;
}

function ExamCard({ exam, getStatusInfo, onDelete, onEdit, onStatusClick, onAssignClick }: ExamCardProps) {
  const status = getStatusInfo(exam.status);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border-l-[4px] shadow-sm hover:shadow-lg transition-all overflow-hidden"
      style={{ borderLeftColor: exam.status === 'Sắp diễn ra' ? '#f59e0b' : exam.status === 'Đã xác nhận' ? '#3b82f6' : exam.status === 'Đã hoàn thành' ? '#10b981' : '#e2e8f0' }}
    >
      <div className="p-5 sm:p-7 flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8">
        <div className="flex-1 space-y-4 sm:space-y-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{exam.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border", status.color)}>
                <status.icon className="w-3 h-3 sm:w-4 h-4" /> {status.label}
              </span>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan-50 text-cyan-700 rounded-lg text-[10px] sm:text-xs font-bold border border-cyan-100">
                {exam.rank}
              </span>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                <MapPin className="w-3 h-3 sm:w-4 h-4 text-slate-300" /> {exam.area || 'Tất cả khu vực'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-5 sm:gap-10">
            <div className="flex items-center gap-2 sm:gap-3 group">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors border border-slate-100/50">
                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-none">Dự kiến</p>
                <p className="text-sm sm:text-base font-bold text-slate-700 mt-1 sm:mt-1.5">{exam.tentativeDate}</p>
              </div>
            </div>

            {exam.officialDate && (
              <div className="flex items-center gap-2 sm:gap-3 group">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors border border-emerald-100/50">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wide leading-none">Chính thức</p>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 mt-1 sm:mt-1.5">{exam.officialDate}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 group">
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 group-hover:bg-slate-100 transition-colors border border-slate-100/50">
                <Map className="w-3.5 h-3.5 sm:w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-none">Địa điểm</p>
                <p className="text-sm sm:text-base font-bold text-slate-700 mt-1 sm:mt-1.5 truncate max-w-[150px] sm:max-w-[300px]">{exam.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 rounded-2xl text-center min-w-[70px] sm:min-w-[80px] border border-slate-100/50">
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{exam.studentCount}</p>
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">Học viên</p>
            </div>
            <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 bg-emerald-50 rounded-2xl text-center min-w-[60px] sm:min-w-[70px] border border-emerald-100/30">
              <p className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">{exam.passCount}</p>
              <p className="text-[9px] sm:text-[11px] font-bold text-emerald-500 mt-1 uppercase tracking-wide">Đậu</p>
            </div>
            <div className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 bg-rose-50 rounded-2xl text-center min-w-[60px] sm:min-w-[70px] border border-rose-100/30">
              <p className="text-xl sm:text-2xl font-black text-rose-600 leading-none">{exam.failCount}</p>
              <p className="text-[9px] sm:text-[11px] font-bold text-rose-500 mt-1 uppercase tracking-wide">Trượt</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end no-print">
            <button 
              onClick={(e) => { e.stopPropagation(); onAssignClick(); }}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all border border-slate-200 bg-white shadow-sm active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 bg-white shadow-sm active:scale-95"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 sm:p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-md shadow-rose-100 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusClick(); }}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all border border-slate-100 active:scale-95"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
