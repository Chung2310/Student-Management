import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatVND } from '../../lib/utils';
import { DrivingStudent, UploadedFile } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: DrivingStudent) => void;
}

type FileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idCardFrontFile, setIdCardFrontFile] = useState<string>('');
  const [idCardBackFile, setIdCardBackFile] = useState<string>('');
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referral: '',
    birthday: '',
    idCard: '',
    rank: '',
    registrationDate: new Date().toLocaleDateString('vi-VN'),
    enrollmentDate: '',
    fee: '',
    address: '',
    email: '',
    idCardFrontFile: undefined as UploadedFile | undefined,
    idCardBackFile: undefined as UploadedFile | undefined,
    portraitFile: undefined as UploadedFile | undefined,
  });

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (isFront) {
      setIsUploadingFront(true);
    } else {
      setIsUploadingBack(true);
    }

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await apiFetch("/upload", {
        method: "POST",
        body: form,
      });

      if (res.success && res.data?.url) {
        if (isFront) {
          setIdCardFrontFile(res.data.url);
          toast.success("Đã tải lên mặt trước CCCD thành công!");
        } else {
          setIdCardBackFile(res.data.url);
          toast.success("Đã tải lên mặt sau CCCD thành công!");
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh lên:", err);
      toast.error("Lỗi tải ảnh lên: " + (err instanceof Error ? err.message : "Không xác định"));
    } finally {
      if (isFront) {
        setIsUploadingFront(false);
      } else {
        setIsUploadingBack(false);
      }
    }
  };

  const getRequiredFieldsConfig = () => {
    const saved = localStorage.getItem('requiredFieldsConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing requiredFieldsConfig', e);
      }
    }
    return {
      fullName: true,
      phone: true,
      rank: true,
      birthday: false,
      idCard: false,
      email: false
    };
  };

  const requiredFields = getRequiredFieldsConfig();

  const handleUploadFile = async (field: FileField, file?: File) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiFetch('/upload', { method: 'POST', body });
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          [field]: {
            name: res.data.name,
            url: res.data.url,
            type: res.data.type,
            uploadedAt: res.data.uploadedAt || new Date().toISOString(),
          }
        }));
        toast.success('Tải ảnh thành công!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập để lưu hồ sơ học viên.');
      await login();
      return;
    }

    const missingFields: string[] = [];
    if (requiredFields.fullName && !formData.fullName) missingFields.push('Họ và tên');
    if (requiredFields.phone && !formData.phone) missingFields.push('Số điện thoại');
    if (requiredFields.rank && !formData.rank) missingFields.push('Hạng bằng');
    if (requiredFields.birthday && !formData.birthday) missingFields.push('Ngày sinh');
    if (requiredFields.idCard && !formData.idCard) missingFields.push('CCCD/CMND');
    if (requiredFields.email && !formData.email) missingFields.push('Email');

    if (missingFields.length > 0) {
      setErrorMsg(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    if (!idCardFrontFile || !idCardBackFile) {
      setErrorMsg("Vui lòng tải lên cả mặt trước và mặt sau của CCCD.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          idCardFront: idCardFrontFile,
          idCardBack: idCardBackFile,
          status: 'Chờ KSK',
          registrationDate: new Date().toLocaleDateString('vi-VN'),
        }),
      });

      if (res.success && res.data) {
        const studentWithId = { id: res.data._id, ...res.data };
        window.dispatchEvent(new Event('student-mutation'));
        toast.success('Đã lưu hồ sơ học viên thành công!');
        onClose();
        onSuccess(studentWithId);

        // Reset form
        setIdCardFrontFile('');
        setIdCardBackFile('');
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
      console.error('Error saving student:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Lỗi lưu hồ sơ học viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'fee' ? formatVND(value) : value }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800">Thêm học viên mới</h2>
            <button onClick={onClose} disabled={isSubmitting} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <form className="p-6 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
            {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm font-bold text-rose-600">{errorMsg}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Input label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleInputChange} required={requiredFields.fullName} />
              <Input label="Số điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} required={requiredFields.phone} />
              <Input label="Email học viên" name="email" value={formData.email} onChange={handleInputChange} required={requiredFields.email} className="sm:col-span-2" />
              <Input label="Người giới thiệu" name="referral" value={formData.referral} onChange={handleInputChange} className="sm:col-span-2" />
              <Input label="Ngày sinh" name="birthday" value={formData.birthday} onChange={handleInputChange} required={requiredFields.birthday} placeholder="DD/MM/YYYY" />
              <Input label="CCCD / CMND" name="idCard" value={formData.idCard} onChange={handleInputChange} required={requiredFields.idCard} />
              <Select label="Hạng bằng" name="rank" value={formData.rank} onChange={handleInputChange} required={requiredFields.rank} options={['A1', 'A2', 'B1', 'B2', 'C']} />
              <Input label="Ngày đăng ký" name="registrationDate" value={formData.registrationDate} onChange={handleInputChange} readOnly />
              <Input label="Ngày nhập học" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
              <Input label="Học phí (VND)" name="fee" value={formData.fee} onChange={handleInputChange} />
              <Input label="Địa chỉ" name="address" value={formData.address} onChange={handleInputChange} className="sm:col-span-2" />
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

            {/* Upload ảnh CCCD */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 pb-2">
              {/* Mặt trước */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                  Mặt trước CCCD <span className="text-rose-500">*</span>
                </label>
                {idCardFrontFile ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-150 aspect-[8/5] bg-slate-50 flex items-center justify-center group shadow-sm">
                    <img src={idCardFrontFile} alt="Mặt trước CCCD" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setIdCardFrontFile('')}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-brand-primary hover:bg-slate-50/50 rounded-2xl aspect-[8/5] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-3 text-center group">
                    {isUploadingFront ? (
                      <>
                        <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                        <span className="text-[10px] font-bold text-slate-400">Đang tải ảnh lên...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-all">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-700">Tải lên mặt trước</span>
                        <span className="text-[8px] font-bold text-slate-400">Hỗ trợ JPG, PNG</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, true)}
                      disabled={isUploadingFront}
                    />
                  </label>
                )}
              </div>

              {/* Mặt sau */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                  Mặt sau CCCD <span className="text-rose-500">*</span>
                </label>
                {idCardBackFile ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-150 aspect-[8/5] bg-slate-50 flex items-center justify-center group shadow-sm">
                    <img src={idCardBackFile} alt="Mặt sau CCCD" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setIdCardBackFile('')}
                        className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-brand-primary hover:bg-slate-50/50 rounded-2xl aspect-[8/5] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-3 text-center group">
                    {isUploadingBack ? (
                      <>
                        <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                        <span className="text-[10px] font-bold text-slate-400">Đang tải ảnh lên...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-all">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-700">Tải lên mặt sau</span>
                        <span className="text-[8px] font-bold text-slate-400">Hỗ trợ JPG, PNG</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFile(e, false)}
                      disabled={isUploadingBack}
                    />
                  </label>
                )}
              </div>
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
          </div >

          <div className="flex items-center justify-end gap-4 pt-4 mt-2 border-t border-slate-50 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSubmitting ? 'Đang lưu...' : 'Lưu & Mở hồ sơ'}
            </button>
          </div>
        </form >
      </motion.div >
    </div >
    </AnimatePresence >
  );
}

function Input({ label, name, value, onChange, required = false, readOnly = false, placeholder = '', className = '' }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; readOnly?: boolean; placeholder?: string; className?: string; }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label} {required && <span className="text-rose-500">*</span>}</label>
      <input type="text" name={name} value={value} onChange={onChange} readOnly={readOnly} placeholder={placeholder} className={`w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all ${readOnly ? 'bg-slate-50 text-slate-600 cursor-default' : ''}`} />
    </div>
  );
}

function Select({ label, name, value, onChange, required = false, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean; options: string[]; }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label} {required && <span className="text-rose-500">*</span>}</label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all">
          <option value="">-- Chọn --</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function UploadCard({ label, file, isUploading, onFileChange, onRemove }: { label: string; file?: UploadedFile; isUploading: boolean; onFileChange: (file?: File) => void; onRemove: () => void; }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-700">{label}</p>
        {file && <button type="button" onClick={onRemove} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>}
      </div>
      {file ? (
        <a href={file.url} target="_blank" rel="noreferrer" className="block">
          <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 h-28 flex items-center justify-center">
            {file.type.includes('image') ? <img src={file.url} alt={file.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-400" />}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 truncate">{file.name}</p>
        </a>
      ) : (
        <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-50">
          {isUploading ? <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" /> : <Upload className="w-5 h-5 text-cyan-500" />}
          <span className="text-[11px] text-slate-500 mt-2">Tải ảnh lên</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
