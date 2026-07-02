import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, UserCheck, Warehouse, Trash2, Wrench, X, List, LayoutGrid, Plus, Tag
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useResources } from '../../hooks/useResources';
import { useResourceCategories } from '../../hooks/useResourceCategories';
import { ResourceItem } from '../../types';
import {
  ErpPageHeader, ErpPrimaryButton, ErpSearchBar, ErpFilterTab,
  ErpModal, ErpField, ErpInput, ErpSelect, ErpSubmitButton,
  ErpEmptyState, ErpLoadingState, ErpCard, ErpConfirmModal, ErpTableHead
} from '../../components/Erp/ErpUI';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'room' || t === 'phòng học') return "bg-blue-500/10 text-blue-400 border border-blue-500/15";
  if (t === 'vehicle' || t === 'xe tập lái' || t === 'phương tiện / xe') return "bg-amber-500/10 text-amber-400 border border-amber-500/15";
  if (t === 'equipment' || t === 'thiết bị' || t === 'thiết bị dạy') return "bg-brand-primary/10 text-brand-primary border border-brand-primary/15";

  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15",
    "bg-violet-500/10 text-violet-400 border border-violet-500/15",
    "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/15",
    "bg-pink-500/10 text-pink-400 border border-pink-500/15",
    "bg-amber-500/10 text-amber-400 border border-amber-500/15",
    "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15",
  ];
  return colors[Math.abs(hash) % colors.length];
};

