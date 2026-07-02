import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search, Download, Printer, Plus,
  Eye, Trash2, Pencil,
  X, Calendar as CalendarIcon, ChevronDown,
  Users, Car, Upload, Languages, Lightbulb, BookOpen, UserX
} from 'lucide-react';
import { cn, formatVND, formatDisplayDate } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useBatches } from '../../hooks/useBatches';
import { useCourses } from '../../hooks/useCourses';
import { useCourseCategories } from '../../hooks/useCourseCategories';
import { useToast } from '../../hooks/useToast';
import { Student } from '../../types';
import { apiFetch } from '../../lib/api';
import { EditStudentModal } from '../../components/Student/EditStudentModal';
import { ImportStudentModal } from '../../components/Student/ImportStudentModal';
import { Pagination } from '../../components/ui/Pagination';
import * as XLSX from 'xlsx';

interface StudentsPageProps {
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
}

type StatusFilter = 'Tất cả' | 'KSK' | 'Đã KSK' | 'Nộp HS' | 'Đang học' | 'Đang thi' | 'Đã đậu' | 'Thi lại' | 'Nghỉ học';

// Tab phân loại ảo, luôn có bên cạnh các phân loại khóa học động
const TAB_ALL = 'Tất cả';
const TAB_UNASSIGNED = 'Chưa xếp lớp';

// Icon gợi ý theo tên phân loại; phân loại mới chưa nhận diện được thì dùng icon chung
function categoryIcon(name: string): React.ComponentType<{ className?: string }> {
  const n = name.toLowerCase();
  if (n.includes('lái xe') || n.includes('lai xe')) return Car;
  if (n.includes('ngoại ngữ') || n.includes('ngoai ngu') || n.includes('tiếng')) return Languages;
  if (n.includes('kỹ năng') || n.includes('ky nang')) return Lightbulb;
  return BookOpen;
}

