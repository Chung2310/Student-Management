import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Upload, Download, AlertCircle, 
  CheckCircle2, Loader2, AlertTriangle, Play 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface ImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedStudent {
  fullName: string;
  phone: string;
  rank: string;
  area: string;
  fee: string;
  paidAmount?: number;
  birthday?: string;
  idCard?: string;
  email?: string;
  referral?: string;
  address?: string;
}

interface ValidationRow {
  rowNum: number;
  data: ParsedStudent;
  isValid: boolean;
  errors: string[];
}

export function ImportStudentModal({ isOpen, onClose, onSuccess }: ImportStudentModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  // Stats
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    skippedCount: number;
    errors: { row: number; name: string; phone: string; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  // Generate and download sample Excel template
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        'Họ và tên', 'Số điện thoại', 'Hạng bằng', 'Khu vực', 'Học phí', 'Đã đóng', 'Còn nợ',
        'Ngày sinh', 'CCCD / CMND', 'Email', 'Người giới thiệu', 'Địa chỉ'
      ];
      const data = [
        ['Nguyễn Văn A', '0912345678', 'B2', 'Nội thành', '15.000.000', '15.000.000', '0', '25/12/1995', '123456789012', 'nva@gmail.com', 'Trần Văn B', '123 Đường Lê Lợi, Q.1'],
        ['Trần Thị B', '0987654321', 'A1', 'Ngoại thành', '3.500.000', '0', '3.500.000', '10/05/2000', '987654321098', 'ttb@gmail.com', '', '456 Đường Nguyễn Huệ, H.Hóc Môn'],
        ['Lê Văn C', '0905123456', 'C', 'Tỉnh lân cận', '18.000.000', '10.000.000', '8.000.000', '15/08/1990', '031090123456', 'lvc@gmail.com', '', 'Thành phố Biên Hòa, Đồng Nai']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 20 }, // Họ và tên
        { wch: 15 }, // Số điện thoại
        { wch: 10 }, // Hạng bằng
        { wch: 15 }, // Khu vực
        { wch: 15 }, // Học phí
        { wch: 15 }, // Đã đóng
        { wch: 15 }, // Còn nợ
        { wch: 12 }, // Ngày sinh
        { wch: 18 }, // CCCD / CMND
        { wch: 22 }, // Email
        { wch: 18 }, // Người giới thiệu
        { wch: 35 }  // Địa chỉ
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách học viên");
      XLSX.writeFile(wb, "mau_import_hoc_vien.xlsx");
      toast.success('Đã tải xuống file mẫu thành công!');
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error('Lỗi khi tải file mẫu.');
    }
  };

  // Map Hebrew-like excel columns to DB fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapHeaders = (row: any[]): Record<string, number> => {
    const map: Record<string, number> = {};
    row.forEach((cell, idx) => {
      if (!cell) return;
      const val = String(cell).trim().toLowerCase();
      if (val.includes('họ và tên') || val.includes('họ tên') || val === 'tên') {
        map['fullName'] = idx;
      } else if (val.includes('số điện thoại') || val.includes('sđt') || val.includes('điện thoại') || val === 'sdt') {
        map['phone'] = idx;
      } else if (val.includes('hạng bằng') || val.includes('hạng') || val === 'hang') {
        map['rank'] = idx;
      } else if (val.includes('khu vực') || val.includes('khu vuc')) {
        map['area'] = idx;
      } else if (val.includes('học phí') || val.includes('hoc phi')) {
        map['fee'] = idx;
      } else if (val.includes('đã đóng') || val.includes('da dong') || val === 'dong') {
        map['paidAmount'] = idx;
      } else if (val.includes('ngày sinh') || val.includes('ngay sinh') || val === 'năm sinh') {
        map['birthday'] = idx;
      } else if (val.includes('cccd') || val.includes('cmnd') || val.includes('định danh')) {
        map['idCard'] = idx;
      } else if (val.includes('email') || val.includes('thư điện tử')) {
        map['email'] = idx;
      } else if (val.includes('người giới thiệu') || val.includes('giới thiệu')) {
        map['referral'] = idx;
      } else if (val.includes('địa chỉ') || val.includes('dia chi') || val.includes('nơi ở')) {
        map['address'] = idx;
      }
    });
    return map;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setErrorMsg('Vui lòng chọn file Excel đúng định dạng (.xlsx, .xls, .csv)');
      return;
    }

    setFileName(file.name);
    setErrorMsg(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) return;
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length < 2) {
          setErrorMsg('File Excel không có dữ liệu hoặc thiếu tiêu đề cột.');
          return;
        }

        const headerMap = mapHeaders(rows[0]);
        
        // Check for minimal required columns
        const missingHeaders = [];
        if (headerMap['fullName'] === undefined) missingHeaders.push('Họ và tên');
        if (headerMap['phone'] === undefined) missingHeaders.push('Số điện thoại');
        if (headerMap['rank'] === undefined) missingHeaders.push('Hạng bằng');
        if (headerMap['area'] === undefined) missingHeaders.push('Khu vực');

        if (missingHeaders.length > 0) {
          setErrorMsg(`File thiếu các cột bắt buộc sau: ${missingHeaders.join(', ')}`);
          return;
        }

        const validationResults: ValidationRow[] = [];
        const seenPhones = new Set<string>();

        // Parse rows starting from index 1 (second row)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          // Skip completely empty rows
          if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
            continue;
          }

          const getCellValue = (field: string): string => {
            const idx = headerMap[field];
            if (idx === undefined || row[idx] === undefined || row[idx] === null) return '';
            return String(row[idx]).trim();
          };

          const rawFee = getCellValue('fee');
          // Format fee nicely (stripping currency characters to ensure clean digits)
          const cleanFeeNum = parseInt(rawFee.replace(/\D/g, ''), 10) || 0;
          const formattedFee = cleanFeeNum > 0 ? cleanFeeNum.toLocaleString('vi-VN') : '0';

          const rawPaid = getCellValue('paidAmount');
          const cleanPaidNum = parseInt(rawPaid.replace(/\D/g, ''), 10) || 0;

          const studentData: ParsedStudent = {
            fullName: getCellValue('fullName'),
            phone: getCellValue('phone'),
            rank: getCellValue('rank').toUpperCase(),
            area: getCellValue('area'),
            fee: formattedFee,
            paidAmount: cleanPaidNum,
            birthday: getCellValue('birthday'),
            idCard: getCellValue('idCard'),
            email: getCellValue('email'),
            referral: getCellValue('referral'),
            address: getCellValue('address')
          };

          // Validation
          const errors: string[] = [];
          if (!studentData.fullName) errors.push('Họ tên không được trống');
          if (cleanPaidNum > cleanFeeNum) {
            errors.push(`Số tiền đã đóng (${cleanPaidNum.toLocaleString('vi-VN')}đ) không được vượt quá học phí (${formattedFee}đ)`);
          }
          if (!studentData.phone) {
            errors.push('Số điện thoại không được trống');
          } else if (seenPhones.has(studentData.phone)) {
            errors.push('SĐT bị trùng lặp trong file');
          } else {
            seenPhones.add(studentData.phone);
          }

          const validRanks = ['A1', 'A2', 'B1', 'B2', 'C'];
          if (!studentData.rank) {
            errors.push('Hạng bằng không được trống');
          } else if (!validRanks.includes(studentData.rank)) {
            errors.push(`Hạng bằng '${studentData.rank}' không hợp lệ (A1, A2, B1, B2, C)`);
          }

          const validAreas = ['Nội thành', 'Ngoại thành', 'Tỉnh lân cận'];
          if (!studentData.area) {
            errors.push('Khu vực không được trống');
          } else if (!validAreas.includes(studentData.area)) {
            errors.push(`Khu vực '${studentData.area}' không hợp lệ (Nội thành, Ngoại thành, Tỉnh lân cận)`);
          }

          validationResults.push({
            rowNum: i + 1,
            data: studentData,
            isValid: errors.length === 0,
            errors
          });
        }

        if (validationResults.length === 0) {
          setErrorMsg('Không tìm thấy học viên hợp lệ nào trong file.');
        } else {
          setValidationRows(validationResults);
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        setErrorMsg('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const validData = validationRows
      .filter(r => r.isValid)
      .map(r => r.data);

    if (validData.length === 0) {
      toast.warning('Không có dòng dữ liệu hợp lệ nào để nhập.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch("/students/bulk", {
        method: "POST",
        body: JSON.stringify({ students: validData }),
      });

      if (res.success) {
        setImportResult({
          success: true,
          importedCount: res.importedCount,
          skippedCount: res.skippedCount,
          errors: res.errors || []
        });

        // Dispatch mutation to refresh lists
        window.dispatchEvent(new Event("student-mutation"));
        toast.success(`Đã nhập thành công ${res.importedCount} học viên!`);
        
        if (res.errors && res.errors.length === 0 && res.skippedCount === 0) {
          // If 100% success with zero errors, auto close after a short delay
          setTimeout(() => {
            handleReset();
            onSuccess();
            onClose();
          }, 1500);
        }
      }
    } catch (error: unknown) {
      console.error("Error importing bulk students:", error);
      const msg = error instanceof Error ? error.message : "Lỗi khi gửi yêu cầu nhập học viên.";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setValidationRows([]);
    setFileName('');
    setErrorMsg(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalValid = validationRows.filter(r => r.isValid).length;
  const totalErrors = validationRows.filter(r => !r.isValid).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isUploading) onClose();
          }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nhập danh sách học viên</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Hỗ trợ định dạng file Excel (.xlsx, .xls, .csv)</p>
            </div>
            <button 
              onClick={onClose}
              disabled={isUploading}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 min-h-[300px]">
            {errorMsg && (
              <div className="p-4 mb-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-800">Phát hiện lỗi</h4>
                  <p className="text-xs font-semibold text-rose-600 mt-1">{errorMsg}</p>
                </div>
                <button 
                  onClick={() => setErrorMsg(null)}
                  className="p-1 hover:bg-rose-100 rounded-lg text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Results Screen */}
            {importResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm shadow-emerald-50">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Kết quả nhập dữ liệu</h3>
                  <p className="text-slate-500 text-sm mt-1">Đã xử lý xong danh sách học viên từ file <strong>{fileName}</strong></p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-2xl font-black text-emerald-600">{importResult.importedCount}</span>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Học viên mới đã tạo</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <span className="text-2xl font-black text-amber-500">{importResult.skippedCount}</span>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Dòng bị bỏ qua/Lỗi</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden max-w-2xl mx-auto text-left">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chi tiết dòng lỗi/bỏ qua ({importResult.errors.length})</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 text-xs">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="p-3 hover:bg-slate-50/50 flex gap-4">
                          <span className="font-bold text-rose-500 w-16 text-center">Dòng {err.row}</span>
                          <span className="font-bold text-slate-700 w-24 truncate">{err.name || 'N/A'}</span>
                          <span className="text-slate-400 w-24">{err.phone || 'N/A'}</span>
                          <span className="text-slate-500 flex-1">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                  >
                    Nhập file khác
                  </button>
                  <button
                    onClick={() => {
                      handleReset();
                      onSuccess();
                      onClose();
                    }}
                    className="px-6 py-2.5 bg-brand-primary text-white hover:bg-brand-primary/90 rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all"
                  >
                    Hoàn tất
                  </button>
                </div>
              </motion.div>
            ) : validationRows.length === 0 ? (
              /* Step 1: Upload Drag & Drop */
              <div className="space-y-6">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center group ${
                    isDragging 
                      ? 'border-brand-primary bg-cyan-50/30' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".xlsx,.xls,.csv"
                  />
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-105 group-hover:text-brand-primary transition-all duration-300 shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 mt-4">Kéo & thả file Excel của bạn vào đây</h3>
                  <p className="text-xs text-slate-400 mt-1">hoặc click để chọn file từ máy tính của bạn</p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-100 text-brand-primary shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Chưa có file mẫu?</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Tải ngay file mẫu chuẩn của hệ thống để nhập dữ liệu chính xác và không bị lỗi.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shrink-0 shadow-sm"
                  >
                    Tải file mẫu (.xlsx)
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Preview & Validation Table */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Stats Summary Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tên file:</span>
                    <span className="text-sm font-bold text-slate-800">{fileName}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-xs font-bold">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>{totalValid} Hợp lệ</span>
                    </div>
                    {totalErrors > 0 && (
                      <div className="flex items-center gap-2 text-rose-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>{totalErrors} Lỗi</span>
                      </div>
                    )}
                    <button 
                      onClick={handleReset}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Đặt lại
                    </button>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto max-h-[350px] no-scrollbar">
                    <table className="w-full text-left text-xs min-w-[800px]">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-slate-400 font-bold text-center w-12">Dòng</th>
                          <th className="px-4 py-3 text-slate-400 font-bold w-40">Họ và tên</th>
                          <th className="px-4 py-3 text-slate-400 font-bold w-32">Số điện thoại</th>
                          <th className="px-3 py-3 text-slate-400 font-bold text-center w-16">Hạng</th>
                          <th className="px-3 py-3 text-slate-400 font-bold text-center w-28">Khu vực</th>
                          <th className="px-3 py-3 text-slate-400 font-bold w-24">Học phí</th>
                          <th className="px-3 py-3 text-slate-400 font-bold w-24">Đã đóng</th>
                          <th className="px-4 py-3 text-slate-400 font-bold">Trạng thái / Chi tiết lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {validationRows.map((row) => (
                          <tr key={row.rowNum} className={`hover:bg-slate-50/50 ${!row.isValid ? 'bg-rose-50/10' : ''}`}>
                            <td className="px-4 py-3 text-slate-400 text-center font-bold">{row.rowNum}</td>
                            <td className={`px-4 py-3 font-bold ${!row.isValid && row.errors.some(e => e.includes('Họ tên')) ? 'text-rose-500' : 'text-slate-800'}`}>
                              {row.data.fullName || <span className="text-slate-300 italic">Trống</span>}
                            </td>
                            <td className={`px-4 py-3 ${!row.isValid && row.errors.some(e => e.includes('điện thoại') || e.includes('trùng')) ? 'text-rose-500 font-bold' : 'text-slate-600'}`}>
                              {row.data.phone || <span className="text-slate-300 italic">Trống</span>}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                !row.isValid && row.errors.some(e => e.includes('Hạng'))
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                              }`}>
                                {row.data.rank || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center text-slate-500">
                              <span className={!row.isValid && row.errors.some(e => e.includes('Khu vực')) ? 'text-rose-500 font-bold' : ''}>
                                {row.data.area || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600 font-semibold">{row.data.fee}đ</td>
                            <td className="px-3 py-3 text-emerald-600 font-semibold">{(row.data.paidAmount || 0).toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3">
                              {row.isValid ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Hợp lệ</span>
                                </div>
                              ) : (
                                <div className="flex items-start gap-1.5 text-rose-500 font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{row.errors.join('; ')}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalErrors > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-800">Cảnh báo dữ liệu</h4>
                      <p className="text-[11px] font-semibold text-amber-600 mt-1">
                        Có <strong>{totalErrors} dòng dữ liệu bị lỗi</strong>. Các dòng này sẽ bị tự động bỏ qua, hệ thống sẽ chỉ tiến hành nhập <strong>{totalValid} dòng dữ liệu hợp lệ</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          {!importResult && (
            <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-slate-100 flex-shrink-0">
              <button 
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              
              {validationRows.length > 0 && (
                <button 
                  onClick={handleImport}
                  disabled={isUploading || totalValid === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  {isUploading ? 'Đang nhập dữ liệu...' : `Nhập ${totalValid} học viên hợp lệ`}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
