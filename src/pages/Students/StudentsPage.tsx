import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Search, Download, Printer, Plus,
  Eye, ChevronRight, Trash2, Pencil,
  X, Calendar as CalendarIcon, ChevronDown,
  Users, Bike, Car, Upload
} from 'lucide-react';
import { cn, formatVND, formatDisplayDate } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useToast } from '../../hooks/useToast';
import { Student } from '../../types';
import { apiFetch } from '../../lib/api';
import { StatusTransitionModal } from '../../components/Student/StatusTransitionModal';
import { EditStudentModal } from '../../components/Student/EditStudentModal';
import { ImportStudentModal } from '../../components/Student/ImportStudentModal';
import { Pagination } from '../../components/ui/Pagination';

interface StudentsPageProps {
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
}

type CategoryFilter = 'Tất cả' | 'Xe máy' | 'Ô tô';
type StatusFilter = 'Tất cả' | 'KSK' | 'Đã KSK' | 'Nộp HS' | 'Đang học' | 'Đang thi' | 'Đã đậu' | 'Thi lại' | 'Nghỉ học';

export function StudentsPage({ onSelectStudent, onAddStudent }: StudentsPageProps) {
  const { students, loading } = useStudents();
  const { toast } = useToast();
  const [category, setCategory] = useState<CategoryFilter>('Tất cả');
  const [status, setStatus] = useState<StatusFilter>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rankFilter, setRankFilter] = useState('Tất cả hạng');
  const [areaFilter, setAreaFilter] = useState('Tất cả khu vực');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [transitioningStudent, setTransitioningStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Reset to first page when filtering
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [category, status, searchQuery, startDate, endDate, rankFilter, areaFilter]);

  // Helper to parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredStudents = students.filter(student => {
    // 1. Category Filter
    if (category === 'Xe máy' && !['A1', 'A2'].includes(student.rank)) return false;
    if (category === 'Ô tô' && ['A1', 'A2'].includes(student.rank)) return false;

    // 2. Status Filter
    if (status !== 'Tất cả') {
      const statusMap: Record<string, string> = {
        'Nộp HS': 'Đã nộp HS',
        'KSK': 'Chờ KSK'
      };
      const normalizedStatus = statusMap[status] || status;
      if (student.status !== normalizedStatus) return false;
    }

    // 3. Rank Filter
    if (rankFilter !== 'Tất cả hạng' && student.rank !== rankFilter) return false;

    // 4. Area Filter
    if (areaFilter !== 'Tất cả khu vực' && student.area !== areaFilter) return false;

    // 5. Date Range Filter
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

    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const statusTabs: { label: StatusFilter; count?: number }[] = [
    { label: 'Tất cả', count: students.length },
    { label: 'KSK', count: students.filter(s => s.status === 'Chờ KSK').length },
    { label: 'Đã KSK', count: students.filter(s => s.status === 'Đã KSK').length },
    { label: 'Nộp HS', count: students.filter(s => s.status === 'Đã nộp HS').length },
    { label: 'Đang học', count: students.filter(s => s.status === 'Đang học').length },
    { label: 'Đang thi', count: students.filter(s => s.status === 'Đang thi').length },
    { label: 'Đã đậu', count: students.filter(s => s.status === 'Đã đậu').length },
    { label: 'Thi lại', count: students.filter(s => s.status === 'Thi lại').length },
    { label: 'Nghỉ học', count: students.filter(s => s.status === 'Nghỉ học').length },
  ];

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
      'Họ và tên', 'Số điện thoại', 'Hạng', 'Khu vực', 'Ngày đăng ký',
      'Tổng học phí', 'Đã đóng', 'Còn nợ', 'Trạng thái'
    ];

    const rows = filteredStudents.map(student => {
      const totalFeeNum = parseInt(String(student.fee).replace(/\D/g, ''), 10) || 0;
      const paidSoFar = student.paidAmount || 0;
      const remaining = totalFeeNum - paidSoFar;

      return [
        student.fullName,
        `\t${student.phone}`,
        student.rank,
        student.area,
        student.registrationDate,
        totalFeeNum,
        paidSoFar,
        remaining,
        student.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell ?? '').replace(/"/g, '""');
        return `"${cellStr}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_hoc_vien_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    const rowsHtml = filteredStudents.map(student => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${student.fullName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.phone}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.rank}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.area}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.registrationDate}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${student.status}</td>
      </tr>
    `).join('');

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
                <th>Hạng</th>
                <th>Khu vực</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
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

      {/* Primary Tabs */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'Tất cả', icon: Users },
          { id: 'Xe máy', icon: Bike },
          { id: 'Ô tô', icon: Car }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as CategoryFilter)}
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
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.label)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
              status === tab.label
                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px]",
                status === tab.label ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
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
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hạng bằng</label>
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
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Khu vực</label>
          <div className="relative">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-cyan-600"
            >
              <option>Tất cả khu vực</option>
              <option>Nội thành</option>
              <option>Ngoại thành</option>
              <option>Tỉnh lân cận</option>
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
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Hạng</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Khu vực</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Ngày ĐK</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tiến độ</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Học phí</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right no-print">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-400 text-sm italic">Đang nạp dữ liệu...</td></tr>
              ) : paginatedStudents.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-400 text-sm italic">Không tìm thấy học viên nào phù hợp với bộ lọc.</td></tr>
              ) : paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 no-print">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-800">{student.fullName}</span>
                      <span className="text-xs font-medium text-slate-400">{student.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded text-xs font-bold border border-cyan-100">
                      {student.rank}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">
                    {student.area}
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
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm whitespace-nowrap",
                      getStatusBadgeClass(student.status)
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 no-print">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTransitioningStudent(student)}
                        title="Chuyển trạng thái"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
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

      {/* Status Transition Modal */}
      <StatusTransitionModal
        student={transitioningStudent}
        isOpen={!!transitioningStudent}
        onClose={() => setTransitioningStudent(null)}
      />

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
