import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { Student, UploadedFile } from '../../types';
import { cn } from '../../lib/utils';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

export function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referral: '',
    birthday: '',
    idCard: '',
    rank: '',
    registrationDate: '',
    enrollmentDate: '',
    fee: '',
    address: '',
    email: '',
    status: [] as string[],
    idCardFrontFile: undefined as UploadedFile | undefined,
    idCardBackFile: undefined as UploadedFile | undefined,
    portraitFile: undefined as UploadedFile | undefined,
  });

  useEffect(() => {
    if (student) {
      setTimeout(() => {
        setFormData({
          fullName: student.fullName || '',
          email: student.email || '',
          phone: student.phone || '',
          referral: student.referral || '',
          birthday: student.birthday || '',
          idCard: student.idCard || '',
          rank: student.rank || '',
          registrationDate: student.registrationDate || '',
          enrollmentDate: student.enrollmentDate || '',
          fee: student.fee || '',
          address: student.address || '',
          status: Array.isArray(student.status) ? student.status : (student.status ? [student.status] : []),
          idCardFrontFile: student.idCardFrontFile,
          idCardBackFile: student.idCardBackFile,
          portraitFile: student.portraitFile,
        });
      }, 0);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const getRequiredFieldsConfig = () => {
    const saved = localStorage.getItem('requiredFieldsConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing requiredFieldsConfig', e);
      }
    }
    return { fullName: true, phone: true, rank: true, birthday: false, idCard: false, email: false };
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
    const missingFields: string[] = [];
    if (requiredFields.fullName && !formData.fullName) missingFields.push('Họ và tên');
    if (requiredFields.phone && !formData.phone) missingFields.push('Số điện thoại');
    if (requiredFields.rank && !formData.rank) missingFields.push('Hạng bằng');
    if (requiredFields.birthday && !formData.birthday) missingFields.push('Ngày sinh');
    if (requiredFields.idCard && !formData.idCard) missingFields.push('CCCD/CMND');
    if (requiredFields.email && !formData.email) missingFields.push('Email');

    if (missingFields.length > 0) {
      toast.error(`Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiFetch(`/students/${student.id}`, { method: 'PATCH', body: JSON.stringify(formData) });
      window.dispatchEvent(new Event('student-mutation'));
      toast.success('Đã cập nhật thông tin học viên thành công!');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin.');
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-800">Chỉnh sửa thông tin học viên</h2>
            <button onClick={onClose} disabled={isSubmitting} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <form className="p-6 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Input label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleInputChange} required={requiredFields.fullName} />
              <Input label="Số điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} required={requiredFields.phone} />
              <Input label="Email học viên" name="email" value={formData.email} onChange={handleInputChange} required={requiredFields.email} className="sm:col-span-2" />
              <Input label="Người giới thiệu" name="referral" value={formData.referral} onChange={handleInputChange} className="sm:col-span-2" />
              <Input label="Ngày sinh" name="birthday" value={formData.birthday} onChange={handleInputChange} required={requiredFields.birthday} />
              <Input label="CCCD / CMND" name="idCard" value={formData.idCard} onChange={handleInputChange} required={requiredFields.idCard} />
              <Select label="Hạng bằng" name="rank" value={formData.rank} onChange={handleInputChange} required={requiredFields.rank} options={['A1', 'A2', 'B1', 'B2', 'C']} />
              <Input label="Ngày đăng ký" name="registrationDate" value={formData.registrationDate} onChange={handleInputChange} readOnly />
              <Input label="Ngày nhập học" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} />
              <Input label="Học phí (VND)" name="fee" value={formData.fee} onChange={handleInputChange} />
              <Input label="Địa chỉ" name="address" value={formData.address} onChange={handleInputChange} className="sm:col-span-2" />
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Trạng thái (Chọn nhiều)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {['Chờ KSK', 'Đã KSK', 'Đã nộp HS', 'Đang học', 'Đang thi', 'Đã đậu', 'Thi lại', 'Nghỉ học', 'Nợ học phí'].map((st) => {
                    const isChecked = formData.status.includes(st);
                    return (
                      <label key={st} className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none",
                        isChecked 
                          ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFormData(prev => {
                              const current = prev.status || [];
                              const next = current.includes(st)
                                ? current.filter(x => x !== st)
                                : [...current, st];
                              return { ...prev, status: next };
                            });
                          }}
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                        />
                        {st}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UploadCard label="CCCD mặt trước" file={formData.idCardFrontFile} isUploading={uploadingField === 'idCardFrontFile'} onFileChange={(file) => handleUploadFile('idCardFrontFile', file)} onRemove={() => setFormData(prev => ({ ...prev, idCardFrontFile: undefined }))} />
              <UploadCard label="CCCD mặt sau" file={formData.idCardBackFile} isUploading={uploadingField === 'idCardBackFile'} onFileChange={(file) => handleUploadFile('idCardBackFile', file)} onRemove={() => setFormData(prev => ({ ...prev, idCardBackFile: undefined }))} />
              <UploadCard label="Ảnh chân dung" file={formData.portraitFile} isUploading={uploadingField === 'portraitFile'} onFileChange={(file) => handleUploadFile('portraitFile', file)} onRemove={() => setFormData(prev => ({ ...prev, portraitFile: undefined }))} />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 mt-2 border-t border-slate-50 flex-shrink-0">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50">Hủy</button>
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu học viên
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Input({ label, name, value, onChange, required = false, readOnly = false, className = '' }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; readOnly?: boolean; className?: string; }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label} {required && <span className="text-rose-500">*</span>}</label>
      <input type="text" name={name} value={value} onChange={onChange} readOnly={readOnly} className={`w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all ${readOnly ? 'bg-slate-50 text-slate-600 cursor-default' : ''}`} />
    </div>
  );
}

function Select({ label, name, value, onChange, required = false, options }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean; options: string[]; }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">{label} {required && <span className="text-rose-500">*</span>}</label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all">
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