export function StudentsPage({ onSelectStudent, onAddStudent }: StudentsPageProps) {
  const { students, loading } = useStudents();
  const { batches } = useBatches();
  const { courses } = useCourses();
  const { categories } = useCourseCategories();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>(TAB_ALL);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>(['Tất cả']);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rankFilter, setRankFilter] = useState('Tất cả hạng');
  const [feeStatusFilter, setFeeStatusFilter] = useState('Tất cả học phí');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Nếu phân loại đang chọn bị xóa khỏi danh mục thì quay về "Tất cả"
  React.useEffect(() => {
    if (category !== TAB_ALL && category !== TAB_UNASSIGNED && categories.length > 0 && !categories.some(c => c.name === category)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(TAB_ALL);
    }
  }, [categories, category]);

  // Reset to first page when filtering
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [category, selectedStatuses, searchQuery, startDate, endDate, rankFilter, feeStatusFilter]);

  // Helper to parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Học viên thuộc phân loại nào = phân loại của các khóa học mà lớp (batch) của họ đang mở
  const studentCategories = useMemo(() => {
    const categoryByCourseId = new Map<string, string>(courses.map(c => [c.id, c.category]));
    const map = new Map<string, Set<string>>();
    for (const b of batches) {
      const cat = categoryByCourseId.get(b.courseId);
      if (!cat) continue;
      for (const sid of b.learnerIds) {
        const set = map.get(sid) || new Set<string>();
        set.add(cat);
        map.set(sid, set);
      }
    }
    return map;
  }, [batches, courses]);

  // Hạng bằng là dữ liệu riêng ngành lái xe — chỉ hiện filter/cột khi còn học viên có hạng
  const hasRankData = useMemo(() => students.some(s => s.rank), [students]);

  const filteredStudents = students.filter(student => {
    // 1. Category Filter (theo phân loại khóa học của lớp học viên đang tham gia)
    if (category !== TAB_ALL) {
      const cats = studentCategories.get(student.id);
      if (category === TAB_UNASSIGNED) {
        if (cats && cats.size > 0) return false;
      } else if (!cats || !cats.has(category)) {
        return false;
      }
    }

    // 2. Status Filter
    if (!selectedStatuses.includes('Tất cả') && selectedStatuses.length > 0) {
      const statusMap: Record<string, string> = {
        'Nộp HS': 'Đã nộp HS',
        'KSK': 'Chờ KSK'
      };
      const dbStatuses = selectedStatuses.map(s => statusMap[s] || s);
      const studentStatuses = Array.isArray(student.status) ? student.status : [student.status];
      const hasMatch = studentStatuses.some(s => dbStatuses.includes(s));
      if (!hasMatch) return false;
    }

    // 3. Rank Filter (chỉ áp dụng với dữ liệu ngành lái xe)
    if (hasRankData && rankFilter !== 'Tất cả hạng' && student.rank !== rankFilter) return false;

    // 4. Date Range Filter
    if (startDate || endDate) {
      const regDate = parseDate(student.registrationDate);
      if (startDate) {
        const start = new Date(startDate);
        if (regDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (regDate > end) return false;
      }
    }

    // 6. Search Query (Name, Phone, ID Card)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = student.fullName.toLowerCase().includes(query);
      const matchPhone = student.phone.includes(query);
      const matchId = student.idCard?.toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchId) return false;
    }

    // 7. Tuition Status Filter
    if (feeStatusFilter !== 'Tất cả học phí') {
      const totalFeeNum = parseInt(String(student.fee).replace(/\D/g, ''), 10) || 0;
      const paidSoFar = student.paidAmount || 0;
      const remaining = totalFeeNum - paidSoFar;

      if (feeStatusFilter === 'Đã đóng đủ') {
        if (remaining > 0 || totalFeeNum === 0) return false;
      } else if (feeStatusFilter === 'Chưa đóng') {
        if (paidSoFar > 0) return false;
      } else if (feeStatusFilter === 'Còn thiếu') {
        if (paidSoFar === 0 || remaining <= 0) return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Nhóm trạng thái riêng quy trình lái xe — ẩn tab khi không có học viên nào mang trạng thái đó
  const DRIVING_STATUS_TABS: StatusFilter[] = ['KSK', 'Đã KSK', 'Nộp HS'];

  const allStatusTabs: { label: StatusFilter; count?: number }[] = [
    { label: 'Tất cả', count: students.length },
    { label: 'KSK', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Chờ KSK') : s.status === 'Chờ KSK').length },
    { label: 'Đã KSK', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Đã KSK') : s.status === 'Đã KSK').length },
    { label: 'Nộp HS', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Đã nộp HS') : s.status === 'Đã nộp HS').length },
    { label: 'Đang học', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Đang học') : s.status === 'Đang học').length },
    { label: 'Đang thi', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Đang thi') : s.status === 'Đang thi').length },
    { label: 'Đã đậu', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Đã đậu') : s.status === 'Đã đậu').length },
    { label: 'Thi lại', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Thi lại') : s.status === 'Thi lại').length },
    { label: 'Nghỉ học', count: students.filter(s => Array.isArray(s.status) ? s.status.includes('Nghỉ học') : s.status === 'Nghỉ học').length },
  ];
  const statusTabs = allStatusTabs.filter(tab => !(DRIVING_STATUS_TABS.includes(tab.label) && tab.count === 0));

  const getStatusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      'Đang thi': 'bg-teal-100 text-teal-700 border-teal-200',
      'Đã đậu': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Đang học': 'bg-sky-100 text-sky-700 border-sky-200',
      'Chờ KSK': 'bg-amber-100 text-amber-700 border-amber-200',
      'Thi lại': 'bg-rose-100 text-rose-700 border-rose-200',
      'Đã KSK': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Đã nộp HS': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Nợ học phí': 'bg-orange-100 text-orange-700 border-orange-200',
      'Nghỉ học': 'bg-slate-200 text-slate-600 border-slate-300',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const handleDelete = async (student: Student) => {
    setIsDeleting(student.id);
    try {
      await apiFetch(`/students/${student.id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event("student-mutation"));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error('Có lỗi xảy ra khi xóa học viên.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.warning('Không có dữ liệu để xuất.');
      return;
    }

    const headers = [
      'Họ và tên', 'Số điện thoại', 'Ngành / Hạng', 'Học phí', 'Đã đóng', 'Còn nợ',
      'Ngày đăng ký', 'Trạng thái học phí', 'Trạng thái học tập',
      'Ngày sinh', 'CCCD / CMND', 'Email', 'Người giới thiệu', 'Địa chỉ', 'Ngày nhập học',
      'Ảnh CCCD mặt trước', 'Ảnh CCCD mặt sau', 'Ảnh chân dung'
    ];

    const data = filteredStudents.map(student => {
      const totalFeeNum = parseInt(String(student.fee).replace(/\D/g, ''), 10) || 0;
      const paidSoFar = student.paidAmount || 0;
      const remaining = totalFeeNum - paidSoFar;

      let feeStatusStr = 'Chưa đóng';
      if (remaining <= 0 && totalFeeNum > 0) {
        feeStatusStr = 'Đã đóng đủ';
      } else if (paidSoFar > 0) {
        feeStatusStr = 'Còn thiếu';
      }

      const cats = Array.from(studentCategories.get(student.id) || []);

      return [
        student.fullName,
        student.phone,
        cats.length > 0 ? cats.join(', ') : (student.rank || ''),
        totalFeeNum.toLocaleString('vi-VN'),
        paidSoFar.toLocaleString('vi-VN'),
        remaining.toLocaleString('vi-VN'),
        student.registrationDate,
        feeStatusStr,
        Array.isArray(student.status) ? student.status.join(', ') : student.status,
        student.birthday || '',
        student.idCard || '',
        student.email || '',
        student.referral || '',
        student.address || '',
        student.enrollmentDate || '',
        student.idCardFrontFile?.url || '',
        student.idCardBackFile?.url || '',
        student.portraitFile?.url || ''
      ];
    });

    try {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 20 }, // Họ và tên
        { wch: 15 }, // Số điện thoại
        { wch: 10 }, // Hạng bằng
        { wch: 15 }, // Học phí
        { wch: 15 }, // Đã đóng
        { wch: 15 }, // Còn nợ
        { wch: 15 }, // Ngày đăng ký
        { wch: 18 }, // Trạng thái học phí
        { wch: 18 }, // Trạng thái học tập
        { wch: 12 }, // Ngày sinh
        { wch: 18 }, // CCCD / CMND
        { wch: 22 }, // Email
        { wch: 18 }, // Người giới thiệu
        { wch: 35 }, // Địa chỉ
        { wch: 16 }, // Ngày nhập học
        { wch: 30 }, // Ảnh CCCD mặt trước
        { wch: 30 }, // Ảnh CCCD mặt sau
        { wch: 30 }  // Ảnh chân dung
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách học viên");
      
      const fileName = `danh_sach_hoc_vien_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Đã xuất file Excel thành công!');
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error('Có lỗi xảy ra khi xuất file Excel.');
    }
  };

  const handlePrint = () => {
    if (filteredStudents.length === 0) {
      toast.warning('Không có dữ liệu học viên để in.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.warning('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép bật lên để in hoặc mở ứng dụng trong tab mới.');
      return;
    }

    const rowsHtml = filteredStudents.map(student => {
      const cats = Array.from(studentCategories.get(student.id) || []);
      return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${student.fullName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.phone}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${cats.length > 0 ? cats.join(', ') : (student.rank || '')}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.registrationDate}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${Array.isArray(student.status) ? student.status.join(', ') : student.status}</td>
      </tr>
    `;
    }).join('');

    const printContent = `
      <html>
        <head>
          <title>Danh sách học viên - ${new Date().toLocaleDateString('vi-VN')}</title>
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
          <h1>DANH SÁCH HỌC VIÊN</h1>
          <p class="info">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Tổng số: ${filteredStudents.length} học viên</p>
          <table>
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Số điện thoại</th>
                <th>Ngành / Hạng</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            Xuất bởi Hệ thống Quản lý Đào tạo & Học viên iGen
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Học viên</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">{loading ? '...' : `${filteredStudents.length} / ${students.length}`} học viên</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" /> Xuất
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4" /> In
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>
          <button
            onClick={onAddStudent}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-100 hover:bg-brand-primary/95 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      {/* Primary Tabs — sinh động từ phân loại khóa học */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: TAB_ALL, icon: Users },
          ...categories.map((cat) => ({ id: cat.name, icon: categoryIcon(cat.name) })),
          { id: TAB_UNASSIGNED, icon: UserX },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id)}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-3 text-base sm:text-lg font-bold transition-all relative whitespace-nowrap",
              category === item.id ? "text-cyan-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon className={cn("w-5 h-5", category === item.id ? "text-cyan-600" : "text-slate-400")} />
            {item.id}
            {category === item.id && (
              <motion.div layoutId="catLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />
            )}
          </button>
        ))}
      </div>

      {/* Sub-Tabs (Status Workflow) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 status-tabs">
        {statusTabs.map((tab) => {
          const isSelected = selectedStatuses.includes(tab.label);
          return (
            <button
              key={tab.label}
              onClick={() => {
                setSelectedStatuses((prev) => {
                  if (tab.label === 'Tất cả') {
                    return ['Tất cả'];
                  }
                  const withoutAll = prev.filter(x => x !== 'Tất cả');
                  const next = withoutAll.includes(tab.label)
                    ? withoutAll.filter(x => x !== tab.label)
                    : [...withoutAll, tab.label];
                  return next.length === 0 ? ['Tất cả'] : next;
                });
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px]",
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm filters-bar">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Từ ngày</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-600 transition-all"
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đến ngày</label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-600 transition-all"
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        {hasRankData && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hạng bằng (lái xe)</label>
            <div className="relative">
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-cyan-600"
              >
                <option>Tất cả hạng</option>
                <option>A1</option>
                <option>A2</option>
                <option>B1</option>
                <option>B2</option>
                <option>C</option>
                <option>D</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Học phí</label>
          <div className="relative">
            <select
              value={feeStatusFilter}
              onChange={(e) => setFeeStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-cyan-600"
            >
              <option>Tất cả học phí</option>
              <option>Đã đóng đủ</option>
              <option>Chưa đóng</option>
              <option>Còn thiếu</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1 col-span-2 lg:col-span-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Tên / SĐT / CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-600"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-10 no-print">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600" />
                </th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Họ và tên</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Ngành / Hạng</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Ngày ĐK</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tiến độ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Học phí</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right no-print">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400 text-sm italic">Đang nạp dữ liệu...</td></tr>
              ) : paginatedStudents.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400 text-sm italic">Không tìm thấy học viên nào phù hợp với bộ lọc.</td></tr>
              ) : paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 no-print">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-bold text-slate-800 capitalize">{student.fullName}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-400">
                        <span>{student.phone}</span>
                        {student.idCard && (
                          <>
                            <span className="text-slate-200">•</span>
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-semibold">CCCD: {student.idCard}</span>
                          </>
                        )}
                        {student.birthday && (
                          <>
                            <span className="text-slate-200">•</span>
                            <span>NS: {student.birthday}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {(() => {
                      const cats = Array.from(studentCategories.get(student.id) || []);
                      if (cats.length > 0) {
                        return (
                          <div className="flex flex-wrap justify-center gap-1">
                            {cats.map(c => (
                              <span key={c} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold border border-cyan-100 whitespace-nowrap">
                                {c}
                              </span>
                            ))}
                          </div>
                        );
                      }
                      if (student.rank) {
                        return (
                          <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold border border-cyan-100">
                            {student.rank}
                          </span>
                        );
                      }
                      return <span className="text-xs text-slate-300 font-medium italic">Chưa xếp lớp</span>;
                    })()}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">
                    {formatDisplayDate(student.registrationDate)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div
                          key={dot}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            dot <= 3 ? "bg-emerald-500" : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 w-28">
                      <div className="flex items-center text-xs font-bold">
                        {(() => {
                          const totalFeeNum = parseInt(String(student.fee).replace(/\D/g, ''), 10) || 0;
                          const paidSoFar = student.paidAmount || 0;
                          const remaining = totalFeeNum - paidSoFar;
                          return (
                            <>
                              {remaining > 0 ? (
                                <span className="text-rose-500 whitespace-nowrap">-{formatVND(remaining)}đ</span>
                              ) : (
                                <span className="text-emerald-600 whitespace-nowrap">Đã hoàn tất</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {(() => {
                          const totalFeeNum = parseInt(String(student.fee).replace(/\D/g, ''), 10) || 0;
                          const paidSoFar = student.paidAmount || 0;
                          const percentage = totalFeeNum > 0 ? (paidSoFar / totalFeeNum) * 100 : 0;
                          return (
                            <div
                              className="h-full bg-cyan-600 transition-all duration-500 ease-in-out"
                              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {(Array.isArray(student.status) ? student.status : [student.status]).map((st) => (
                        <span
                          key={st}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-none whitespace-nowrap",
                            getStatusBadgeClass(st)
                          )}
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingStudent(student)}
                        title="Sửa thông tin"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectStudent(student)}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setConfirmDeleteId(confirmDeleteId === student.id ? null : student.id)}
                          disabled={isDeleting === student.id}
                          title="Xóa"
                          className={cn(
                            "p-1.5 rounded-lg transition-colors disabled:opacity-50",
                            confirmDeleteId === student.id
                              ? "bg-rose-600 text-white"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {confirmDeleteId === student.id && (
                          <div className="absolute right-0 bottom-full mb-2 z-20">
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex flex-col gap-2 min-w-[140px]"
                            >
                              <p className="text-[10px] font-bold text-slate-800 text-center">Xóa học viên này?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleDelete(student)}
                                  className="flex-1 py-1 text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-all shadow-md shadow-rose-100"
                                >
                                  Xóa
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          itemName="học viên"
          className="pagination-bar"
        />
      </div>



      {/* Edit Student Modal */}
      <EditStudentModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={() => setEditingStudent(null)}
      />

      {/* Import Student Modal */}
      <ImportStudentModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => setIsImportOpen(false)}
      />
    </div>
  );
}
