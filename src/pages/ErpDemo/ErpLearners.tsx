import React, { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { 
  Search, Mail, Phone, Calendar, Banknote, ShieldAlert, Plus
} from 'lucide-react';
import { cn, parseVND } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { Student, StudentStatus } from '../../types';

export function ErpLearners({ darkMode = false }: { darkMode?: boolean }) {
  const { toast } = useState(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useToast();
  })[0];

  const { students: apiStudents, loading } = useStudents();
  const [addedStudents, setAddedStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newLearner, setNewLearner] = useState({
    fullName: '',
    phone: '',
    email: '',
    rank: '',
    area: '',
    fee: '',
    paidAmount: '',
    status: 'Đang học',
  });

  const handleAddLearner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearner.fullName || !newLearner.phone || !newLearner.rank || !newLearner.area || !newLearner.fee) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const feeNum = parseInt(newLearner.fee) || 0;
    const paidNum = parseInt(newLearner.paidAmount) || 0;
    const formattedFee = feeNum.toLocaleString('vi-VN');

    const created: Student = {
      id: 'mock-' + Date.now(),
      fullName: newLearner.fullName,
      phone: newLearner.phone,
      email: newLearner.email || undefined,
      rank: newLearner.rank as unknown as Student['rank'],
      area: newLearner.area as unknown as Student['area'],
      fee: formattedFee,
      paidAmount: paidNum,
      status: newLearner.status as StudentStatus,
      registrationDate: new Date().toLocaleDateString('vi-VN'),
      address: 'Hà Nội',
      birthday: '1995-01-01',
      idCard: '001095000000',
      ownerId: 'mock-owner',
    };

    setAddedStudents([created, ...addedStudents]);
    setShowAddModal(false);
    setNewLearner({
      fullName: '',
      phone: '',
      email: '',
      rank: '',
      area: '',
      fee: '',
      paidAmount: '',
      status: 'Đang học',
    });
    toast.success(`Đã thêm mới hồ sơ học viên ${created.fullName} thành công!`);
  };

  const allStudents = [...addedStudents, ...apiStudents];

  const filteredStudents = allStudents.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.phone.includes(searchTerm) || 
                          (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && (s.status === 'Đang học' || s.status === 'Đang thi')) ||
                          (statusFilter === 'debt' && (s.paidAmount || 0) < parseInt(parseVND(s.fee) || '0')) ||
                          (statusFilter === 'inactive' && (s.status === 'Nghỉ học'));
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Quản lý Học viên</h3>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Tra cứu thông tin hồ sơ, tiến độ đào tạo & học phí của học viên</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Thêm học viên mới
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm học viên bằng tên, số điện thoại hoặc email..."
            className={cn(
              "w-full h-11 border rounded-2xl pl-11 pr-4 text-xs font-semibold outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            )}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
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
            onClick={() => setStatusFilter('active')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'active' 
                ? "bg-brand-primary text-white font-black" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            )}
          >
            Đang học tập
          </button>
          <button
            onClick={() => setStatusFilter('debt')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
              statusFilter === 'debt' 
                ? "bg-brand-primary text-white font-black" 
                : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
            )}
          >
            Còn nợ học phí
          </button>
        </div>
      </div>

      {/* Learners Table Container */}
      <div className={cn(
        "rounded-[2.5rem] border backdrop-blur-md overflow-hidden transition-all duration-300",
        darkMode 
          ? "bg-slate-900/60 border-slate-800/80" 
          : "bg-white border-slate-100 shadow-sm shadow-slate-100/50"
      )}>
        {loading && allStudents.length === 0 ? (
          <div className="p-20 text-center text-slate-400 space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">Đang tải hồ sơ học viên...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-20 text-center text-slate-400 space-y-3">
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-slate-500", darkMode ? "bg-slate-800/40" : "bg-slate-100")}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className={cn("text-sm font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Không tìm thấy học viên nào</p>
            <p className="text-xs text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={cn(
                  "border-b text-[10px] font-black uppercase tracking-widest",
                  darkMode 
                    ? "border-slate-800/50 text-slate-400 bg-slate-950/20" 
                    : "border-slate-100 text-slate-550 bg-slate-50/50"
                )}>
                  <th className="py-4.5 px-6">Thông tin học viên</th>
                  <th className="py-4.5 px-6">Hạng học/Khóa</th>
                  <th className="py-4.5 px-6">Cơ sở/Khu vực</th>
                  <th className="py-4.5 px-6">Tài chính</th>
                  <th className="py-4.5 px-6">Trạng thái</th>
                  <th className="py-4.5 px-6">Đăng ký</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredStudents.map((student) => {
                  const totalFee = parseInt(parseVND(student.fee) || '0');
                  const debt = Math.max(0, totalFee - (student.paidAmount || 0));
                  const formattedPaid = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(student.paidAmount || 0);
                  const formattedDebt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt);

                  return (
                    <tr key={student.id} className={cn("transition-colors", darkMode ? "hover:bg-slate-800/10 text-slate-300" : "hover:bg-slate-50/40 text-slate-600")}>
                      {/* Name & Contact Info */}
                      <td className="py-4 px-6 space-y-1">
                        <div className={cn("font-black text-sm", darkMode ? "text-slate-200" : "text-slate-800")}>{student.fullName}</div>
                        <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
                          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-450" /> {student.phone}</span>
                          {student.email && (
                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-450" /> {student.email}</span>
                          )}
                        </div>
                      </td>

                      {/* Course / License Rank */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-xl bg-brand-primary/10 text-brand-primary font-black border border-brand-primary/15 uppercase tracking-wide">
                          Khóa hạng {student.rank}
                        </span>
                      </td>

                      {/* Area */}
                      <td className="py-4 px-6 font-bold">
                        {student.area}
                      </td>

                      {/* Finance */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã nộp: {formattedPaid}</span>
                        </div>
                        {debt > 0 ? (
                          <div className="text-rose-500 font-bold text-[10px]">
                            Còn nợ: {formattedDebt}
                          </div>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50/10 px-1.5 py-0.5 rounded-md">
                            Đã đóng đủ
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border shadow-sm",
                          student.status === 'Đang học' || student.status === 'Đang thi' || student.status === 'Đã đậu'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : student.status === 'Nghỉ học'
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {student.status}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 font-bold flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {student.registrationDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Learner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={cn(
            "relative w-full max-w-md p-8 rounded-[2rem] border shadow-2xl space-y-6 transition-all duration-300",
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-850"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-base font-black uppercase tracking-wider", darkMode ? "text-white" : "text-slate-800")}>Thêm học viên mới</h3>
              <button onClick={() => setShowAddModal(false)} className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-850")}>
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddLearner} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Họ và tên học viên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newLearner.fullName}
                  onChange={(e) => setNewLearner({ ...newLearner, fullName: e.target.value })}
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
                    placeholder="Ví dụ: 0912..."
                    value={newLearner.phone}
                    onChange={(e) => setNewLearner({ ...newLearner, phone: e.target.value })}
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
                    placeholder="Ví dụ: hocvien@gmail.com"
                    value={newLearner.email}
                    onChange={(e) => setNewLearner({ ...newLearner, email: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Khóa/Hạng học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: B2 / IELTS / TOEIC"
                    value={newLearner.rank}
                    onChange={(e) => setNewLearner({ ...newLearner, rank: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Khu vực / Cơ sở</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sân tập Sài Đồng / Cơ sở 1"
                    value={newLearner.area}
                    onChange={(e) => setNewLearner({ ...newLearner, area: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tổng học phí (VND)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 15500000"
                    value={newLearner.fee}
                    onChange={(e) => setNewLearner({ ...newLearner, fee: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Số tiền đã nộp (VND)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10000000"
                    value={newLearner.paidAmount}
                    onChange={(e) => setNewLearner({ ...newLearner, paidAmount: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Trạng thái học tập</label>
                <select
                  value={newLearner.status}
                  onChange={(e) => setNewLearner({ ...newLearner, status: e.target.value })}
                  className={cn(
                    "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all appearance-none",
                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                >
                  <option value="Đang học" className={darkMode ? "bg-slate-800" : "bg-white"}>Đang học</option>
                  <option value="Đang thi" className={darkMode ? "bg-slate-800" : "bg-white"}>Đang thi</option>
                  <option value="Đã đậu" className={darkMode ? "bg-slate-800" : "bg-white"}>Đã đậu</option>
                  <option value="Nghỉ học" className={darkMode ? "bg-slate-800" : "bg-white"}>Nghỉ học</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-sky-600 hover:from-brand-primary/90 hover:to-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20 active:scale-95 transition-all mt-4"
              >
                Lưu hồ sơ học viên
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
