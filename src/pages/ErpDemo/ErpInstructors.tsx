import React, { useState } from 'react';
import { 
  Plus, Search, Mail, Phone, Award
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

interface Instructor {
  id: string;
  name: string;
  avatarInitials: string;
  avatarBg: string;
  specializations: string[];
  phone: string;
  email: string;
  rating: number;
  activeClasses: number;
  status: 'Available' | 'On Leave' | 'Busy';
}

export function ErpInstructors({ darkMode = false }: { darkMode?: boolean }) {
  const { toast } = useState(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useToast();
  })[0];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [instructors, setInstructors] = useState<Instructor[]>([
    { id: '1', name: 'Thầy Hoàng Xuân Cường', avatarInitials: 'HC', avatarBg: 'bg-emerald-600', specializations: ['Lý thuyết B2/C', 'Thực hành sa hình B2'], phone: '0903.111.222', email: 'cuonghx@igen.vn', rating: 4.9, activeClasses: 4, status: 'Available' },
    { id: '2', name: 'Cô Nguyễn Thu Linh', avatarInitials: 'TL', avatarBg: 'bg-cyan-600', specializations: ['IELTS Speaking 7.5+', 'Tiếng Anh giao tiếp công sở'], phone: '0988.333.444', email: 'linhnt@igen.vn', rating: 4.8, activeClasses: 3, status: 'Available' },
    { id: '3', name: 'Thầy Phạm Anh Tuấn', avatarInitials: 'AT', avatarBg: 'bg-blue-600', specializations: ['Thực hành đường trường C', 'Kỹ năng lái xe an toàn'], phone: '0912.555.666', email: 'tuanpa@igen.vn', rating: 4.7, activeClasses: 2, status: 'Busy' },
    { id: '4', name: 'Mr. David Harrison', avatarInitials: 'DH', avatarBg: 'bg-amber-600', specializations: ['IELTS Writing 8.0+', 'Luyện đề Mock Test'], phone: '0905.777.888', email: 'david@igen.vn', rating: 5.0, activeClasses: 1, status: 'Available' },
    { id: '5', name: 'Cô Lê Thị Lan Anh', avatarInitials: 'LA', avatarBg: 'bg-rose-600', specializations: ['Tiếng Anh trẻ em Cambridge', 'TOEIC Listening'], phone: '0977.999.000', email: 'anhltl@igen.vn', rating: 4.6, activeClasses: 0, status: 'On Leave' },
  ]);

  const [newInstructor, setNewInstructor] = useState({
    name: '',
    phone: '',
    email: '',
    spec: '',
  });

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructor.name || !newInstructor.phone || !newInstructor.email || !newInstructor.spec) {
      toast.warning('Vui lòng điền đầy đủ các thông tin giảng viên.');
      return;
    }

    const nameParts = newInstructor.name.split(' ');
    const initials = nameParts.length > 1 
      ? nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
      : newInstructor.name.substring(0, 2);

    const bgs = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-fuchsia-600', 'bg-amber-600'];
    const randomBg = bgs[Math.floor(Math.random() * bgs.length)];

    const created: Instructor = {
      id: (instructors.length + 1).toString(),
      name: newInstructor.name,
      avatarInitials: initials.toUpperCase(),
      avatarBg: randomBg,
      specializations: newInstructor.spec.split(',').map(s => s.trim()),
      phone: newInstructor.phone,
      email: newInstructor.email,
      rating: 5.0,
      activeClasses: 0,
      status: 'Available'
    };

    setInstructors([...instructors, created]);
    setShowAddModal(false);
    setNewInstructor({
      name: '',
      phone: '',
      email: '',
      spec: '',
    });
    toast.success('Đã thêm giảng viên mới thành công!');
  };

  const filteredInstructors = instructors.filter(ins => {
    const matchesSearch = ins.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ins.specializations.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'available' && ins.status === 'Available') ||
                          (statusFilter === 'leave' && ins.status === 'On Leave');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Hồ sơ Giảng viên</h3>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Danh sách đội ngũ giáo viên, chuyên môn giảng dạy & phân công lớp</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm giảng viên mới
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
            placeholder="Tìm giảng viên theo tên hoặc chuyên môn..."
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
                ? "bg-brand-primary text-white" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300")
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'available' 
                ? "bg-brand-primary text-white" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300")
            )}
          >
            Sẵn sàng dạy
          </button>
          <button
            onClick={() => setStatusFilter('leave')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'leave' 
                ? "bg-brand-primary text-white" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300")
            )}
          >
            Đang nghỉ phép
          </button>
        </div>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInstructors.map((ins) => (
          <div 
            key={ins.id} 
            className={cn(
              "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20" 
                : "bg-white border-slate-100 shadow-sm shadow-slate-100/50 hover:border-brand-primary/20"
            )}
          >
            <div className="space-y-4">
              {/* Profile Head */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md",
                  ins.avatarBg
                )}>
                  {ins.avatarInitials}
                </div>
                <div className="min-w-0">
                  <h4 className={cn("text-sm font-black truncate", darkMode ? "text-slate-100" : "text-slate-800")}>{ins.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      ins.status === 'Available' && "bg-emerald-500",
                      ins.status === 'Busy' && "bg-amber-500",
                      ins.status === 'On Leave' && "bg-rose-500",
                    )} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", darkMode ? "text-slate-400" : "text-slate-500")}>
                      {ins.status === 'Available' ? 'Sẵn sàng' : ins.status === 'Busy' ? 'Đang bận' : 'Nghỉ phép'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specializations tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {ins.specializations.map((spec, sIdx) => (
                  <span key={sIdx} className={cn("px-2 py-0.5 border rounded-lg text-[9px] font-bold uppercase tracking-wide", darkMode ? "bg-slate-800/80 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600")}>
                    {spec}
                  </span>
                ))}
              </div>

              {/* Contact info list */}
              <div className={cn("space-y-2 pt-4 border-t text-[10px] font-bold", darkMode ? "border-slate-800/30 text-slate-400" : "border-slate-100 text-slate-500")}>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {ins.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {ins.email}</div>
              </div>
            </div>

            {/* Rating and active classes footer */}
            <div className={cn("flex items-center justify-between pt-4 mt-4 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span className={cn("text-[10px] font-black", darkMode ? "text-slate-200" : "text-slate-700")}>{ins.rating} / 5.0</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/10 px-2 py-1 rounded-xl">
                Đang dạy: {ins.activeClasses} lớp
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Instructor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={cn(
            "relative w-full max-w-md p-8 rounded-[2rem] border shadow-2xl space-y-6 transition-all duration-300",
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-base font-black uppercase tracking-wider", darkMode ? "text-white" : "text-slate-800")}>Thêm giảng viên mới</h3>
              <button onClick={() => setShowAddModal(false)} className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500")}>
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddInstructor} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Họ và tên giảng viên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Minh Thầy"
                  value={newInstructor.name}
                  onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 0905..."
                    value={newInstructor.phone}
                    onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Email liên hệ</label>
                  <input
                    type="email"
                    required
                    placeholder="Ví dụ: thay@igen.vn"
                    value={newInstructor.email}
                    onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Chuyên môn (Phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Node.js, Thiết kế Database, SQL"
                  value={newInstructor.spec}
                  onChange={(e) => setNewInstructor({ ...newInstructor, spec: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-sky-600 hover:from-brand-primary/90 hover:to-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20 active:scale-95 transition-all mt-4"
              >
                Lưu hồ sơ giảng viên
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
