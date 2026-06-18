import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2, Calendar } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ExamSession } from '../../types';
import { useToast } from '../../hooks/useToast';

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exam: ExamSession) => void;
  initialData?: ExamSession | null;
}

export function AddExamModal({ isOpen, onClose, onSuccess, initialData }: AddExamModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    area: 'Tất cả khu vực',
    tentativeDate: '',
    location: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialData) {
        // Convert DD/MM/YYYY back to YYYY-MM-DD for date input
        let formattedDate = '';
        if (initialData.tentativeDate) {
          const parts = initialData.tentativeDate.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        setFormData({
          name: initialData.name || '',
          rank: initialData.rank || '',
          area: initialData.area || 'Tất cả khu vực',
          tentativeDate: formattedDate,
          location: initialData.location || '',
        });
      } else {
        setFormData({
          name: '',
          rank: '',
          area: 'Tất cả khu vực',
          tentativeDate: '',
          location: '',
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.warning("Vui lòng đăng nhập để tạo đợt thi.");
      return;
    }

    if (!formData.name || !formData.rank || !formData.tentativeDate || !formData.location) {
      toast.warning("Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Reformat date from YYYY-MM-DD to DD/MM/YYYY for display consistency
      const dateParts = formData.tentativeDate.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

      if (initialData) {
        // Update existing exam
        const updateData = {
          name: formData.name,
          rank: formData.rank,
          area: formData.area,
          tentativeDate: formattedDate,
          location: formData.location,
        };

        const res = await apiFetch(`/exams/${initialData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updateData),
        });

        toast.success("Đã cập nhật đợt thi thành công!");
        onSuccess({ ...initialData, ...updateData, id: res.data?._id || res.data?.id || initialData.id });
      } else {
        // Create new exam
        const examData = {
          ...formData,
          tentativeDate: formattedDate,
          status: 'Sắp diễn ra',
        };

        const res = await apiFetch('/exams', {
          method: 'POST',
          body: JSON.stringify(examData),
        });

        toast.success("Đã tạo đợt thi thành công!");
        onSuccess({ ...examData, id: res.data?._id || res.data?.id });
      }
      
      window.dispatchEvent(new Event('exam-mutation'));
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        rank: '',
        area: 'Tất cả khu vực',
        tentativeDate: '',
        location: '',
      });
    } catch (error) {
      console.error("Error creating/updating exam:", error);
      toast.error("Lỗi khi xử lý đợt thi: " + (error instanceof Error ? error.message : "Không rõ nguyên nhân"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800">
              {initialData ? 'Chỉnh sửa đợt thi' : 'Tạo đợt thi mới'}
            </h2>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Form Content */}
          <form className="p-6 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Exam Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Tên đợt thi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: Đợt thi B2 - Tháng 3/2026"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rank Selection */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Hạng bằng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      name="rank"
                      value={formData.rank}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all pr-10"
                    >
                      <option value="">-- Chọn hạng --</option>
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C">C</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Area Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Khu vực
                  </label>
                  <div className="relative">
                    <select 
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all pr-10"
                    >
                      <option value="Tất cả khu vực">Tất cả khu vực</option>
                      <option value="Nội thành">Nội thành</option>
                      <option value="Ngoại thành">Ngoại thành</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Tentative Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Ngày thi dự kiến <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="tentativeDate"
                    value={formData.tentativeDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Địa điểm thi (Trung tâm sát hạch) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: Trung tâm sát hạch quận 1"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 mt-6 border-t border-slate-50 flex-shrink-0">
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? 'Đang lưu...' : (initialData ? 'Cập nhật đợt thi' : 'Tạo đợt thi')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
