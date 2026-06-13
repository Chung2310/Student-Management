import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Printer, FileText, Stethoscope, 
  BarChart2, Calendar, CreditCard, History,
  Sparkles, Loader2, Upload, Check, Plus,
  Trash2, File, AlertCircle, Bookmark, Save,
  Clock, TrendingUp, Trophy,
  Zap
} from 'lucide-react';
import { Student } from '../../types';
import { apiFetch } from '../../lib/api';
import { cn, formatVND, parseVND, formatDisplayDate } from '../../lib/utils';
import { analyzeStudentPerformance } from '../../services/geminiService';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

type TabType = 'Hồ sơ' | 'KSK' | 'Tiến độ học' | 'Lịch thi & KQ' | 'Học phí' | 'Lịch sử' | 'Trợ lý AI';

export function StudentDetailModal({ student: initialStudent, onClose }: StudentDetailModalProps) {
  const [student, setStudent] = React.useState<Student | null>(initialStudent);
  const [activeTab, setActiveTab] = React.useState<TabType>('Hồ sơ');
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isUpdatingKSK, setIsUpdatingKSK] = React.useState(false);
  const [isEditingProgress, setIsEditingProgress] = React.useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = React.useState(false);
  const [isEditingExams, setIsEditingExams] = React.useState(false);
  const [isUpdatingExams, setIsUpdatingExams] = React.useState(false);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  
  const [kskData, setKskData] = React.useState({
    status: student?.status === 'Chờ KSK' ? 'Pending' : 'Completed',
    date: student?.healthCheckDate || '',
    notes: student?.healthCheckNotes || '',
    files: student?.healthCheckFiles || []
  });

  const [progressData, setProgressData] = React.useState({
    theory: student?.progress?.theory || { completed: false, score: 0, lastDate: '' },
    practice: student?.progress?.practice || { hoursDone: 0, totalHours: 20 },
    cabin: student?.progress?.cabin || { hoursDone: 0, totalHours: 3 },
    dat: student?.progress?.dat || { kmDone: 0, totalKm: 810 },
    sim: student?.progress?.sim || { completed: false, lastDate: '' }
  });

  const [examData, setExamData] = React.useState(student?.exams || []);

  const fetchStudentDetail = React.useCallback(async () => {
    if (!initialStudent?.id) return;
    try {
      const res = await apiFetch(`/students/${initialStudent.id}`);
      if (res.success && res.student) {
        setStudent({ ...res.student, id: res.student._id || res.student.id });
      }
    } catch (error) {
      console.error("Error fetching student detail:", error);
    }
  }, [initialStudent]);

  // Sync realtime data
  React.useEffect(() => {
    if (!initialStudent?.id) {
      const timer = setTimeout(() => {
        setStudent(null);
      }, 0);
      return () => clearTimeout(timer);
    }
    
    // Set initially so it doesn't flicker
    const timer = setTimeout(() => {
      setStudent(initialStudent);
      fetchStudentDetail();
    }, 0);

    const handleMutation = () => {
      fetchStudentDetail();
    };

    window.addEventListener("student-mutation", handleMutation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("student-mutation", handleMutation);
    };
  }, [initialStudent, fetchStudentDetail]);

  // Sync data to forms when student changes (only if not actively editing)
  React.useEffect(() => {
    if (student) {
      const timer = setTimeout(() => {
        if (!isUpdatingKSK) {
          setKskData({
            status: student.status === 'Chờ KSK' ? 'Pending' : 'Completed',
            date: student.healthCheckDate || '',
            notes: student.healthCheckNotes || '',
            files: student.healthCheckFiles || []
          });
        }
        if (!isEditingProgress && !isUpdatingProgress) {
          setProgressData({
            theory: student.progress?.theory || { completed: false, score: 0, lastDate: '' },
            practice: student.progress?.practice || { hoursDone: 0, totalHours: 20 },
            cabin: student.progress?.cabin || { hoursDone: 0, totalHours: 3 },
            dat: student.progress?.dat || { kmDone: 0, totalKm: 810 },
            sim: student.progress?.sim || { completed: false, lastDate: '' }
          });
        }
        if (!isEditingExams && !isUpdatingExams) {
          setExamData(student.exams || []);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [student, isUpdatingKSK, isEditingProgress, isUpdatingProgress, isEditingExams, isUpdatingExams]);

  const tabs: TabType[] = ['Hồ sơ', 'KSK', 'Tiến độ học', 'Lịch thi & KQ', 'Học phí', 'Lịch sử', 'Trợ lý AI'];

  const handleUpdateExams = async () => {
    if (!student) return;
    setIsUpdatingExams(true);
    try {
      const studentsRes = await apiFetch("/students", { params: { limit: 1000 } });
      const allStudents = studentsRes.students || [];

      // 1. Update student data
      await apiFetch(`/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ exams: examData })
      });

      // 2. Update exam stats for each exam that was modified
      for (const exam of examData) {
        if (exam.id) {
          let passCount = 0;
          let failCount = 0;
          let studentCount = 0;

          allStudents.forEach((s: { _id: string; examId?: string; exams?: { id: string; result?: { overall?: string } }[] }) => {
            const studentExams = s._id === student.id ? examData : (s.exams || []);
            const isAssigned = s.examId === exam.id;
            if (isAssigned) {
              studentCount++;
            }
            const examEntry = studentExams.find((e: { id: string }) => e.id === exam.id);
            if (examEntry) {
              if (examEntry.result?.overall === 'Đậu') passCount++;
              else if (examEntry.result?.overall === 'Trượt') failCount++;
            }
          });

          await apiFetch(`/exams/${exam.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ passCount, failCount, studentCount })
          });
        }
      }

      setIsEditingExams(false);
      alert('Cập nhật lịch sử và thống kê thi thành công!');
      window.dispatchEvent(new Event('student-mutation'));
      window.dispatchEvent(new Event('exam-mutation'));
    } catch (error) {
      console.error("Exams Update failed:", error);
      alert("Lỗi cập nhật lịch sử thi: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    } finally {
      setIsUpdatingExams(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!student) return;
    setIsUpdatingProgress(true);
    try {
      await apiFetch(`/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ progress: progressData })
      });
      setIsEditingProgress(false);
      alert('Cập nhật tiến độ học tập thành công!');
      window.dispatchEvent(new Event('student-mutation'));
    } catch (error) {
      console.error("Progress Update failed:", error);
      alert("Lỗi cập nhật tiến độ học tập: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleUpdateKSK = async () => {
    if (!student) return;
    setIsUpdatingKSK(true);
    try {
      const updates: Record<string, string | { name: string; url: string; type: string; uploadedAt: string }[]> = {
        status: kskData.status === 'Completed' ? 'Đã KSK' : 'Chờ KSK',
        healthCheckDate: kskData.date,
        healthCheckNotes: kskData.notes,
        healthCheckFiles: kskData.files,
      };

      await apiFetch(`/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      alert('Cập nhật thông tin khám sức khỏe thành công!');
      window.dispatchEvent(new Event('student-mutation'));
    } catch (error) {
      console.error("KSK Update failed:", error);
      alert("Lỗi cập nhật thông tin KSK: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    } finally {
      setIsUpdatingKSK(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploadingFile(true);
    try {
      const newFiles = [];
      for (const file of Array.from(uploadedFiles) as File[]) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch("/upload", {
          method: "POST",
          body: formData,
        });

        if (res.success && res.data) {
          newFiles.push({
            name: res.data.name,
            url: res.data.url,
            type: res.data.type,
            uploadedAt: res.data.uploadedAt || new Date().toISOString()
          });
        }
      }

      setKskData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));
    } catch (err) {
      console.error("Lỗi khi tải tệp lên:", err);
      alert("Lỗi khi tải tệp lên: " + (err instanceof Error ? err.message : "Không rõ nguyên nhân"));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeFile = (index: number) => {
    setKskData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleAnalyze = async () => {
    if (!student) return;
    setLoading(true);
    const result = await analyzeStudentPerformance(student);
    setAnalysis(result);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'Đang thi': 'bg-purple-100 text-purple-700 border-purple-200',
      'Đã đậu': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Đang học': 'bg-blue-100 text-blue-700 border-blue-200',
      'Chờ KSK': 'bg-amber-100 text-amber-700 border-amber-200',
      'Thi lại': 'bg-rose-100 text-rose-700 border-rose-200',
      'Đã KSK': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Đã nộp HS': 'bg-blue-100 text-blue-700 border-blue-200',
      'Nợ học phí': 'bg-orange-100 text-orange-700 border-orange-200',
      'Nghỉ học': 'bg-slate-200 text-slate-600 border-slate-300',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <AnimatePresence>
      {student && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] overflow-hidden flex flex-col bg-slate-50 sm:rounded-[2rem] shadow-2xl"
          >
          {/* Header Section */}
          <div className="bg-white px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-100 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-indigo-100 shrink-0">
                  {student.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">{student.fullName}</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] sm:text-xs font-bold border border-indigo-100">
                      {student.rank}
                    </span>
                    <span className="text-slate-400 text-[10px] sm:text-xs font-medium">{student.area}</span>
                    <span className="text-slate-300 hidden sm:block">•</span>
                    <span className="text-slate-500 text-[10px] sm:text-xs font-medium">{student.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm",
                  getStatusColor(student.status)
                )}>
                  {student.status}
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95">
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    onClick={onClose}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6 sm:mt-8">
              <div className="flex items-center justify-start gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200",
                      activeTab === tab 
                        ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    <TabIcon tab={tab} />
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {activeTab === 'Hồ sơ' && (
                <div className="space-y-6">
                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50">
                    <FormField label="HỌ VÀ TÊN*" value={student.fullName} required />
                    <FormField label="NGÀY SINH" value={formatDisplayDate(student.birthday)} />
                    <FormField label="GIỚI TÍNH" value="Nam" type="select" />
                    <FormField label="SỐ ĐIỆN THOẠI" value={student.phone} />
                    <FormField label="EMAIL" value={student.email || 'Chưa cập nhật'} />
                    <FormField label="NGƯỜI GIỚI THIỆU" value={student.referral || 'Trực tiếp'} />
                    <FormField label="CCCD / CMND" value={student.idCard || 'Chưa cập nhật'} />
                    <FormField label="HANG BẰNG*" value={student.rank} required type="select" />
                    <FormField label="KHU VỰC*" value={student.area} required type="select" />
                    <div className="md:col-span-2">
                      <FormField label="NGÀY ĐĂNG KÝ" value={formatDisplayDate(student.registrationDate)} />
                    </div>
                    <div className="md:col-span-2">
                      <FormField label=" ĐỊA CHỈ" value={student.address || 'Chưa cập nhật'} />
                    </div>
                    <div className="md:col-span-2">
                      <FormField label=" TRẠNG THÁI" value={student.status} type="select" />
                    </div>
                    <div className="md:col-span-2">
                      <FormField label=" GHI CHÚ" value="" isTextArea />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'KSK' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Status & Info */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-indigo-500" /> Trạng thái KSK
                      </h3>
                      
                      <div className="space-y-4">
                        <button 
                          onClick={() => setKskData(prev => ({ ...prev, status: 'Completed' }))}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                            kskData.status === 'Completed' 
                              ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              kskData.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"
                            )}>
                              <Check className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className={cn("text-sm font-bold", kskData.status === 'Completed' ? "text-emerald-700" : "text-slate-600")}>Đã khám xong</p>
                              <p className="text-[10px] text-slate-400 font-medium">Học viên đã hoàn tất thủ tục</p>
                            </div>
                          </div>
                          {kskData.status === 'Completed' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </button>

                        <button 
                          onClick={() => setKskData(prev => ({ ...prev, status: 'Pending' }))}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                            kskData.status === 'Pending' 
                              ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/10" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              kskData.status === 'Pending' ? "bg-amber-500 text-white" : "bg-slate-50 text-slate-400"
                            )}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className={cn("text-sm font-bold", kskData.status === 'Pending' ? "text-amber-700" : "text-slate-600")}>Đang chờ khám</p>
                              <p className="text-[10px] text-slate-400 font-medium">Chưa có kết quả khám SK</p>
                            </div>
                          </div>
                          {kskData.status === 'Pending' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                        </button>
                      </div>

                      <div className="mt-8 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày khám thực tế</label>
                          <input 
                            type="text"
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                            value={kskData.date}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 8) val = val.substring(0, 8);
                              if (val.length > 4) {
                                val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
                              } else if (val.length > 2) {
                                val = val.substring(0, 2) + '/' + val.substring(2);
                              }
                              setKskData(prev => ({ ...prev, date: val }));
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú sức khỏe</label>
                          <textarea 
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none"
                            placeholder="Tình trạng thị lực, thính lực..."
                            value={kskData.notes}
                            onChange={(e) => setKskData(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleUpdateKSK}
                        disabled={isUpdatingKSK}
                        className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isUpdatingKSK ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thông tin KSK
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Files & Upload */}
                  <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" /> Tài liệu & Giấy tờ khám
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {kskData.files.length} Tệp tin
                        </span>
                      </div>

                      {/* Dropzone Simulation */}
                      <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] hover:bg-slate-50 transition-all cursor-pointer group mb-6">
                        <input type="file" multiple disabled={isUploadingFile} className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {isUploadingFile ? (
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6 text-indigo-500" />
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-700">
                          {isUploadingFile ? "Đang tải tệp lên..." : "Tải lên giấy khám sức khỏe"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Hỗ trợ định dạng JPG, PNG, PDF (Tối đa 5MB)</p>
                      </label>

                      {/* Files List */}
                      <div className="flex-1 overflow-y-auto min-h-[200px] space-y-3">
                        {kskData.files.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 opacity-40">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                              <Bookmark className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-400 italic">Chưa có tài liệu nào được tải lên.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {kskData.files.map((file, idx) => (
                              <div key={idx} className="group relative flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                  {file.type.includes('image') ? (
                                    <img src={file.url} alt="" className="w-full h-full object-cover rounded-xl" />
                                  ) : (
                                    <File className="w-5 h-5 text-indigo-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-slate-700 truncate">{file.name}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Đã tải lên: {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <button 
                                  onClick={() => removeFile(idx)}
                                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="absolute inset-0 ring-offset-2 focus:ring-2 ring-indigo-500 rounded-2xl outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Trợ lý AI' && (
                <div className="space-y-6">
                  <div className="p-8 sm:p-12 rounded-[2.5rem] bg-slate-900 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Trợ lý AI Phân tích Lộ trình</h3>
                      <p className="text-slate-400 max-w-lg mb-8 text-sm sm:text-base leading-relaxed">
                        Phân tích hồ sơ và đưa ra tư vấn lộ trình học tập, thi sát hạch tối ưu dựa trên khu vực và hạng bằng của học viên.
                      </p>

                      {!analysis ? (
                        <button
                          onClick={handleAnalyze}
                          disabled={loading}
                          className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-bold transition-all disabled:opacity-50 active:scale-95"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-purple-500" />}
                          {loading ? "Đang phân tích dữ liệu..." : "Phân tích hồ sơ ngay"}
                        </button>
                      ) : (
                        <div className="w-full text-left bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-white/10 animate-in fade-in zoom-in duration-500">
                          <div className="text-slate-200 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none text-sm sm:text-base">
                            {analysis}
                          </div>
                          <button
                            onClick={() => setAnalysis(null)}
                            className="mt-8 text-xs font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Làm mới phân tích
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Tiến độ học' && (
                <div className="space-y-8 pb-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Quy trình đào tạo học viên</h3>
                      <p className="text-slate-500 text-sm mt-1">Quản lý và cập nhật tiến độ học tập theo quy định của Tổng cục đường bộ.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (isEditingProgress) {
                          handleUpdateProgress();
                        } else {
                          setIsEditingProgress(true);
                        }
                      }}
                      disabled={isUpdatingProgress}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95",
                        isEditingProgress 
                          ? "bg-slate-900 text-white hover:bg-black" 
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                      )}
                    >
                      {isUpdatingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditingProgress ? <Save className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />)}
                      {isEditingProgress ? (isUpdatingProgress ? "Đang lưu..." : "Lưu tiến độ") : "Cập nhật tiến độ"}
                    </button>
                  </div>

                  {/* Procedural Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Phase 1: Foundation */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Giai đoạn 1: Đào tạo cơ bản</h4>
                      </div>
                      
                      <ProgressControlCard 
                        label="Lý thuyết & Pháp luật" 
                        isEditing={isEditingProgress}
                        checked={progressData.theory.completed}
                        onCheck={() => setProgressData(p => ({ ...p, theory: { ...p.theory, completed: !p.theory.completed } }))}
                        info={isEditingProgress ? (
                          <div className="mt-2 flex gap-2">
                            <input 
                              type="number" 
                              placeholder="Điểm"
                              value={progressData.theory.score}
                              onChange={(e) => setProgressData(p => ({ ...p, theory: { ...p.theory, score: parseInt(e.target.value) || 0 } }))}
                              className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                            />
                            <input 
                              type="text" 
                              placeholder="Ngày thi"
                              value={progressData.theory.lastDate}
                              onChange={(e) => setProgressData(p => ({ ...p, theory: { ...p.theory, lastDate: e.target.value } }))}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                            />
                          </div>
                        ) : (progressData.theory.completed ? `Đạt ${progressData.theory.score}đ • ${progressData.theory.lastDate}` : 'Chưa hoàn thành')}
                      />

                      <ProgressControlCard 
                        label="Ôn tập Mô phỏng (Sim)" 
                        isEditing={isEditingProgress}
                        checked={progressData.sim.completed}
                        onCheck={() => setProgressData(p => ({ ...p, sim: { ...p.sim, completed: !p.sim.completed } }))}
                        info={isEditingProgress ? (
                          <input 
                            type="text" 
                            placeholder="Ngày cập nhật"
                            value={progressData.sim.lastDate}
                            onChange={(e) => setProgressData(p => ({ ...p, sim: { ...p.sim, lastDate: e.target.value } }))}
                            className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" 
                          />
                        ) : (progressData.sim.completed ? `Cập nhật: ${progressData.sim.lastDate}` : 'Cần ôn 120 tình huống')}
                      />
                    </div>

                    {/* Phase 2: Practical */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">2</div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Giai đoạn 2: Kỹ năng lái xe</h4>
                      </div>

                      <ProgressControlCard 
                        label="Học Cabin điện tử" 
                        isEditing={isEditingProgress}
                        progress={{ current: progressData.cabin.hoursDone, total: progressData.cabin.totalHours, unit: 'h' }}
                        onValueChange={(val) => setProgressData(p => ({ ...p, cabin: { ...p.cabin, hoursDone: val } }))}
                      />

                      <ProgressControlCard 
                        label="Đường trường (DAT)" 
                        isEditing={isEditingProgress}
                        progress={{ current: progressData.dat.kmDone, total: progressData.dat.totalKm, unit: 'km' }}
                        onValueChange={(val) => setProgressData(p => ({ ...p, dat: { ...p.dat, kmDone: val } }))}
                      />
                    </div>

                    {/* Phase 3: Advanced */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">3</div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Giai đoạn 3: Sa hình & Tốt nghiệp</h4>
                      </div>
                      
                      <ProgressControlCard 
                        label="Thực hành Sa hình" 
                        isEditing={isEditingProgress}
                        progress={{ current: progressData.practice.hoursDone, total: progressData.practice.totalHours, unit: 'h' }}
                        onValueChange={(val) => setProgressData(p => ({ ...p, practice: { ...p.practice, hoursDone: val } }))}
                      />
                      
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center">
                        <Trophy className="w-8 h-8 text-slate-300 mb-3" />
                        <h5 className="text-sm font-bold text-slate-700">Chứng chỉ Tốt nghiệp</h5>
                        <p className="text-[10px] text-slate-400 mt-1">Tự động kích hoạt khi học viên hoàn thành mọi hạng mục đào tạo.</p>
                      </div>
                    </div>

                    {/* AI Suggestions for Progress */}
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-24 h-24 text-white" />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-white font-bold mb-2">Đề xuất lộ trình tiếp theo</h4>
                        <p className="text-indigo-100 text-xs leading-relaxed opacity-80 mb-6">
                          {student.status === 'Đang học' 
                            ? "Dựa trên tiến độ hiện tại, học viên cần tập trung chạy đủ km DAT để kịp tiến độ khóa thi tháng sau."
                            : "Vui lòng hoàn tất khám sức khỏe để nộp hồ sơ đăng ký thi."}
                        </p>
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest backdrop-blur-md transition-all">
                          Xem chi tiết đề xuất
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Lịch thi & KQ' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Lịch sử và Kết quả thi</h3>
                      <p className="text-slate-500 text-sm mt-1">Ghi nhận chi tiết kết quả thi Tốt nghiệp và Sát hạch quốc gia.</p>
                    </div>
                    <div className="flex gap-2">
                       {isEditingExams && (
                        <button 
                          onClick={() => {
                            const newExam = {
                              id: `e${Date.now()}`,
                              name: 'Kỳ thi mới',
                              date: new Date().toLocaleDateString('vi-VN'),
                              type: 'Sát hạch',
                              status: 'Sắp thi',
                              result: { theory: 0, practice: 0, simulation: 0, overall: 'Chờ kết quả' }
                            };
                            setExamData(prev => [...prev, newExam]);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Thêm đợt thi
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (isEditingExams) {
                            handleUpdateExams();
                          } else {
                            setIsEditingExams(true);
                          }
                        }}
                        disabled={isUpdatingExams}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95",
                          isEditingExams 
                            ? "bg-slate-900 text-white hover:bg-black" 
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                        )}
                      >
                        {isUpdatingExams ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditingExams ? <Save className="w-4 h-4" /> : <Calendar className="w-4 h-4" />)}
                        {isEditingExams ? (isUpdatingExams ? "Đang lưu..." : "Lưu kết quả") : "Cập nhật kỳ thi"}
                      </button>
                    </div>
                  </div>

                  {/* Summary of Last Result */}
                  {!isEditingExams && (
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                        <Trophy className="w-32 h-32" />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20">
                          <Trophy className="w-10 h-10 text-brand-primary" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Kết quả mới nhất</p>
                          <h4 className="text-2xl font-black">{examData.length > 0 ? examData[examData.length-1].name : "Chưa có dữ liệu thi"}</h4>
                          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                            {[
                              { label: 'Lý thuyết', val: examData.length > 0 ? `${examData[examData.length-1].result?.theory || '--'}` : '--' },
                              { label: 'Mô phỏng', val: examData.length > 0 ? `${examData[examData.length-1].result?.simulation || '--'}` : '--' },
                              { label: 'Thực hành', val: examData.length > 0 ? `${examData[examData.length-1].result?.practice || '--'}` : '--' }
                            ].map((item, i) => (
                              <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-center min-w-[100px]">
                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-tight">{item.label}</p>
                                <p className="text-sm font-bold text-white mt-0.5">{item.val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="px-8 py-4 bg-emerald-500 rounded-3xl text-center shadow-xl shadow-emerald-500/20">
                          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Tổng quát</p>
                          <p className="text-xl font-black text-white mt-1">
                             {examData.length > 0 ? (examData[examData.length-1].result?.overall || 'CHỜ KQ') : '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exam History List / Editor */}
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kỳ thi / Ngày</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Loại</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">LT (35đ)</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sim (50đ)</th>
                            <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sa hình</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Tổng kết</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {examData.length === 0 ? (
                             <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs italic">Chưa ghi nhận lịch sử thi.</td></tr>
                          ) : examData.map((exam, idx: number) => (
                            <tr key={exam.id || idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                {isEditingExams ? (
                                  <div className="space-y-1">
                                    <input 
                                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                                      value={exam.name}
                                      onChange={(e) => {
                                        const newExams = [...examData];
                                        newExams[idx].name = e.target.value;
                                        setExamData(newExams);
                                      }}
                                    />
                                    <input 
                                      className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                                      value={exam.date}
                                      onChange={(e) => {
                                        const newExams = [...examData];
                                        newExams[idx].date = e.target.value;
                                        setExamData(newExams);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-slate-800">{exam.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{exam.date}</p>
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {isEditingExams ? (
                                  <select 
                                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-1 py-1"
                                    value={exam.type}
                                    onChange={(e) => {
                                      const newExams = [...examData];
                                      newExams[idx].type = e.target.value;
                                      setExamData(newExams);
                                    }}
                                  >
                                    <option value="Tốt nghiệp">Tốt nghiệp</option>
                                    <option value="Sát hạch">Sát hạch</option>
                                  </select>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{exam.type}</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {isEditingExams ? (
                                  <input 
                                    type="number"
                                    className="w-12 text-sm font-bold text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1"
                                    value={exam.result?.theory || 0}
                                    onChange={(e) => {
                                      const newExams = [...examData];
                                      newExams[idx].result.theory = parseInt(e.target.value) || 0;
                                      setExamData(newExams);
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-slate-700">{exam.result?.theory || '--'}</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {isEditingExams ? (
                                  <input 
                                    type="number"
                                    className="w-12 text-sm font-bold text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1"
                                    value={exam.result?.simulation || 0}
                                    onChange={(e) => {
                                      const newExams = [...examData];
                                      newExams[idx].result.simulation = parseInt(e.target.value) || 0;
                                      setExamData(newExams);
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-slate-700">{exam.result?.simulation || '--'}</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {isEditingExams ? (
                                  <input 
                                    type="number"
                                    className="w-12 text-sm font-bold text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1"
                                    value={exam.result?.practice || 0}
                                    onChange={(e) => {
                                      const newExams = [...examData];
                                      newExams[idx].result.practice = parseInt(e.target.value) || 0;
                                      setExamData(newExams);
                                    }}
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-slate-700">{exam.result?.practice || '--'}</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isEditingExams ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <select 
                                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-1 py-1"
                                      value={exam.result?.overall}
                                      onChange={(e) => {
                                        const newExams = [...examData];
                                        newExams[idx].result.overall = e.target.value;
                                        setExamData(newExams);
                                      }}
                                    >
                                      <option value="Đậu">Đậu</option>
                                      <option value="Trượt">Trượt</option>
                                      <option value="Sắp thi">Sắp thi</option>
                                      <option value="Vắng thi">Vắng thi</option>
                                    </select>
                                    <button 
                                      onClick={() => {
                                        setExamData(prev => prev.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    exam.result?.overall === 'Đậu' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                    exam.result?.overall === 'Sát hạch' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                    "bg-rose-50 text-rose-600 border border-rose-100"
                                  )}>
                                    {exam.result?.overall || 'CHỜ KQ'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Học phí' && (
                <div className="space-y-6">
                  {/* Fee Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeeCard 
                      label="Tổng học phí" 
                      amount={parseInt(parseVND(student.fee))} 
                      icon={CreditCard}
                      color="text-slate-800"
                    />
                    <FeeCard 
                      label="Đã thanh toán" 
                      amount={student.paidAmount || 0} 
                      icon={Check}
                      color="text-emerald-600"
                      isPaid
                    />
                    <FeeCard 
                      label="Còn lại" 
                      amount={parseInt(parseVND(student.fee)) - (student.paidAmount || 0)} 
                      icon={AlertCircle}
                      color="text-rose-600"
                      isWarning
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payment History */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-500" /> Nhật ký đóng phí
                      </h3>
                      <div className="space-y-3">
                        {(student.paymentHistory || []).length > 0 ? (
                          student.paymentHistory?.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                                  <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-700">Thanh toán đợt {idx + 1}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{p.date} • {p.method}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-800">{formatVND(p.amount)}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p.recipient}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 opacity-30">
                            <History className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-xs font-bold text-slate-400 italic">Chưa có lịch sử thanh toán.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Payment Info */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4 shadow-inner shadow-indigo-100/50">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">Thông tin đóng phí</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Học viên cần hoàn tất học phí trước ngày thi sát hạch 15 ngày.</p>
                      
                      <div className="w-full mt-6 space-y-3">
                        <div className="p-3 bg-slate-900 rounded-xl text-left border border-slate-800 shadow-lg">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái hiện tại</p>
                          <p className="text-xs font-bold text-white mt-1">
                            {(student.paidAmount || 0) >= parseInt(parseVND(student.fee)) ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                          </p>
                        </div>
                        <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 mt-2">
                          Nhắc nhở đóng phí
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'Hồ sơ' && 
               activeTab !== 'KSK' && 
               activeTab !== 'Tiến độ học' && 
               activeTab !== 'Lịch thi & KQ' && 
               activeTab !== 'Học phí' && 
               activeTab !== 'Trợ lý AI' && (
                <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[2rem] border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                    <TabIcon tab={activeTab} size={32} />
                  </div>
                  <h3 className="text-slate-800 font-bold mb-2">Tính năng đang phát triển</h3>
                  <p className="text-slate-400 text-sm text-center">Chúng tôi đang cập nhật module {activeTab} sớm nhất có thể.</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}

interface ProgressControlCardProps {
  label: string;
  isEditing: boolean;
  checked?: boolean;
  onCheck?: () => void;
  info?: React.ReactNode;
  progress?: { current: number; total: number; unit?: string };
  onValueChange?: (val: number) => void;
}

function ProgressControlCard({ label, isEditing, checked, onCheck, info, progress, onValueChange }: ProgressControlCardProps) {
  const percent = progress ? (progress.current / progress.total) * 100 : 0;
  
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
      {progress && (
        <div className="absolute bottom-0 left-0 h-1 bg-slate-50 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={cn(
              "h-full transition-all duration-1000",
              percent >= 100 ? "bg-emerald-500" : "bg-indigo-500"
            )}
          />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {checked !== undefined && (
              <button 
                onClick={onCheck}
                disabled={!isEditing}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  checked 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100" 
                    : "bg-white border-slate-200"
                )}
              >
                {checked && <Check className="w-4 h-4" />}
              </button>
            )}
            <div>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              {info && !isEditing && <p className="text-xs text-slate-400 mt-0.5">{info}</p>}
            </div>
          </div>

          {(info || isEditing) && isEditing && (
            <div className="mt-4">
              {info}
            </div>
          )}

          {progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isEditing ? `Tổng yêu cầu: ${progress.total}${progress.unit}` : `Tiến độ: ${Math.round(percent)}%`}
                </p>
                <p className="text-sm font-black text-slate-800">
                   {progress.current}/{progress.total}{progress.unit}
                </p>
              </div>
              
              {isEditing && (
                <input 
                  type="range"
                  min="0"
                  max={progress.total}
                  value={progress.current}
                  onChange={(e) => onValueChange?.(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              )}
            </div>
          )}
        </div>
        
        {!isEditing && progress && percent >= 100 && (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}


interface FeeCardProps {
  label: string;
  amount: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isPaid?: boolean;
  isWarning?: boolean;
}

function FeeCard({ label, amount, icon: Icon, color, isPaid, isWarning }: FeeCardProps) {
  return (
    <div className={cn(
      "bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden",
      isPaid && "bg-emerald-50/20 border-emerald-100",
      isWarning && "bg-rose-50/20 border-rose-100"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm",
          color
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className={cn("text-2xl font-black tracking-tight", color)}>
        {formatVND(amount)}
      </p>
    </div>
  );
}

function TabIcon({ tab, size = 16 }: { tab: TabType, size?: number }) {
  switch (tab) {
    case 'Hồ sơ': return <FileText size={size} />;
    case 'KSK': return <Stethoscope size={size} />;
    case 'Tiến độ học': return <BarChart2 size={size} />;
    case 'Lịch thi & KQ': return <Calendar size={size} />;
    case 'Học phí': return <CreditCard size={size} />;
    case 'Lịch sử': return <History size={size} />;
    case 'Trợ lý AI': return <Sparkles size={size} />;
    default: return null;
  }
}

function FormField({ label, value, required = false, type = 'text', isTextArea = false }: { 
  label: string, 
  value: string, 
  required?: boolean, 
  type?: 'text' | 'select',
  isTextArea?: boolean
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2 group">
      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-brand-primary transition-colors">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {isTextArea ? (
        <textarea 
          placeholder="Nhập ghi chú..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all resize-none min-h-[100px]"
          readOnly
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={value}
            readOnly
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all cursor-default"
          />
          {type === 'select' && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L5 5L9 1" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
