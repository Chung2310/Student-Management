import React, { useState, useEffect } from 'react';
import {
  Calendar, DollarSign, Users, Layers, Play, BookOpen, Trash2, Pause, Plus, Tag, List, LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useCourses } from '../../hooks/useCourses';
import { useCourseCategories } from '../../hooks/useCourseCategories';
import { Course, CourseCategory } from '../../types';
import { useErpTheme } from './ErpThemeContext';
import {
  ErpPageHeader, ErpPrimaryButton, ErpSearchBar, ErpFilterTab,
  ErpModal, ErpField, ErpInput, ErpSelect, ErpSubmitButton,
  ErpEmptyState, ErpLoadingState, ErpCard, ErpConfirmModal, ErpTableHead
} from '../../components/Erp/ErpUI';

export function ErpCourses() {
  const { darkMode } = useErpTheme();
  const { toast } = useToast();
  const { courses, loading } = useCourses();
  const { categories, loading: categoriesLoading } = useCourseCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('erp_view_mode_courses') as 'list' | 'grid') || 'grid';
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    category: '' as CourseCategory,
    fee: '',
    duration: '',
    maxLearners: 20,
  });

  // Đồng bộ hóa phân loại đầu tiên làm mặc định khi danh sách phân loại được tải
  useEffect(() => {
    if (categories.length > 0 && !newCourse.category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewCourse(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories, newCourse.category]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.title || !newCourse.fee || !newCourse.duration || !newCourse.category) {
      toast.error('Vui lòng nhập đầy đủ thông tin khóa học.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedFee = newCourse.fee.endsWith('đ') ? newCourse.fee : `${newCourse.fee}đ`;
      await apiFetch('/courses', {
        method: 'POST',
        body: JSON.stringify({
          ...newCourse,
          code: newCourse.code.toUpperCase(),
          fee: formattedFee,
        }),
      });
      window.dispatchEvent(new Event('course-mutation'));
      setShowAddModal(false);
      setNewCourse({
        code: '',
        title: '',
        category: categories[0]?.name || '',
        fee: '',
        duration: '',
        maxLearners: 20
      });
      toast.success(`Đã thêm mới khóa học ${newCourse.code.toUpperCase()} thành công!`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo khóa học.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus = course.status === 'Hoạt động' ? 'Tạm dừng' : 'Hoạt động';
    try {
      await apiFetch(`/courses/${course.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      window.dispatchEvent(new Event('course-mutation'));
      toast.success(`Khóa học ${course.code} đã chuyển sang "${nextStatus}".`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật khóa học.';
      toast.error(msg);
    }
  };

  const handleDelete = async (course: Course) => {
    try {
      await apiFetch(`/courses/${course.id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('course-mutation'));
      toast.success(`Đã xóa khóa học ${course.code}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa khóa học.';
      toast.error(msg);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCategorySubmitting(true);
    try {
      await apiFetch('/courses/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName }),
      });
      window.dispatchEvent(new Event('course-category-mutation'));
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
      await apiFetch(`/courses/categories/${deleteConfirm.id}`, {
        method: 'DELETE',
      });
      window.dispatchEvent(new Event('course-category-mutation'));
      toast.success('Đã xóa phân loại thành công.');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa.';
      toast.error(msg);
    } finally {
      setDeleteConfirm({ isOpen: false, id: '', name: '' });
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat === 'Lái xe') return "bg-brand-primary/10 text-brand-primary border border-brand-primary/15";
    if (cat === 'Ngoại ngữ') return "bg-sky-500/10 text-sky-400 border border-sky-500/15";
    if (cat === 'Kỹ năng') return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15";
    if (cat === 'Khác') return "bg-slate-500/10 text-slate-400 border border-slate-500/15";

    let hash = 0;
    for (let i = 0; i < cat.length; i++) {
      hash = cat.charCodeAt(i) + ((hash << 5) - hash);
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

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-left">
      <ErpPageHeader
        title="Danh mục Khóa học"
        subtitle="Thiết lập chương trình đào tạo & lớp học hành chính"
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
              Thêm khóa học mới
            </ErpPrimaryButton>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <ErpSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Tìm theo tên hoặc mã khóa học..." />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <ErpFilterTab active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
              Tất cả
            </ErpFilterTab>
            {categories.map((cat) => (
              <ErpFilterTab key={cat.id} active={categoryFilter === cat.name} onClick={() => setCategoryFilter(cat.name)}>
                {cat.name}
              </ErpFilterTab>
            ))}
          </div>

          <div className={cn("flex items-center border p-1 rounded-xl gap-0.5 shrink-0", darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50")}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); localStorage.setItem('erp_view_mode_courses', 'list'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'list' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-850 shadow-sm") 
                  : "text-slate-400 hover:text-slate-600"
              )}
              title="Hiển thị dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('grid'); localStorage.setItem('erp_view_mode_courses', 'grid'); }}
              className={cn(
                "p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? (darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-850 shadow-sm") 
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
      {loading && courses.length === 0 ? (
        <ErpCard><ErpLoadingState message="Đang tải danh mục khóa học..." /></ErpCard>
      ) : filteredCourses.length === 0 ? (
        <ErpCard>
          <ErpEmptyState
            icon={BookOpen}
            title="Chưa có khóa học nào"
            subtitle="Bấm 'Thêm khóa học mới' để khởi tạo chương trình đào tạo đầu tiên."
          />
        </ErpCard>
      ) : viewMode === 'grid' ? (
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
                    getCategoryColor(c.category)
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(c)}
                    title={c.status === 'Hoạt động' ? 'Tạm dừng khóa học' : 'Kích hoạt lại khóa học'}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all border cursor-pointer",
                      darkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60"
                    )}
                  >
                    {c.status === 'Hoạt động'
                      ? <><Pause className="w-3 h-3 text-amber-500" /> Tạm dừng</>
                      : <><Play className="w-3 h-3 text-brand-primary" /> Kích hoạt</>}
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    title="Xóa khóa học"
                    className={cn(
                      "p-1.5 rounded-xl transition-all border cursor-pointer",
                      darkMode
                        ? "bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border-transparent"
                        : "bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border-slate-200/60"
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ErpCard className="rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <ErpTableHead columns={['Mã', 'Tên khóa học', 'Phân loại', 'Thời lượng', 'Học phí', 'Quy mô', 'Trạng thái', 'Thao tác']} />
              <tbody className={cn("divide-y", darkMode ? "divide-slate-800/30" : "divide-slate-100")}>
                {filteredCourses.map((c) => (
                  <tr key={c.id} className={cn("transition-colors", darkMode ? "text-slate-350 hover:bg-slate-800/10" : "text-slate-600 hover:bg-slate-50/40")}>
                    <td className="py-4 px-6 font-black text-sm">{c.code}</td>
                    <td className="py-4 px-6 font-bold">{c.title}</td>
                    <td className="py-4 px-6">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", getCategoryColor(c.category))}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold">{c.duration}</td>
                    <td className="py-4 px-6 font-bold">{c.fee}</td>
                    <td className="py-4 px-6 font-bold">{c.maxLearners} HV ({c.activeBatches} lớp)</td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                        c.status === 'Hoạt động' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border-rose-500/15"
                      )}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all border cursor-pointer",
                            darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60"
                          )}
                        >
                          {c.status === 'Hoạt động' ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-brand-primary" />}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all border cursor-pointer",
                            darkMode ? "bg-slate-800 hover:bg-rose-900/40 text-slate-450 hover:text-rose-450 border-transparent" : "bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-550 border-slate-200/60"
                          )}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ErpCard>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <ErpModal title="Thêm chương trình học mới" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddCourse} className="space-y-4">
            <ErpField label="Mã khóa học (Viết tắt)">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: ENG-TOEIC"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
              />
            </ErpField>

            <ErpField label="Tên chương trình đào tạo">
              <ErpInput
                type="text"
                required
                placeholder="Ví dụ: Luyện thi TOEIC 650+ Cam Kết Đầu Ra"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
            </ErpField>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Phân loại">
                <ErpSelect
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </ErpSelect>
              </ErpField>
              <ErpField label="Thời lượng">
                <ErpInput
                  type="text"
                  required
                  placeholder="Ví dụ: 3 tháng / 8 tuần"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                />
              </ErpField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ErpField label="Học phí cơ bản (VND)">
                <ErpInput
                  type="text"
                  required
                  placeholder="Ví dụ: 5.500.000"
                  value={newCourse.fee}
                  onChange={(e) => setNewCourse({ ...newCourse, fee: e.target.value })}
                />
              </ErpField>
              <ErpField label="Tối đa học viên/Lớp">
                <ErpInput
                  type="number"
                  value={newCourse.maxLearners}
                  onChange={(e) => setNewCourse({ ...newCourse, maxLearners: parseInt(e.target.value) || 20 })}
                />
              </ErpField>
            </div>

            <ErpSubmitButton>{isSubmitting ? 'Đang khởi tạo...' : 'Khởi tạo chương trình'}</ErpSubmitButton>
          </form>
        </ErpModal>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <ErpModal title="Quản lý phân loại khóa học" onClose={() => setShowCategoryModal(false)}>
          <div className="space-y-6">
            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <div className="flex-1">
                <ErpInput
                  type="text"
                  required
                  placeholder="Nhập tên phân loại mới (VD: Nâng hạng B2-C)..."
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
                            : "bg-slate-50 hover:bg-rose-55 text-slate-450 hover:text-rose-600 border-slate-200/60"
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
        title="Xóa phân loại khóa học"
        message={`Bạn có chắc chắn muốn xóa phân loại "${deleteConfirm.name}" không? Hành động này không thể hoàn tác.`}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />
    </div>
  );
}
