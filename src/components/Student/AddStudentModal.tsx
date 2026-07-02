import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useBatches } from '../../hooks/useBatches';
import { formatVND } from '../../lib/utils';
import { DrivingStudent, Student, UploadedFile } from '../../types';
import { findDuplicateStudentField } from '../../lib/studentUniqueness';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: DrivingStudent) => void;
  students: Student[];
}

type FileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

export function AddStudentModal({ isOpen, onClose, onSuccess, students }: AddStudentModalProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const { batches } = useBatches();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [batchId, setBatchId] = useState('');
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
      rank: false, // Hạng bằng chỉ dành cho ngành lái xe — mặc định không bắt buộc
      birthday: false,
      idCard: false,
      email: false
    };
  };

  if (!isOpen) return null;

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
      const message = `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`;
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (!formData.idCardFrontFile || !formData.idCardBackFile) {
      const message = "Vui lòng tải lên cả ảnh mặt trước và mặt sau của CCCD.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    const duplicateField = findDuplicateStudentField(students, {
      email: formData.email,
      phone: formData.phone,
      idCard: formData.idCard,
    });
    if (duplicateField) {
      const message = `${duplicateField.label} đã tồn tại trong hệ thống, không được trùng.`;
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          idCardFront: formData.idCardFrontFile.url,
          idCardBack: formData.idCardBackFile.url,
          // Quy trình KSK chỉ áp dụng cho ngành lái xe (có hạng bằng)
          status: formData.rank ? 'Chờ KSK' : 'Đang học',
          registrationDate: new Date().toLocaleDateString('vi-VN'),
        }),
      });

      if (res.success && res.data) {
        const studentWithId = { id: res.data._id, ...res.data };

        // Xếp học viên vào lớp đã chọn (không chặn luồng tạo nếu lỗi)
        if (batchId) {
          try {
            await apiFetch(`/batches/${batchId}/learners`, {
              method: 'POST',
              body: JSON.stringify({ studentId: res.data._id }),
            });
            window.dispatchEvent(new Event('batch-mutation'));
          } catch (batchError: unknown) {
            const msg = batchError instanceof Error ? batchError.message : 'Không thể xếp lớp.';
            toast.warning(`Đã tạo học viên nhưng chưa xếp được vào lớp: ${msg}`);
          }
        }

        window.dispatchEvent(new Event('student-mutation'));
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
          registrationDate: new Date().toLocaleDateString('vi-VN'),
          enrollmentDate: '',
          fee: '',
          address: '',
          email: '',
          idCardFrontFile: undefined,
          idCardBackFile: undefined,
          portraitFile: undefined,
        });
        setBatchId('');
      }
    } catch (error: unknown) {
      console.error('Error saving student:', error);
      const message = error instanceof Error ? error.message : 'Lỗi lưu hồ sơ học viên.';
      setErrorMsg(message);
      toast.error(message);
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
              <Input label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleInputChange} required={requiredFields.fullName} placeholder="Nhập họ và tên..." />
              <Input label="Số điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} required={requiredFields.phone} placeholder="Nhập số điện thoại..." />
              <Input label="Email học viên" name="email" value={formData.email} onChange={handleInputChange} required={requiredFields.email} placeholder="Nhập địa chỉ email..." className="sm:col-span-2" />
              <Input label="Người giới thiệu" name="referral" value={formData.referral} onChange={handleInputChange} placeholder="Nhập tên người giới thiệu..." className="sm:col-span-2" />
              <Input label="Ngày sinh" name="birthday" value={formData.birthday} onChange={handleInputChange} required={requiredFields.birthday} placeholder="DD/MM/YYYY" />
              <Input label="CCCD / CMND" name="idCard" value={formData.idCard} onChange={handleInputChange} required={requiredFields.idCard} placeholder="Nhập số CCCD (12 số)..." />
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Xếp vào lớp (tùy chọn)</label>
                <div className="relative">
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary transition-all"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {batches.filter(b => b.status !== 'Đã kết thúc').map(b => (
                      <option key={b.id} value={b.id}>{b.code} — {b.courseTitle}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <Input label="Hạng bằng (lái xe — tùy chọn)" name="rank" value={formData.rank} onChange={handleInputChange} required={requiredFields.rank} placeholder="Ví dụ: A1, B2, C... hoặc để trống" />
              <Input label="Ngày đăng ký" name="registrationDate" value={formData.registrationDate} onChange={handleInputChange} readOnly />
              <Input label="Ngày nhập học" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
              <Input label="Học phí (VND)" name="fee" value={formData.fee} onChange={handleInputChange} placeholder="Nhập học phí..." />
              <Input label="Địa chỉ" name="address" value={formData.address} onChange={handleInputChange} placeholder="Nhập địa chỉ..." className="sm:col-span-2" />
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
                {isSubmitting ? 'Đang lưu...' : 'Lưu & Mở hồ sơ'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
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