export function ResourcesPage() {
  const darkMode = false;
  const { toast } = useToast();
  const { resources, loading } = useResources();
  const { categories, loading: categoriesLoading } = useResourceCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [bookingResource, setBookingResource] = useState<ResourceItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('erp_view_mode_resources') as 'list' | 'grid') || 'grid';
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const [newResource, setNewResource] = useState({
    name: '',
    type: '',
    identifier: '',
    capacity: '',
  });

  // Đồng bộ hóa phân loại đầu tiên làm mặc định khi danh sách phân loại được tải
  useEffect(() => {
    if (categories.length > 0 && !newResource.type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewResource(prev => ({ ...prev, type: categories[0].name }));
    }
  }, [categories, newResource.type]);

  // Tab lọc = phân loại đang quản lý + các phân loại cũ còn xuất hiện trong dữ liệu
  const typeOptions = useMemo(() => {
    const options = categories.map(c => c.name);
    for (const r of resources) {
      if (!options.includes(r.type)) options.push(r.type);
    }
    return options;
  }, [categories, resources]);

  const [newBooking, setNewBooking] = useState({
    purpose: '',
    by: '',
    date: todayStr(),
    startTime: '08:00',
    endTime: '11:30',
  });

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.name || !newResource.identifier || !newResource.capacity || !newResource.type) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài nguyên.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch('/resources', {
        method: 'POST',
        body: JSON.stringify({
          ...newResource,
          identifier: newResource.identifier.toUpperCase(),
        }),
      });
      window.dispatchEvent(new Event('resource-mutation'));
      setShowAddModal(false);
      toast.success(`Đã thêm mới tài nguyên ${newResource.name} vào danh sách!`);
      setNewResource({ name: '', type: categories[0]?.name || '', identifier: '', capacity: '' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi khai báo tài nguyên.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingResource) return;
    if (!newBooking.purpose || !newBooking.by || !newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      toast.error('Vui lòng nhập đầy đủ thông tin đặt lịch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(`/resources/${bookingResource.id}/bookings`, {
        method: 'POST',
        body: JSON.stringify(newBooking),
      });
      window.dispatchEvent(new Event('resource-mutation'));
      setBookingResource(null);
      setNewBooking({ purpose: '', by: '', date: todayStr(), startTime: '08:00', endTime: '11:30' });
      toast.success('Đã đặt lịch sử dụng tài nguyên thành công!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt lịch.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCategorySubmitting(true);
    try {
      await apiFetch('/resources/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName }),
      });
      window.dispatchEvent(new Event('resource-category-mutation'));
      setNewCategoryName('');
      toast.success('Đã thêm phân loại mới thành công!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Lỗi khi tạo phân loại.';
      toast.error(msg);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiFetch(`/resources/categories/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('resource-category-mutation'));
      toast.success('Đã xóa phân loại thành công.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa.';
      toast.error(msg);
    } finally {
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    }
  };

  const handleCancelBooking = async (resource: ResourceItem, bookingId?: string) => {
    if (!bookingId) return;
    try {
      await apiFetch(`/resources/${resource.id}/bookings/${bookingId}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('resource-mutation'));
      toast.success('Đã hủy lịch đặt.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy lịch.';
      toast.error(msg);
    }
  };

  const handleToggleMaintenance = async (resource: ResourceItem) => {
    const nextStatus = resource.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await apiFetch(`/resources/${resource.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      window.dispatchEvent(new Event('resource-mutation'));
      toast.success(nextStatus === 'MAINTENANCE'
        ? `${resource.name}: chuyển sang trạng thái bảo trì.`
        : `${resource.name}: đã sẵn sàng sử dụng trở lại.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật trạng thái.';
      toast.error(msg);
    }
  };

  const handleDelete = async (resource: ResourceItem) => {
    try {
      await apiFetch(`/resources/${resource.id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('resource-mutation'));
      toast.success(`Đã xóa tài nguyên ${resource.name}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa tài nguyên.';
      toast.error(msg);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getCurrentBooking = (r: ResourceItem) => {
    const now = new Date();
    const today = todayStr();
    const hhmm = now.toTimeString().slice(0, 5);
    return r.bookings.find(b => b.date === today && b.startTime <= hhmm && b.endTime > hhmm);
  };

  const getUpcomingBookings = (r: ResourceItem) => {
    const today = todayStr();
    return r.bookings
      .filter(b => b.date >= today)
      .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)))
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Quản lý Thiết bị & Tài nguyên"
        subtitle="Khởi tạo, theo dõi hiện trạng và phân phối phòng học, xe tập lái và thiết bị trợ giảng"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer shrink-0",
                darkMode
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              Quản lý phân loại
            </button>
            <ErpPrimaryButton onClick={() => setShowAddModal(true)}>
              Khai báo tài nguyên mới
            </ErpPrimaryButton>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Tìm tài nguyên bằng tên hoặc số nhận diện..." />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <ErpFilterTab active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
              Tất cả
            </ErpFilterTab>
            {typeOptions.map((type) => (
              <ErpFilterTab key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                {type}
              </ErpFilterTab>
            ))}
          </div>

          <div className={cn("flex items-center border p-1 rounded-xl gap-0.5 shrink-0", darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); localStorage.setItem('erp_view_mode_resources', 'list'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'list' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-850 shadow-sm") 
                  : "text-slate-400 hover:text-slate-650"
              )}
              title="Hiển thị dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('grid'); localStorage.setItem('erp_view_mode_resources', 'grid'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-855 shadow-sm") 
                  : "text-slate-400 hover:text-slate-600"
              )}
              title="Hiển thị dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List Content */}
      {loading && resources.length === 0 ? (
        <ErpCard><ErpLoadingState message="Đang tải danh sách tài nguyên..." /></ErpCard>
      ) : filteredResources.length === 0 ? (
        <ErpCard>
          <ErpEmptyState
            icon={Warehouse}
            title="Chưa có tài nguyên nào"
            subtitle="Bấm 'Khai báo tài nguyên mới' để thêm phòng học, xe tập lái hoặc thiết bị."
          />
        </ErpCard>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((r) => {
            const currentBooking = getCurrentBooking(r);
            const upcomingBookings = getUpcomingBookings(r);
            const isOccupied = !!currentBooking;

            return (
              <div
                key={r.id}
                className={cn(
                  "p-6 rounded-[2.5rem] border flex flex-col justify-between transition-all duration-300 group",
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
                      getTypeColor(r.type)
                    )}>
                      {r.type}
                    </span>
                  </div>

                  <h4 className={cn("text-sm font-black line-clamp-1", darkMode ? "text-slate-100" : "text-slate-800")}>{r.name}</h4>
                  <p className={cn("text-[10px] font-bold", darkMode ? "text-slate-400" : "text-slate-550")}>Khả năng đáp ứng: <span className={cn("font-black", darkMode ? "text-slate-200" : "text-slate-705")}>{r.capacity}</span></p>

                  {/* Status Section */}
                  <div className={cn("pt-3 border-t space-y-2", darkMode ? "border-slate-800/30" : "border-slate-100")}>
                    {r.status === 'MAINTENANCE' ? (
                      <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span>Đang bảo trì sửa chữa</span>
                      </div>
                    ) : isOccupied && currentBooking ? (
                      <div className={cn("p-3 border rounded-xl space-y-1", darkMode ? "bg-brand-primary/10 border-brand-primary/20" : "bg-cyan-50/50 border-cyan-100/60")}>
                        <div className="flex items-center gap-1.5 text-brand-primary text-[10px] font-black uppercase">
                          <Clock className="w-3 h-3" />
                          <span>Đang bận: {currentBooking.startTime} - {currentBooking.endTime}</span>
                        </div>
                        <p className={cn("text-[10px] font-black truncate", darkMode ? "text-slate-200" : "text-slate-800")}>{currentBooking.purpose}</p>
                        <p className="text-[9px] font-bold text-slate-500">Đăng ký bởi: {currentBooking.by}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Sẵn sàng sử dụng</span>
                      </div>
                    )}

                    {/* Upcoming bookings */}
                    {upcomingBookings.length > 0 && (
                      <div className="space-y-1.5">
                        {upcomingBookings.map((b) => (
                          <div key={b.id} className={cn(
                            "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold",
                            darkMode ? "bg-slate-800/40 border-slate-700/40 text-slate-355" : "bg-slate-50 border-slate-100 text-slate-655"
                          )}>
                            <span className="truncate">
                              {b.date.split('-').reverse().join('/')} • {b.startTime}-{b.endTime} • {b.purpose} ({b.by})
                            </span>
                            <button
                              onClick={() => handleCancelBooking(r, b.id)}
                              title="Hủy lịch đặt"
                              className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn("flex items-center justify-between pt-4 mt-2 border-t", darkMode ? "border-slate-800/30" : "border-slate-100")}>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleMaintenance(r)}
                      title={r.status === 'MAINTENANCE' ? 'Kết thúc bảo trì' : 'Chuyển sang bảo trì'}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors border cursor-pointer",
                        darkMode ? "text-slate-500 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 border-transparent" : "text-slate-400 hover:text-amber-500 bg-slate-50 hover:bg-slate-100 border-slate-205"
                      )}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      title="Xóa tài nguyên"
                      className={cn(
                        "p-1.5 rounded-lg transition-colors border cursor-pointer",
                        darkMode ? "text-slate-500 hover:text-rose-455 bg-slate-800 hover:bg-slate-750 border-transparent" : "text-slate-400 hover:text-rose-500 bg-slate-55 hover:bg-rose-50 border-slate-205"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    disabled={r.status === 'MAINTENANCE'}
                    onClick={() => setBookingResource(r)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                      r.status !== 'MAINTENANCE'
                        ? "bg-brand-primary hover:bg-brand-primary/95 border-transparent text-white shadow-md active:scale-95"
                        : (darkMode ? "bg-slate-800 text-slate-500 border-transparent cursor-not-allowed" : "bg-slate-100 text-slate-400 border-slate-200/50 cursor-not-allowed")
                    )}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Đặt mượn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ErpCard className="rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <ErpTableHead columns={['Nhận diện', 'Tên tài nguyên', 'Phân loại', 'Khả năng đáp ứng', 'Hiện trạng', 'Thao tác']} />
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredResources.map((r) => {
                  const currentBooking = getCurrentBooking(r);
                  const upcomingBookings = getUpcomingBookings(r);
                  const isOccupied = !!currentBooking;

                  return (
                    <tr key={r.id} className={cn("transition-colors", darkMode ? "text-slate-350 hover:bg-slate-800/10" : "text-slate-600 hover:bg-slate-50/40")}>
                      <td className="py-4.5 px-6 font-black text-sm">{r.identifier}</td>
                      <td className="py-4.5 px-6 font-bold">{r.name}</td>
                      <td className="py-4.5 px-6">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                          getTypeColor(r.type)
                        )}>
                          {r.type}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 font-bold">{r.capacity}</td>
                      <td className="py-4.5 px-6 space-y-1">
                        {r.status === 'MAINTENANCE' ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[10px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Bảo trì
                          </span>
                        ) : isOccupied && currentBooking ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-brand-primary font-black text-[10px]">
                              <Clock className="w-3 h-3" /> Đang bận ({currentBooking.startTime}-{currentBooking.endTime})
                            </span>
                            <div className="text-[9px] text-slate-400 font-bold truncate max-w-xs">{currentBooking.purpose} ({currentBooking.by})</div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Sẵn sàng
                          </span>
                        )}
                        {upcomingBookings.length > 0 && (
                          <div className="text-[8px] text-slate-400 font-bold">
                            Lịch sắp tới: {upcomingBookings.map(b => `${b.startTime}-${b.endTime}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMaintenance(r)}
                            title={r.status === 'MAINTENANCE' ? 'Kết thúc bảo trì' : 'Chuyển sang bảo trì'}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors border cursor-pointer",
                              darkMode ? "text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 border-transparent" : "text-slate-500 hover:text-amber-500 bg-slate-50 hover:bg-slate-100 border-slate-200/60"
                            )}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={r.status === 'MAINTENANCE'}
                            onClick={() => setBookingResource(r)}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border cursor-pointer",
                              r.status !== 'MAINTENANCE'
                                ? "bg-brand-primary text-white border-transparent"
                                : "bg-slate-100 text-slate-400 border-slate-200/50 cursor-not-allowed"
                            )}
                          >
                            Đặt mượn
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            title="Xóa tài nguyên"
                            className={cn(
                              "p-1.5 rounded-lg transition-colors border cursor-pointer",
                              darkMode ? "text-slate-450 hover:text-rose-455 bg-slate-800 hover:bg-rose-900/40 border-transparent" : "text-slate-500 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 border-slate-200/60"
                            )}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ErpCard>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <ErpModal title="Khai báo tài nguyên mới" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddResource} className="space-y-4">
            <ErpField label="Tên gọi tài nguyên">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Phòng Lab thực hành 102"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              />
            </ErpField>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Phân loại">
                <ErpSelect
                  required
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                >
                  <option value="" disabled>-- Chọn phân loại --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </ErpSelect>
              </ErpField>
              <ErpField label="Nhận diện / Số xe / Số phòng">
                <ErpInput
                  type="text"
                  required
                  placeholder="Ví dụ: P.102 / 30E-888.88"
                  value={newResource.identifier}
                  onChange={(e) => setNewResource({ ...newResource, identifier: e.target.value })}
                />
              </ErpField>
            </div>

            <ErpField label="Sức chứa / Khả năng đáp ứng">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: 30 người / 2 người / 1 bộ"
                value={newResource.capacity}
                onChange={(e) => setNewResource({ ...newResource, capacity: e.target.value })}
              />
            </ErpField>

            <ErpSubmitButton>{isSubmitting ? 'Đang lưu...' : 'Khai báo tài nguyên'}</ErpSubmitButton>
          </form>
        </ErpModal>
      )}

      {/* Booking Modal */}
      {bookingResource && (
        <ErpModal title={`Đặt mượn: ${bookingResource.name}`} onClose={() => setBookingResource(null)}>
          <form onSubmit={handleBook} className="space-y-4">
            <ErpField label="Mục đích sử dụng">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Dạy lớp Kỹ năng mềm - Phòng 301"
                value={newBooking.purpose}
                onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
              />
            </ErpField>

            <ErpField label="Người đăng ký">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Thầy Cường"
                value={newBooking.by}
                onChange={(e) => setNewBooking({ ...newBooking, by: e.target.value })}
              />
            </ErpField>

            <div className="grid grid-cols-3 gap-4">
              <ErpField label="Ngày sử dụng">
                <ErpInput
                  type="date"
                  required
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                />
              </ErpField>
              <ErpField label="Từ giờ">
                <ErpInput
                  type="time"
                  required
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                />
              </ErpField>
              <ErpField label="Đến giờ">
                <ErpInput
                  type="time"
                  required
                  value={newBooking.endTime}
                  onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                />
              </ErpField>
            </div>

            <ErpSubmitButton>{isSubmitting ? 'Đang đặt lịch...' : 'Xác nhận đặt lịch'}</ErpSubmitButton>
          </form>
        </ErpModal>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <ErpModal title="Quản lý phân loại tài nguyên" onClose={() => setShowCategoryModal(false)}>
          <div className="space-y-6">
            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <div className="flex-1">
                <ErpInput
                  type="text"
                  required
                  placeholder="Nhập tên phân loại mới (VD: Phòng mô phỏng)..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isCategorySubmitting}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold transition-all hover:bg-brand-primary/95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </form>

            {/* List of Categories */}
            <div className="space-y-2">
              <h5 className={cn("text-xs font-black uppercase tracking-wider", darkMode ? "text-slate-400" : "text-slate-500")}>Danh sách phân loại hiện tại</h5>
              {categoriesLoading ? (
                <p className="text-xs text-slate-400">Đang tải...</p>
              ) : categories.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có phân loại nào.</p>
              ) : (
                <div className={cn("border rounded-2xl p-2 max-h-60 overflow-y-auto divide-y", darkMode ? "border-slate-800 divide-slate-800/40" : "border-slate-100 divide-slate-100/60")}>
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className={cn("text-xs font-bold", darkMode ? "text-slate-200" : "text-slate-700")}>{cat.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, id: cat.id, name: cat.name })}
                        title="Xóa phân loại"
                        className={cn(
                          "p-1.5 rounded-lg transition-all border cursor-pointer",
                          darkMode
                            ? "bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border-transparent"
                            : "bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border-slate-200/60"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErpModal>
      )}

      {/* Confirm Delete Category Modal */}
      <ErpConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xóa phân loại tài nguyên"
        message={`Bạn có chắc chắn muốn xóa phân loại "${deleteConfirm.name}" không? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />
    </div>
  );
}
