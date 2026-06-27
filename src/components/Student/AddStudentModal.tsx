import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatVND } from '../../lib/utils';
import { DrivingStudent } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: DrivingStudent) => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referral: '',
    birthday: '',
    idCard: '',
    rank: '',
    area: '',
    registrationDate: new Date().toLocaleDateString('vi-VN'),
    fee: '',
    address: '',
    email: '',
  });

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

  if (!isOpen) return null;

  const requiredFields = getRequiredFieldsConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) {
      setErrorMsg("Vui lòng đăng nhập để lưu hồ sơ học viên.");
      await login();
      return;
    }

    const missingFields: string[] = [];
    if (requiredFields.fullName && !formData.fullName) missingFields.push("Họ và tên");
    if (requiredFields.phone && !formData.phone) missingFields.push("Số điện thoại");
    if (requiredFields.rank && !formData.rank) missingFields.push("Hạng bằng");
    if (requiredFields.area && !formData.area) missingFields.push("Khu vực");
    if (requiredFields.birthday && !formData.birthday) missingFields.push("Ngày sinh");
    if (requiredFields.idCard && !formData.idCard) missingFields.push("CCCD/CMND");
    if (requiredFields.email && !formData.email) missingFields.push("Email");

    if (missingFields.length > 0) {
      setErrorMsg(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/students", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          status: 'Chờ KSK',
          registrationDate: new Date().toLocaleDateString('vi-VN'),
        }),
      });

      if (res.success && res.data) {
        const studentWithId = { id: res.data._id, ...res.data };
        
        // Dispatch global mutation event to refresh lists
        window.dispatchEvent(new Event("student-mutation"));
        
        toast.success('Đã lưu hồ sơ học viên thành công!');
        onClose();
        onSuccess(studentWithId);
        
        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          referral: '',
          birthday: '',
          idCard: '',
          rank: '',
          area: '',
          registrationDate: new Date().toLocaleDateString('vi-VN'),
          fee: '',
          address: '',
          email: '',
        });
      }
    } catch (error: unknown) {
      console.error("Error saving student:", error);
      const msg = error instanceof Error ? error.message : "Lỗi lưu hồ sơ học viên.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fee') {
      const formatted = formatVND(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
            <h2 className="text-base font-bold text-slate-800">Thêm học viên mới</h2>
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
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 mb-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-rose-600">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-rose-100/50">
                    <span className="text-rose-500 font-bold text-sm">!</span>
                  </div>
                  <span className="text-sm font-bold">{errorMsg}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setErrorMsg(null)}
                  className="p-1 rounded-md hover:bg-rose-100/50 text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            
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
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  placeholder="09xxxxxxxx"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  placeholder="Tên người giới thiệu"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 8) val = val.substring(0, 8);
                    if (val.length > 4) {
                      val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
                    } else if (val.length > 2) {
                      val = val.substring(0, 2) + '/' + val.substring(2);
                    }
                    setFormData(prev => ({ ...prev, birthday: val }));
                  }}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  placeholder="Số định danh"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                />
              </div>

              {/* Row 4 */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Hạng bằng {requiredFields.rank && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <select 
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Khu vực {requiredFields.area && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <select 
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none cursor-default"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Học phí (VND)</label>
                <input
                  type="text"
                  name="fee"
                  value={formData.fee}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 4.000.000"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                />
              </div>

              {/* Row 6 - Full Width */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Địa chỉ thường trú"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                />
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
                {isSubmitting ? 'Đang lưu...' : 'Lưu & Mở hồ sơ'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
