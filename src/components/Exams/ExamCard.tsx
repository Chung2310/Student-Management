import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, UserPlus, Edit3, Trash2,
  CheckCircle2, MapPin, Map, UserMinus, RefreshCw,
  Download, Upload, Calendar as CalendarIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';
import { DrivingStudent, ExamSession, ExamStatus } from '../../types';

const handleDownloadTemplate = (exam: ExamSession, students: DrivingStudent[]) => {
  try {
    const headers = ['Họ và tên', 'Số điện thoại', 'Hạng bằng', 'Kết quả thi'];
    const data = students.map(s => {
      const examEntry = s.exams?.find(e => e.id === exam.id);
      const overall = examEntry?.result?.overall || 'Chưa có';
      return [s.fullName, s.phone, s.rank, overall];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Họ và tên
      { wch: 18 }, // Số điện thoại
      { wch: 12 }, // Hạng bằng
      { wch: 15 }  // Kết quả thi
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kết quả thi");
    XLSX.writeFile(wb, `mau_ket_qua_thi_${exam.name.replace(/\s+/g, '_')}.xlsx`);
  } catch (error) {
    console.error("Error generating exam template:", error);
  }
};

const handleExportResults = (exam: ExamSession, students: DrivingStudent[]) => {
  try {
    const headers = ['Họ và tên', 'Số điện thoại', 'Hạng bằng', 'Khu vực', 'Trạng thái học', 'Kết quả thi'];
    const data = students.map(s => {
      const examEntry = s.exams?.find(e => e.id === exam.id);
      const overall = examEntry?.result?.overall || 'Chưa có';
      return [s.fullName, s.phone, s.rank, s.area, s.status, overall];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Họ và tên
      { wch: 18 }, // Số điện thoại
      { wch: 12 }, // Hạng bằng
      { wch: 20 }, // Khu vực
      { wch: 18 }, // Trạng thái học
      { wch: 15 }  // Kết quả thi
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách học viên");
    XLSX.writeFile(wb, `ket_qua_thi_${exam.name.replace(/\s+/g, '_')}.xlsx`);
  } catch (error) {
    console.error("Error exporting exam results:", error);
  }
};

const handleUploadExcel = (
  e: React.ChangeEvent<HTMLInputElement>, 
  onImport: ((results: { phone: string; overallResult: 'Đậu' | 'Trượt' | 'Chưa có' }[]) => void) | undefined
) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  const file = files[0];

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | number | boolean | null | undefined)[][];

      if (rows.length < 2) {
        alert("File Excel rỗng hoặc thiếu dữ liệu.");
        return;
      }

      // Map columns
      const headers = rows[0].map(h => String(h).trim().toLowerCase());
      const phoneIdx = headers.findIndex(h => h.includes("điện thoại") || h.includes("sđt") || h.includes("phone"));
      const resultIdx = headers.findIndex(h => h.includes("kết quả") || h.includes("result") || h.includes("overall"));

      if (phoneIdx === -1 || resultIdx === -1) {
        alert("Không tìm thấy các cột 'Số điện thoại' và 'Kết quả thi' trong file Excel.");
        return;
      }

      const resultsList: { phone: string; overallResult: 'Đậu' | 'Trượt' | 'Chưa có' }[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const phone = row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
        let overallResult = row[resultIdx] ? String(row[resultIdx]).trim() : 'Chưa có';

        if (!phone) continue;

        // Normalise result values
        if (overallResult.toLowerCase() === 'đậu' || overallResult.toLowerCase() === 'pass') {
          overallResult = 'Đậu';
        } else if (overallResult.toLowerCase() === 'trượt' || overallResult.toLowerCase() === 'fail' || overallResult.toLowerCase() === 'rớt') {
          overallResult = 'Trượt';
        } else {
          overallResult = 'Chưa có';
        }

        resultsList.push({
          phone,
          overallResult: overallResult as 'Đậu' | 'Trượt' | 'Chưa có'
        });
      }

      if (resultsList.length === 0) {
        alert("Không tìm thấy dòng dữ liệu nào hợp lệ trong file Excel.");
        return;
      }

      onImport?.(resultsList);
    } catch (err) {
      console.error("Failed to process Excel file:", err);
      alert("Lỗi xử lý file Excel.");
    }
  };
  reader.readAsBinaryString(file);
  e.target.value = ''; // Reset input element
};

