import React, { useState } from 'react';
import { 
  Plus, Search, Calendar, DollarSign, 
  Users, Layers, Play
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

interface Course {
  id: string;
  code: string;
  title: string;
  category: 'Lái xe' | 'Ngoại ngữ' | 'Kỹ năng';
  fee: string;
  duration: string;
  activeBatches: number;
  maxLearners: number;
  status: 'Hoạt động' | 'Tạm dừng';
}

export function ErpCourses({ darkMode = false }: { darkMode?: boolean }) {
  const { toast } = useState(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useToast();
  })[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Mock initial courses list (Driving school + English center + generic training)
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', code: 'DRV-B2', title: 'Học lái xe Ô tô hạng B2 (Số sàn)', category: 'Lái xe', fee: '15.500.000đ', duration: '3.5 tháng', activeBatches: 6, maxLearners: 25, status: 'Hoạt động' },
    { id: '2', code: 'DRV-B1', title: 'Học lái xe Ô tô hạng B1 (Số tự động)', category: 'Lái xe', fee: '17.000.000đ', duration: '3.5 tháng', activeBatches: 4, maxLearners: 20, status: 'Hoạt động' },
    { id: '3', code: 'ENG-IELTS', title: 'Khóa luyện thi IELTS mục tiêu 6.5+', category: 'Ngoại ngữ', fee: '8.500.000đ', duration: '3 tháng', activeBatches: 3, maxLearners: 15, status: 'Hoạt động' },
    { id: '4', code: 'ENG-TOEIC', title: 'Luyện thi TOEIC 650+ Cam Kết Đầu Ra', category: 'Ngoại ngữ', fee: '5.200.000đ', duration: '8 tuần', activeBatches: 2, maxLearners: 20, status: 'Hoạt động' },
    { id: '5', code: 'SOFT-COMM', title: 'Kỹ năng giao tiếp & Thuyết trình chuyên nghiệp', category: 'Kỹ năng', fee: '2.500.000đ', duration: '4 tuần', activeBatches: 2, maxLearners: 30, status: 'Hoạt động' },
    { id: '6', code: 'DRV-C', title: 'Học lái xe tải hạng C', category: 'Lái xe', fee: '19.500.000đ', duration: '5 tháng', activeBatches: 1, maxLearners: 15, status: 'Tạm dừng' },
  ]);

  const [newCourse, setNewCourse] = useState<Omit<Course, 'id' | 'activeBatches' | 'status'>>({
    code: '',
    title: '',
    category: 'Lái xe',
    fee: '',
    duration: '',
    maxLearners: 20,
  });

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title || !newCourse.fee || !newCourse.duration) {
      toast.error('Vui lòng nhập đầy đủ thông tin khóa học.');
      return;
    }

    const formattedFee = newCourse.fee.endsWith('đ') ? newCourse.fee : `${newCourse.fee}đ`;
    const created: Course = {
      id: Date.now().toString(),
      code: newCourse.code.toUpperCase(),
      title: newCourse.title,
      category: newCourse.category,
      fee: formattedFee,
      duration: newCourse.duration,
      activeBatches: 0,
      maxLearners: newCourse.maxLearners,
      status: 'Hoạt động',
    };

    setCourses([created, ...courses]);
    setShowAddModal(false);
    setNewCourse({
      code: '',
      title: '',
      category: 'Lái xe',
      fee: '',
      duration: '',
      maxLearners: 20,
    });
    toast.success(`Đã thêm mới khóa học ${created.code} thành công!`);
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Danh mục Khóa học</h3>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Thiết lập chương trình đào tạo & lớp học hành chính</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm khóa học mới
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
            placeholder="Tìm theo tên hoặc mã khóa học..."
            className={cn(
              "w-full h-11 border rounded-2xl pl-11 pr-4 text-xs font-semibold outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            )}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'Lái xe', 'Ngoại ngữ', 'Kỹ năng'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                categoryFilter === cat 
                  ? "bg-brand-primary text-white font-black" 
                  : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
              )}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((c) => (
          <div 
            key={c.id} 
            className={cn(
              "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300 group",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20" 
                : "bg-white border-slate-100 hover:border-brand-primary/20 shadow-sm shadow-slate-100/50"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-500" : "text-slate-400")}>{c.code}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                  c.category === 'Lái xe' && "bg-brand-primary/10 text-brand-primary border border-brand-primary/15",
                  c.category === 'Ngoại ngữ' && "bg-sky-500/10 text-sky-400 border border-sky-500/15",
                  c.category === 'Kỹ năng' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15",
                )}>
                  {c.category}
                </span>
              </div>

              <h4 className={cn("text-sm font-black line-clamp-1 transition-colors", darkMode ? "text-slate-100 group-hover:text-white" : "text-slate-850 group-hover:text-slate-950")}>{c.title}</h4>

              <div className={cn("grid grid-cols-2 gap-y-3 gap-x-2 pt-2 text-[10px] font-bold border-t", darkMode ? "text-slate-400 border-slate-800/30" : "text-slate-550 border-slate-100")}>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {c.duration}</div>
                <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> {c.fee}</div>
                <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> Max: {c.maxLearners} HV</div>
                <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> {c.activeBatches} lớp đang chạy</div>
              </div>
            </div>

            <div className={cn("flex items-center justify-between pt-4 mt-2 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                c.status === 'Hoạt động' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border-rose-500/15"
              )}>
                {c.status}
              </span>
              <button className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all border",
                darkMode 
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent" 
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60"
              )}>
                <Play className="w-3 h-3 text-brand-primary" /> Chi tiết khóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={cn(
            "relative w-full max-w-md p-8 rounded-[2rem] border shadow-2xl space-y-6 transition-all duration-300",
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-base font-black uppercase tracking-wider", darkMode ? "text-white" : "text-slate-800")}>Thêm chương trình học mới</h3>
              <button onClick={() => setShowAddModal(false)} className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800")}>
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Mã khóa học (Viết tắt)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ENG-TOEIC"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tên chương trình đào tạo</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Luyện thi TOEIC 650+ Cam Kết Đầu Ra"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phân loại</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value as 'Lái xe' | 'Ngoại ngữ' | 'Kỹ năng' })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all appearance-none",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  >
                    <option value="Lái xe" className={darkMode ? "bg-slate-800" : "bg-white"}>Lái xe</option>
                    <option value="Ngoại ngữ" className={darkMode ? "bg-slate-800" : "bg-white"}>Ngoại ngữ</option>
                    <option value="Kỹ năng" className={darkMode ? "bg-slate-800" : "bg-white"}>Kỹ năng</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Thời lượng</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 3 tháng / 8 tuần"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Học phí cơ bản (VND)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 5.500.000"
                    value={newCourse.fee}
                    onChange={(e) => setNewCourse({ ...newCourse, fee: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tối đa học viên/Lớp</label>
                  <input
                    type="number"
                    value={newCourse.maxLearners}
                    onChange={(e) => setNewCourse({ ...newCourse, maxLearners: parseInt(e.target.value) || 20 })}
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
                Khởi tạo chương trình
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
