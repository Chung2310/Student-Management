import React, { useState } from 'react';
import { 
  Plus, Search, CheckCircle, Clock, AlertTriangle, UserCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';

interface Resource {
  id: string;
  name: string;
  type: 'ROOM' | 'VEHICLE' | 'EQUIPMENT';
  identifier: string; // Số phòng, Biển số xe, Serial thiết bị
  capacity: string;   // Sức chứa (ví dụ: "45 người" hoặc "1 học viên + 1 GV" hoặc "1 bộ")
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentBooking?: {
    purpose: string;
    time: string;
    by: string;
  };
}

export function ErpResources({ darkMode = false }: { darkMode?: boolean }) {
  const { toast } = useState(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useToast();
  })[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [resources, setResources] = useState<Resource[]>([
    // Rooms
    { id: '1', name: 'Phòng học Lý thuyết Lý trình 101', type: 'ROOM', identifier: 'P.101', capacity: '40 học viên', status: 'AVAILABLE' },
    { id: '2', name: 'Phòng máy tính Cabin Điện tử & Mô phỏng', type: 'ROOM', identifier: 'P.102 (Cabin)', capacity: '15 học viên', status: 'OCCUPIED', currentBooking: { purpose: 'Thực hành Cabin lớp B2-K32', time: '14:00 - 16:30', by: 'Thầy Tuấn' } },
    { id: '3', name: 'Xe Toyota Vios tập lái số 08', type: 'VEHICLE', identifier: '30E-666.88', capacity: '1 học viên + 1 GV', status: 'AVAILABLE' },
    { id: '4', name: 'Xe tải tập lái JAC số 12', type: 'VEHICLE', identifier: '29C-999.00', capacity: '1 học viên + 1 GV', status: 'MAINTENANCE' },
    { id: '5', name: 'Máy chiếu Epson Projector B', type: 'EQUIPMENT', identifier: 'PJ-02', capacity: '1 phòng học', status: 'OCCUPIED', currentBooking: { purpose: 'Dạy học luật Giao thông đợt 1', time: '08:00 - 11:30', by: 'Thầy Cường' } },
    { id: '6', name: 'Xe Toyota Vios tập lái số 03', type: 'VEHICLE', identifier: '30F-555.22', capacity: '1 học viên + 1 GV', status: 'AVAILABLE' },
  ]);

  const [newResource, setNewResource] = useState({
    name: '',
    type: 'ROOM' as 'ROOM' | 'VEHICLE' | 'EQUIPMENT',
    identifier: '',
    capacity: '',
  });

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.name || !newResource.identifier || !newResource.capacity) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài nguyên.');
      return;
    }

    const created: Resource = {
      id: Date.now().toString(),
      name: newResource.name,
      type: newResource.type,
      identifier: newResource.identifier.toUpperCase(),
      capacity: newResource.capacity,
      status: 'AVAILABLE',
    };

    setResources([created, ...resources]);
    setShowAddModal(false);
    setNewResource({
      name: '',
      type: 'ROOM',
      identifier: '',
      capacity: '',
    });
    toast.success(`Đã thêm mới tài nguyên ${created.name} vào danh sách!`);
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className={cn("text-lg font-black tracking-tight", darkMode ? "text-white" : "text-slate-800")}>Quản lý Thiết bị & Tài nguyên</h3>
          <p className={cn("text-xs font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Khởi tạo, theo dõi hiện trạng và phân phối phòng học, xe tập lái và thiết bị trợ giảng</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-primary/10 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Khai báo tài nguyên mới
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
            placeholder="Tìm tài nguyên bằng tên hoặc số nhận diện..."
            className={cn(
              "w-full h-11 border rounded-2xl pl-11 pr-4 text-xs font-semibold outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 text-white" 
                : "bg-white border-slate-200 text-slate-800"
            )}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'ROOM', 'VEHICLE', 'EQUIPMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                typeFilter === type 
                  ? "bg-brand-primary text-white font-black" 
                  : (darkMode ? "bg-slate-900/60 text-slate-400 border border-slate-800/60 hover:bg-slate-800" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50")
              )}
            >
              {type === 'all' ? 'Tất cả' : type === 'ROOM' ? 'Phòng học' : type === 'VEHICLE' ? 'Phương tiện / Xe' : 'Thiết bị dạy'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredResources.map((r) => (
          <div 
            key={r.id} 
            className={cn(
              "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300",
              darkMode 
                ? "bg-slate-900/60 border-slate-800/80 backdrop-blur-md hover:border-brand-primary/20" 
                : "bg-white border-slate-100 hover:border-brand-primary/20 shadow-sm shadow-slate-100/50"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-slate-500" : "text-slate-400")}>{r.identifier}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                  r.type === 'ROOM' && "bg-blue-500/10 text-blue-400 border border-blue-500/15",
                  r.type === 'VEHICLE' && "bg-amber-500/10 text-amber-400 border border-amber-500/15",
                  r.type === 'EQUIPMENT' && "bg-brand-primary/10 text-brand-primary border border-brand-primary/15",
                )}>
                  {r.type === 'ROOM' ? 'Phòng' : r.type === 'VEHICLE' ? 'Xe tập' : 'Thiết bị'}
                </span>
              </div>

              <h4 className={cn("text-sm font-black line-clamp-1", darkMode ? "text-slate-100" : "text-slate-800")}>{r.name}</h4>
              <p className={cn("text-[10px] font-bold", darkMode ? "text-slate-400" : "text-slate-500")}>Khả năng đáp ứng: <span className={cn("font-black", darkMode ? "text-slate-200" : "text-slate-700")}>{r.capacity}</span></p>

              {/* Status Section */}
              <div className={cn("pt-3 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
                {r.status === 'AVAILABLE' && (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Sẵn sàng sử dụng</span>
                  </div>
                )}
                {r.status === 'MAINTENANCE' && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Đang bảo trì sửa chữa</span>
                  </div>
                )}
                {r.status === 'OCCUPIED' && r.currentBooking && (
                  <div className={cn("p-3 border rounded-xl space-y-1", darkMode ? "bg-brand-primary/10 border-brand-primary/20" : "bg-cyan-50/50 border-cyan-100/60")}>
                    <div className="flex items-center gap-1.5 text-brand-primary text-[10px] font-black uppercase">
                      <Clock className="w-3 h-3" />
                      <span>Đang bận: {r.currentBooking.time}</span>
                    </div>
                    <p className={cn("text-[10px] font-black truncate", darkMode ? "text-slate-200" : "text-slate-800")}>{r.currentBooking.purpose}</p>
                    <p className="text-[9px] font-bold text-slate-500">Đăng ký bởi: {r.currentBooking.by}</p>
                  </div>
                )}
              </div>
            </div>

            <div className={cn("flex items-center justify-end pt-4 mt-2 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
              <button 
                disabled={r.status !== 'AVAILABLE'}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                  r.status === 'AVAILABLE'
                    ? "bg-brand-primary hover:bg-brand-primary/95 border-transparent text-white shadow-md active:scale-95"
                    : (darkMode ? "bg-slate-800 text-slate-500 border-transparent cursor-not-allowed" : "bg-slate-100 text-slate-400 border-slate-200/50 cursor-not-allowed")
                )}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Đặt mượn
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={cn(
            "relative w-full max-w-md p-8 rounded-[2rem] border shadow-2xl space-y-6 transition-all duration-300",
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800"
          )}>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-base font-black uppercase tracking-wider", darkMode ? "text-white" : "text-slate-800")}>Khai báo tài nguyên mới</h3>
              <button onClick={() => setShowAddModal(false)} className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800")}>
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tên gọi tài nguyên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phòng Lab thực hành 102"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
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
                    value={newResource.type}
                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value as 'ROOM' | 'VEHICLE' | 'EQUIPMENT' })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all appearance-none",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  >
                    <option value="ROOM" className={darkMode ? "bg-slate-800" : "bg-white"}>Phòng học / Học phòng</option>
                    <option value="VEHICLE" className={darkMode ? "bg-slate-800" : "bg-white"}>Phương tiện / Xe tập lái</option>
                    <option value="EQUIPMENT" className={darkMode ? "bg-slate-800" : "bg-white"}>Thiết bị giảng dạy</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nhận diện / Số xe / Số phòng</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: P.102 / 30E-888.88"
                    value={newResource.identifier}
                    onChange={(e) => setNewResource({ ...newResource, identifier: e.target.value })}
                    className={cn(
                      "w-full h-11 border rounded-xl px-4 text-xs font-semibold outline-none focus:border-brand-primary transition-all",
                      darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Sức chứa / Khả năng đáp ứng</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 30 người / 2 người / 1 bộ"
                  value={newResource.capacity}
                  onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
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
                Khai báo tài nguyên
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
