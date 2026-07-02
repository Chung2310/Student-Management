import React, { useState } from 'react';
import { 
  Plus, Search, MapPin, 
  Clock, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

interface Exam {
  id: string;
  name: string;
  courseCode: string;
  date: string;
  time: string;
  location: string;
  type: 'Lý thuyết' | 'Thực hành' | 'Tổng hợp';
  candidateCount: number;
  status: 'Sắp diễn ra' | 'Đã hoàn thành' | 'Đã hủy';
}

export function ErpExams({ darkMode = false }: { darkMode?: boolean }) {
  const { toast } = useState(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useToast();
  })[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [exams, setExams] = useState<Exam[]>([
    { id: '1', name: 'Thi sát hạch tốt nghiệp khóa B2-K31', courseCode: 'DRV-B2', date: '12/07/2026', time: '07:30 - 17:00', location: 'Sân thi sát hạch trung tâm', type: 'Tổng hợp', candidateCount: 45, status: 'Sắp diễn ra' },
    { id: '2', name: 'Thi thử IELTS Mock Test nghe - đọc', courseCode: 'ENG-IELTS', date: '05/07/2026', time: '09:00 - 12:00', location: 'Phòng thực hành Lab 101', type: 'Lý thuyết', candidateCount: 18, status: 'Sắp diễn ra' },
    { id: '3', name: 'Thi lý thuyết Luật giao thông đường bộ', courseCode: 'DRV-C', date: '25/06/2026', time: '14:00 - 16:00', location: 'Phòng học lý thuyết 301', type: 'Lý thuyết', candidateCount: 20, status: 'Đã hoàn thành' },
    { id: '4', name: 'Thi kết thúc môn Kỹ năng mềm Batch 5', courseCode: 'SOFT-COMM', date: '30/06/2026', time: '15:30 - 17:00', location: 'Phòng học lý thuyết 301', type: 'Thực hành', candidateCount: 30, status: 'Đã hoàn thành' },
  ]);

  const [newExam, setNewExam] = useState({
    name: '',
    courseCode: '',
    date: '',
    time: '',
    location: '',
    type: 'Lý thuyết' as 'Lý thuyết' | 'Thực hành' | 'Tổng hợp',
    candidateCount: 15
  });

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.name || !newExam.courseCode || !newExam.date || !newExam.time || !newExam.location) {
      toast.error('Vui lòng nhập đầy đủ thông tin kỳ thi.');
      return;
    }

    const created: Exam = {
      id: Date.now().toString(),
      name: newExam.name,
      courseCode: newExam.courseCode.toUpperCase(),
      date: newExam.date,
      time: newExam.time,
      location: newExam.location,
      type: newExam.type,
      candidateCount: newExam.candidateCount,
      status: 'Sắp diễn ra'
    };

    setExams([created, ...exams]);
    setShowAddModal(false);
    setNewExam({
      name: '',
      courseCode: '',
      date: '',
      time: '',
      location: '',
      type: 'Lý thuyết',
      candidateCount: 15
    });
    toast.success(`Đã khởi tạo đợt thi ${created.name} thành công!`);
  };

  const filteredExams = exams.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ex.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'upcoming' && ex.status === 'Sắp diễn ra') ||
                          (statusFilter === 'completed' && ex.status === 'Đã hoàn thành');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Quản lý Kỳ thi & Lịch thi</h3>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Khởi tạo đợt thi tốt nghiệp, sát hạch, thi cuối khóa và quản lý điểm số</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo kỳ thi mới
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kỳ thi bằng tên hoặc mã chương trình học..."
            className={cn(
              "w-full h-11 border rounded-2xl pl-11 pr-4 text-xs font-semibold outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            )}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'all' 
                ? "bg-brand-primary text-white font-black" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'upcoming' 
                ? "bg-brand-primary text-white font-black" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            )}
          >
            Sắp diễn ra
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'completed' 
                ? "bg-brand-primary text-white font-black" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            )}
          >
            Đã hoàn thành
          </button>
        </div>
      </div>

      {/* Grid of exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExams.map((ex) => (
          <div 
            key={ex.id} 
            className={cn(
              "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20" 
                : "bg-white border-slate-100 hover:border-brand-primary/20 shadow-sm shadow-slate-100/50"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-500" : "text-slate-400")}>{ex.courseCode}</span>
                <span className={cn(
                  "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border",
                  ex.status === 'Sắp diễn ra' && "bg-blue-600/10 text-blue-400 border-blue-500/15",
                  ex.status === 'Đã hoàn thành' && "bg-emerald-600/10 text-emerald-400 border-emerald-500/15",
                  ex.status === 'Đã hủy' && "bg-rose-600/10 text-rose-400 border-rose-500/15"
                )}>
                  {ex.status}
                </span>
              </div>

              <h4 className={cn("text-sm font-black line-clamp-1", darkMode ? "text-slate-100" : "text-slate-800")}>{ex.name}</h4>

              <div className={cn("space-y-2 pt-4 border-t text-[10px] font-bold", darkMode ? "border-slate-800/30 text-slate-400" : "border-slate-100 text-slate-500")}>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {ex.date} ({ex.time})</div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {ex.location}</div>
                <div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /> Hình thức thi: {ex.type}</div>
              </div>
            </div>

            <div className={cn("flex items-center justify-between pt-4 mt-4 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
              <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 border border-brand-primary/10 px-2.5 py-1 rounded-xl">
                Sỹ số: {ex.candidateCount} thí sinh
              </span>
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all border",
                darkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent" 
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60"
              )}>
                Xem điểm số <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={cn(
            "relative w-full max-w-md p-8 rounded-[2rem] border shadow-2xl space-y-6 transition-all duration-300",
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-base font-black uppercase tracking-wider", darkMode ? "text-white" : "text-slate-800")}>Tạo đợt thi mới</h3>
              <button onClick={() => setShowAddModal(false)} className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800")}>
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tên kỳ thi / Đợt thi</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thi sát hạch B2 Tháng 8"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mã lớp học / Khóa học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: DRV-B2"
                    value={newExam.courseCode}
                    onChange={(e) => setNewExam({ ...newExam, courseCode: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hình thức thi</label>
                  <select
                    value={newExam.type}
                    onChange={(e) => setNewExam({ ...newExam, type: e.target.value as 'Lý thuyết' | 'Thực hành' | 'Tổng hợp' })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all appearance-none",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  >
                    <option value="Lý thuyết" className={darkMode ? "bg-slate-800" : "bg-white"}>Lý thuyết</option>
                    <option value="Thực hành" className={darkMode ? "bg-slate-800" : "bg-white"}>Thực hành</option>
                    <option value="Tổng hợp" className={darkMode ? "bg-slate-800" : "bg-white"}>Tổng hợp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ngày thi (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 15/07/2026"
                    value={newExam.date}
                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Thời gian thi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 08:00 - 11:30"
                    value={newExam.time}
                    onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Địa điểm thi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phòng Lab 102"
                    value={newExam.location}
                    onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Số lượng thí sinh dự kiến</label>
                  <input
                    type="number"
                    value={newExam.candidateCount}
                    onChange={(e) => setNewExam({ ...newExam, candidateCount: parseInt(e.target.value) || 10 })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-sky-600 hover:from-brand-primary/90 hover:to-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20 active:scale-95 transition-all mt-4"
              >
                Khởi tạo kỳ thi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
