import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Settings, QrCode, ClipboardList, Database,
  CreditCard, Plus, Edit2, Trash2,
  CheckCircle2, Info, ShieldCheck, Download, Upload,
  FileJson, RotateCcw, ToggleLeft, Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';

type SettingsTab = 'Cấu hình hệ thống' | 'Quản lý dữ liệu' | 'Quản trị';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Cấu hình hệ thống');
  const { students } = useStudents();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [showResult, setShowResult] = useState<{ show: boolean, count: number, type: 'Restore' | 'Import' }>({ show: false, count: 0, type: 'Restore' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: SettingsTab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'Cấu hình hệ thống', icon: Settings, label: 'Cấu hình hệ thống' },
    { id: 'Quản lý dữ liệu', icon: Database, label: 'Quản lý dữ liệu' },
    { id: 'Quản trị', icon: ShieldCheck, label: 'Quản trị' },
  ];

  // Backup data
  const handleBackup = () => {
    if (students.length === 0) {
      alert("Không có dữ liệu học viên để xuất.");
      return;
    }

    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_hocvien_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pre-confirm before opening file picker
  const triggerRestore = () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thực hiện chức năng này.");
      return;
    }
    // Mở folder chọn file trực tiếp để đảm bảo tính tương tác cao nhất
    restoreInputRef.current?.click();
  };

  // Restore data
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setRestoreFileName(file.name);
    console.log(">>> [RESTORE] File selected:", file.name);

    setTimeout(async () => {
      const confirmMsg = `XÁC NHẬN KHÔI PHỤC DỮ LIỆU\n\n` +
        `Tên file: ${file.name}\n` +
        `Quy trình: Xóa sạch dữ liệu hiện có -> Nạp dữ liệu từ file này.\n\n` +
        `Bạn có chắc chắn muốn thực hiện không?`;

      if (!confirm(confirmMsg)) {
        setRestoreFileName('');
        if (restoreInputRef.current) restoreInputRef.current.value = '';
        return;
      }

      setIsProcessing(true);
      setProgress({ current: 0, total: 0, message: 'Đang chuẩn bị file...' });

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const jsonData = JSON.parse(content);

          if (!Array.isArray(jsonData)) {
            throw new Error("Dữ liệu trong file không hợp lệ (phải là một danh sách học viên).");
          }

          if (jsonData.length > 0) {
            const first = jsonData[0];
            if (!first.fullName && !first.name) {
              throw new Error("Cấu trúc học viên trong file không hợp lệ. Vui lòng kiểm tra lại file backup.");
            }
          }

          const total = jsonData.length;
          console.log(`>>> [RESTORE] Found ${total} students in JSON.`);
          setProgress({ current: 0, total: 1, message: 'Đang xóa sạch dữ liệu cũ...' });

          // Bước 1: Xóa trắng toàn bộ học viên hiện có (của User hiện tại)
          const currentStudentsRes = await apiFetch('/students', { params: { limit: 1000 } });
          const currentStudents = currentStudentsRes.students || [];

          let delCount = 0;
          for (const s of currentStudents) {
            await apiFetch(`/students/${s._id || s.id}`, { method: 'DELETE' });
            delCount++;
            setProgress({ current: delCount, total: currentStudents.length, message: `Đang xóa cũ: ${delCount}/${currentStudents.length}` });
          }

          // Bước 2: Nạp dữ liệu mới
          setProgress({ current: 0, total, message: 'Đang đồng bộ dữ liệu mới...' });
          let addedCount = 0;

          for (const item of jsonData) {
            const cleanData = { ...item };
            delete cleanData.id;
            delete cleanData._id;
            delete cleanData.ownerId;
            delete cleanData.createdAt;
            delete cleanData.updatedAt;

            const createFields = {
              fullName: cleanData.fullName || cleanData.name,
              phone: cleanData.phone,
              email: cleanData.email || "",
              referral: cleanData.referral || "",
              birthday: cleanData.birthday || "",
              idCard: cleanData.idCard || "",
              rank: cleanData.rank,
              area: cleanData.area,
              registrationDate: cleanData.registrationDate,
              fee: cleanData.fee,
              address: cleanData.address || "",
              status: cleanData.status,
            };

            const createRes = await apiFetch('/students', {
              method: 'POST',
              body: JSON.stringify(createFields),
            });

            if (createRes.success && createRes.data) {
              const newId = createRes.data._id || createRes.data.id;

              const updateFields = {
                healthCheckDate: cleanData.healthCheckDate || "",
                healthCheckNotes: cleanData.healthCheckNotes || "",
                healthCheckFiles: cleanData.healthCheckFiles || [],
                progress: cleanData.progress,
                exams: cleanData.exams,
                paymentHistory: cleanData.paymentHistory,
                examId: cleanData.examId || "",
                examName: cleanData.examName || "",
                examDate: cleanData.examDate || "",
              };

              await apiFetch(`/students/${newId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateFields),
              });
            }

            addedCount++;
            if (addedCount % 2 === 0 || addedCount === total) {
              setProgress({ current: addedCount, total, message: `Tiến độ: ${addedCount}/${total}` });
            }
          }

          console.log(`>>> [RESTORE] Successfully added ${addedCount} students.`);
          setShowResult({ show: true, count: addedCount, type: 'Restore' });
          window.dispatchEvent(new Event('student-mutation'));
        } catch (err: unknown) {
          console.error(">>> [RESTORE ERROR]:", err);
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
          alert("LỖI: " + msg);
        } finally {
          setIsProcessing(false);
          setRestoreFileName('');
          if (restoreInputRef.current) restoreInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }, 100);
  };

  // Import data
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: 0, message: 'Đang chuẩn bị nhập dữ liệu...' });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          if (!Array.isArray(jsonData)) throw new Error("File không đúng cấu hình mảng.");

          const total = jsonData.length;
          let addedCount = 0;

          for (const item of jsonData) {
            const cleanData = { ...item };
            delete cleanData.id;
            delete cleanData._id;
            delete cleanData.ownerId;
            delete cleanData.createdAt;
            delete cleanData.updatedAt;

            const createFields = {
              fullName: cleanData.fullName || cleanData.name,
              phone: cleanData.phone,
              email: cleanData.email || "",
              referral: cleanData.referral || "",
              birthday: cleanData.birthday || "",
              idCard: cleanData.idCard || "",
              rank: cleanData.rank,
              area: cleanData.area,
              registrationDate: cleanData.registrationDate,
              fee: cleanData.fee,
              address: cleanData.address || "",
              status: cleanData.status,
            };

            const createRes = await apiFetch('/students', {
              method: 'POST',
              body: JSON.stringify(createFields),
            });

            if (createRes.success && createRes.data) {
              const newId = createRes.data._id || createRes.data.id;

              const updateFields = {
                healthCheckDate: cleanData.healthCheckDate || "",
                healthCheckNotes: cleanData.healthCheckNotes || "",
                healthCheckFiles: cleanData.healthCheckFiles || [],
                progress: cleanData.progress,
                exams: cleanData.exams,
                paymentHistory: cleanData.paymentHistory,
                examId: cleanData.examId || "",
                examName: cleanData.examName || "",
                examDate: cleanData.examDate || "",
              };

              await apiFetch(`/students/${newId}`, {
                method: 'PATCH',
                body: JSON.stringify(updateFields),
              });
            }

            addedCount++;
            if (addedCount % 2 === 0 || addedCount === total) {
              setProgress({ current: addedCount, total, message: `Đang nhập thêm: ${addedCount}/${total}` });
            }
          }

          setShowResult({ show: true, count: addedCount, type: 'Import' });
          window.dispatchEvent(new Event('student-mutation'));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
          alert("Lỗi: " + msg);
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt & Quản trị</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Quản lý cấu hình toàn bộ hệ thống và dữ liệu vận hành</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300",
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-sm shadow-indigo-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'Cấu hình hệ thống' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields Required Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Trường bắt buộc trong Form</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Họ và tên', 'Số điện thoại', 'Hạng bằng', 'Khu vực', 'Ngày sinh', 'CCCD/CMND', 'Email'].map((field) => (
                  <div key={field} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{field}</span>
                    <button className="text-indigo-600"><ToggleLeft className="w-8 h-8 opacity-40" /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tuition Stages */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Giai đoạn học phí</h3>
              </div>
              <div className="space-y-2">
                {['1. Đăng ký ban đầu', '2. Nộp hồ sơ khai giảng', '3. Học thực hành', '4. Thi sát hạch'].map((stage) => (
                  <div key={stage} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group">
                    <span className="text-xs font-bold text-slate-700">{stage}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={12} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-xs font-black text-slate-400 hover:border-indigo-200 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                  <Plus size={14} /> Thêm giai đoạn mới
                </button>
              </div>
            </div>

            {/* VietQR Settings */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 space-y-6 lg:col-span-2">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cấu hình VietQR & Chuyển khoản</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">Trạng thái VietQR</label>
                    <button className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 size={14} /> Đang bật
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                    <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                      <QrCode size={48} />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nội dung chuyển khoản mặc định</label>
                  <textarea
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600"
                    rows={4}
                    defaultValue="[Mã HV] - [Họ tên] - Nộp học phí khóa {hang}"
                  />
                  <p className="text-[10px] text-slate-400 italic font-medium">* Sử dụng các biến tương tự BOT Thông báo để cá nhân hóa nội dung.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Quản lý dữ liệu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {isProcessing && (
              <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 px-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Database className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-800">Cơ sở dữ liệu</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{progress.message}</p>
                  </div>
                  {progress.total > 0 && (
                    <div className="w-full space-y-2">
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-[10px] font-black text-indigo-600">
                        {Math.round((progress.current / progress.total) * 100)}% HOÀN TẤT
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {showResult.show && (
              <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle2 size={56} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-3xl font-black text-slate-900 leading-tight">
                      {showResult.type === 'Restore' ? 'Khôi phục Thành công!' : 'Nhập liệu Thành công!'}
                    </h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">
                      {showResult.type === 'Restore'
                        ? `Hệ thống đã được làm mới hoàn toàn với ${showResult.count} học viên từ bản sao.`
                        : `Đã thêm thành công ${showResult.count} học viên vào danh sách hiện tại của bạn.`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResult({ ...showResult, show: false })}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                  >
                    TUYỆT VỜI
                  </button>
                </motion.div>
              </div>
            )}

            <DataActionCard
              title="Backup (Xuất JSON)"
              description="Tải toàn bộ dữ liệu hiện tại về máy dưới dạng file .json để lưu trữ."
              icon={Download}
              actionLabel="Tải xuống Bản sao"
              color="indigo"
              onClick={handleBackup}
            />

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <DataActionCard
              title="Import (Nhập dữ liệu)"
              description="Tải lên file JSON để thêm mới học viên hoặc lịch thi hàng loạt."
              icon={Upload}
              actionLabel="Chọn file để Nhập"
              color="blue"
              onClick={() => fileInputRef.current?.click()}
            />

            <input
              type="file"
              ref={restoreInputRef}
              className="hidden"
              accept=".json"
              onChange={handleRestore}
            />
            <div className="flex flex-col space-y-3">
              <DataActionCard
                title="Restore (Khôi phục)"
                description="Khôi phục hệ thống về trạng thái của một bản backup cũ. Lưu ý: Sẽ ghi đè dữ liệu hiện tại."
                icon={RotateCcw}
                actionLabel="Tiến hành Khôi phục"
                color="rose"
                onClick={triggerRestore}
              />
              {restoreFileName && (
                <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-600">
                    <FileJson size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{restoreFileName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setRestoreFileName('');
                      if (restoreInputRef.current) restoreInputRef.current.value = '';
                    }}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className="md:col-span-3 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 p-6 flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 mb-1">An toàn dữ liệu</h4>
                <p className="text-xs font-medium text-indigo-600/80 leading-relaxed">
                  Chúng tôi khuyến nghị bạn nên Backup dữ liệu ít nhất một lần mỗi tuần. File backup có thể được dùng để khôi phục hoặc chuyển đổi dữ liệu sang các hệ thống khác.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Quản trị' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Sys Info */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Thông tin vận hành</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <SysStat label="Dung lượng DB" value="12.4 MB" />
                  <SysStat label="Uptime" value="99.9%" />
                  <SysStat label="Lần Backup cuối" value="2 giờ trước" />
                  <SysStat label="Phiên bản" value="v2.4.0-pro" />
                  <SysStat label="Yêu cầu API" value="1.2k / ngày" />
                  <SysStat label="Server Region" value="Asia-SE1" />
                </div>
              </div>

              {/* Admin Control */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kiểm soát cấu hình chung</h3>
                </div>
                <div className="space-y-4">
                  <AdminToggle label="Chế độ bảo trì hệ thống" disabled />
                  <AdminToggle label="Cho phép đăng ký tài khoản mới" enabled />
                  <AdminToggle label="Tự động Backup hằng ngày" enabled />
                  <AdminToggle label="Bật nhật ký hoạt động (Logs)" enabled />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-black mb-4">Quyền hạn Quản trị</h4>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                    Mọi thay đổi trong module này có thể ảnh hưởng trực tiếp đến sự ổn định của hệ thống. Vui lòng kiểm tra kỹ trước khi thực hiện.
                  </p>
                  <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-900/40 hover:bg-indigo-700 transition-all">
                    Xác thực quyền Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SysStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

function AdminToggle({ label, enabled = false, disabled = false }: { label: string, enabled?: boolean, disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic transition-all">
      <span className={cn("text-xs font-bold", disabled ? "text-slate-400" : "text-slate-700")}>{label}</span>
      <button className={cn(
        "relative w-12 h-6 rounded-full transition-all duration-300",
        enabled ? "bg-indigo-600" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
          enabled ? "left-7" : "left-1"
        )} />
      </button>
    </div>
  );
}

interface DataActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  actionLabel: string;
  color: 'indigo' | 'blue' | 'rose';
  onClick: () => void;
}

function DataActionCard({ title, description, icon: Icon, actionLabel, color, onClick }: DataActionCardProps) {
  const colorMap: Record<'indigo' | 'blue' | 'rose', string> = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100"
  };

  const btnColorMap: Record<'indigo' | 'blue' | 'rose', string> = {
    indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
    blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
    rose: "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex flex-col items-center text-center space-y-4 group">
      <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", colorMap[color])}>
        <Icon size={40} />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-xs font-medium text-slate-400 leading-relaxed px-4">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={cn("w-full py-4 mt-4 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95", btnColorMap[color])}
      >
        {actionLabel}
      </button>
    </div>
  );
}
