import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { Student } from '../../types';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referral: '',
    birthday: '',
    idCard: '',
    rank: '',
    area: '',
    registrationDate: '',
    fee: '',
    address: '',
    email: '',
    status: '',
  });

  useEffect(() => {
    if (student) {
      const timer = setTimeout(() => {
        setFormData({
          fullName: student.fullName || '',
          email: student.email || '',
          phone: student.phone || '',
          referral: student.referral || '',
          birthday: student.birthday || '',
          idCard: student.idCard || '',
          rank: student.rank || '',
          area: student.area || '',
          registrationDate: student.registrationDate || '',
          fee: student.fee || '',
          address: student.address || '',
          status: student.status || '',
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [student]);

  const getRequiredFieldsConfig = () => {
    const saved = localStorage.getItem('requiredFieldsConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing requiredFieldsConfig", e);
      }
    }
    return {
      fullName: true,
      phone: true,
      rank: true,
      area: true,
      birthday: false,
      idCard: false,
      email: false
    };
  };

  if (!isOpen || !student) return null;

  const requiredFields = getRequiredFieldsConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    if (requiredFields.fullName && !formData.fullName) missingFields.push("Họ và tên");
    if (requiredFields.phone && !formData.phone) missingFields.push("Số điện thoại");
    if (requiredFields.rank && !formData.rank) missingFields.push("Hạng bằng");
    if (requiredFields.area && !formData.area) missingFields.push("Khu vực");
    if (requiredFields.birthday && !formData.birthday) missingFields.push("Ngày sinh");
    if (requiredFields.idCard && !formData.idCard) missingFields.push("CCCD/CMND");
    if (requiredFields.email && !formData.email) missingFields.push("Email");

    if (missingFields.length > 0) {
      toast.error(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch(`/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      window.dispatchEvent(new Event("student-mutation"));
      toast.success('Đã cập nhật thông tin học viên thành công!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error updating student:", error);
      const msg = error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật thông tin.";
      toast.error(msg);
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
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800">Chỉnh sửa thông tin học viên</h2>
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <form className="p-6 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Họ và tên {requiredFields.fullName && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Số điện thoại {requiredFields.phone && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>

              {/* Email - New Field */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Email học viên {requiredFields.email && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>

              {/* Row 2 - Full Width */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Người giới thiệu</label>
                <input 
                  type="text" 
                  name="referral"
                  value={formData.referral} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>

              {/* Row 3 */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Ngày sinh {requiredFields.birthday && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="text" 
                  name="birthday"
                  value={formData.birthday} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                  placeholder="DD/MM/YYYY" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  CCCD / CMND {requiredFields.idCard && <span className="text-rose-500">*</span>}
                </label>
                <input 
                  type="text" 
                  name="idCard"
                  value={formData.idCard} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>

              {/* Row 4 */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Hạng bằng {requiredFields.rank && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <select 
                    name="rank"
                    value={formData.rank} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all"
                  >
                    <option value="">-- Chọn hạng --</option>
                    <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option>
                    <option value="B2">B2</option><option value="C">C</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Khu vực {requiredFields.area && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <select 
                    name="area"
                    value={formData.area} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all"
                  >
                    <option value="">-- Chọn khu vực --</option>
                    <option value="Nội thành">Nội thành</option>
                    <option value="Ngoại thành">Ngoại thành</option>
                    <option value="Tỉnh lân cận">Tỉnh lân cận</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 5 */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Ngày đăng ký</label>
                <input 
                  type="text" 
                  name="registrationDate"
                  value={formData.registrationDate} 
                  readOnly
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 cursor-default" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Học phí (VND)</label>
                <input 
                  type="text" 
                  name="fee"
                  value={formData.fee} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                  placeholder="Ví dụ: 4.000.000"
                />
              </div>

              {/* Row 6 - Address & Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Địa chỉ</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Trạng thái</label>
                <div className="relative">
                  <select 
                    name="status"
                    value={formData.status} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all"
                  >
                    <option value="Chờ KSK">Chờ KSK</option>
                    <option value="Đã KSK">Đã KSK</option>
                    <option value="Đã nộp HS">Đã nộp HS</option>
                    <option value="Đang học">Đang học</option>
                    <option value="Đang thi">Đang thi</option>
                    <option value="Đã đậu">Đã đậu</option>
                    <option value="Thi lại">Thi lại</option>
                    <option value="Nghỉ học">Nghỉ học</option>
                    <option value="Nợ học phí">Nợ học phí</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 mt-2 border-t border-slate-50 flex-shrink-0">
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
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Lưu học viên
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