export interface ExamCardProps {
  exam: ExamSession;
  assignedStudents: DrivingStudent[];
  getStatusInfo: (status: ExamStatus) => { 
    color: string; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
  };
  onDelete: () => void | Promise<unknown>;
  onEdit: () => void | Promise<unknown>;
  onStatusClick: () => void | Promise<unknown>;
  onAssignClick: () => void | Promise<unknown>;
  onUnassignStudent?: (studentId: string) => void | Promise<unknown>;
  onUpdateStudentResult?: (studentId: string, result: 'Đậu' | 'Trượt' | 'Chưa có') => void | Promise<unknown>;
  onImportExcelResults?: (results: { phone: string; overallResult: 'Đậu' | 'Trượt' | 'Chưa có' }[]) => void | Promise<unknown>;
}

export const ExamCard: React.FC<ExamCardProps> = ({ 
  exam, 
  assignedStudents, 
  getStatusInfo, 
  onDelete, 
  onEdit, 
  onStatusClick, 
  onAssignClick, 
  onUnassignStudent, 
  onUpdateStudentResult, 
  onImportExcelResults 
}) => {
  const status = getStatusInfo(exam.status);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusClick(); }}
                title="Thay đổi trạng thái đợt thi"
                className={cn("flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border hover:opacity-80 transition-opacity active:scale-95", status.color)}
              >
                <status.icon className="w-3 h-3 sm:w-4 h-4" /> {status.label}
              </button>
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
              title="Xếp học viên"
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all border border-slate-200 bg-white shadow-sm active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Sửa đợt thi"
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 bg-white shadow-sm active:scale-95"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Xóa đợt thi"
              className="p-2 sm:p-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-md shadow-rose-100 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusClick(); }}
              title="Cập nhật trạng thái"
              className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all border border-slate-200 bg-white shadow-sm active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              title={isExpanded ? "Thu gọn" : "Xem học viên"}
              className={cn(
                "p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all border border-slate-100 active:scale-95",
                isExpanded && "bg-slate-50 text-slate-600 border-slate-200"
              )}
            >
              <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isExpanded && "rotate-180")} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Student List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: "auto", opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             transition={{ duration: 0.2 }}
             className="border-t border-slate-100 bg-slate-50/50 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Danh sách học viên đăng ký ({assignedStudents.length} học viên)
                </h4>
                {assignedStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadTemplate(exam, assignedStudents)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold transition-all border border-cyan-100/50 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải mẫu Excel
                    </button>
                    <button
                      onClick={() => handleExportResults(exam, assignedStudents)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-100/50 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất kết quả
                    </button>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all border border-emerald-100/50 cursor-pointer shadow-sm active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      Nhập từ Excel
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => handleUploadExcel(e, onImportExcelResults)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {assignedStudents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Đợt thi này chưa xếp học viên nào.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Học viên</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Hạng</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Khu vực</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái học</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Kết quả</th>
                        <th className="px-4 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedStudents.map((student) => {
                        const examEntry = student.exams?.find(e => e.id === exam.id);
                        const resultText = examEntry?.result?.overall || 'Chưa có';
                        
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">{student.fullName}</span>
                                <span className="text-[9px] font-medium text-slate-400 mt-0.5">{student.phone}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-600 rounded text-[9px] font-black uppercase">
                                {student.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-slate-500">{student.area}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase",
                                student.status === 'Đã đậu' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                student.status === 'Đang thi' ? "bg-cyan-50 text-cyan-600 border border-cyan-100" :
                                "bg-slate-50 text-slate-500 border border-slate-100"
                              )}>
                                {student.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <select
                                value={resultText}
                                onChange={async (e) => {
                                  const val = e.target.value as "Đậu" | "Trượt" | "Chưa có";
                                  onUpdateStudentResult?.(student.id, val);
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded text-[10px] font-black uppercase outline-none border cursor-pointer transition-all focus:ring-4",
                                  resultText === 'Đậu' ? "bg-emerald-50 text-emerald-600 border-emerald-100 focus:ring-emerald-500/10" :
                                  resultText === 'Trượt' ? "bg-rose-50 text-rose-600 border-rose-100 focus:ring-rose-500/10" :
                                  "bg-slate-50 text-slate-500 border-slate-200 focus:ring-slate-500/10"
                                )}
                              >
                                <option value="Chưa có" className="bg-white text-slate-700 font-bold uppercase">Chưa có</option>
                                <option value="Đậu" className="bg-white text-emerald-600 font-bold uppercase">Đậu</option>
                                <option value="Trượt" className="bg-white text-rose-600 font-bold uppercase">Trượt</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Bạn có chắc chắn muốn xóa học viên ${student.fullName} khỏi đợt thi này?`)) {
                                    onUnassignStudent?.(student.id);
                                  }
                                }}
                                title="Xóa khỏi đợt thi"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
