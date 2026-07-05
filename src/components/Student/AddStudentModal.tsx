import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useBatches } from '../../hooks/useBatches';
import { useAdminCenters } from '../../hooks/useAdminCenters';
import { formatVND, toInputDate, toDisplayDate, compressImage } from '../../lib/utils';
import { DrivingStudent, Student, UploadedFile } from '../../types';
import { findDuplicateStudentField } from '../../lib/studentUniqueness';
import { FormInput, UploadCard } from './components/StudentFormFields';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: DrivingStudent) => void;
  students: Student[];
  selectedCenter?: string;
}

type FileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

export function AddStudentModal({ isOpen, onClose, onSuccess, students, selectedCenter }: AddStudentModalProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const { batches } = useBatches();
  const { centers } = useAdminCenters();
  const businessType = user?.businessType || 'driving';
  const usesCourseFeePolicy = businessType !== 'driving';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [batchId, setBatchId] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
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

  React.useEffect(() => {
    if (selectedCenter && selectedCenter !== 'all') {
      setSelectedCenterId(selectedCenter);
    } else {
      setSelectedCenterId('');
    }
  }, [selectedCenter]);

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
      rank: false,
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
      const compressedFile = await compressImage(file);
      const body = new FormData();
      body.append('file', compressedFile);
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

    if (formData.idCard && formData.idCard.trim().length !== 12) {
      const message = "Số CCCD phải có đúng 12 ký tự.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (missingFields.length > 0) {
      const message = `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`;
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (businessType === 'driving') {
      if (!formData.idCardFrontFile || !formData.idCardBackFile) {
        const message = "Vui lòng tải lên cả ảnh mặt trước và mặt sau của CCCD.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }
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

    if (user?.role === 'superadmin' && !selectedCenterId) {
      const message = "Vui lòng chọn trung tâm quản lý học viên.";
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
          birthday: toDisplayDate(formData.birthday),
          enrollmentDate: toDisplayDate(formData.enrollmentDate),
          fee: businessType === 'driving' ? formData.fee : '',
          idCardFront: formData.idCardFrontFile?.url || '',
          idCardBack: formData.idCardBackFile?.url || '',
          status: businessType === 'driving' ? ['Chờ KSK'] : ['Đang học'],
          registrationDate: new Date().toLocaleDateString('vi-VN'),
          centerId: selectedCenterId || undefined,
        }),
      });

      if (res.success && res.data) {
        const studentWithId = { id: res.data._id, ...res.data };

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
        setSelectedCenterId(selectedCenter && selectedCenter !== 'all' ? selectedCenter : '');
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
      {isOpen && (
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
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
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

            <form className="p-6 overflow-y-auto space-y-4" onSubmit={handleSubmit}>
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-sm font-bold text-rose-600">
                  {errorMsg}
                </div>
              )}

              {user?.role === 'superadmin' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Trung tâm quản lý *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCenterId}
                      onChange={(e) => setSelectedCenterId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-pointer"
                    >
                      <option value="">-- Chọn trung tâm quản lý --</option>
                      {centers.map(center => (
                        <option key={center.uid} value={center.uid}>
                          {center.displayName} ({center.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <FormInput
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required={requiredFields.fullName}
                  placeholder="Nhập họ và tên..."
                />
                <FormInput
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required={requiredFields.phone}
                  placeholder="Nhập số điện thoại..."
                />
                <FormInput
                  label="Email học viên"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={requiredFields.email}
                  placeholder="Nhập địa chỉ email..."
                  className="sm:col-span-2"
                />
                <FormInput
                  label="Người giới thiệu"
                  name="referral"
                  value={formData.referral}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người giới thiệu..."
                  className="sm:col-span-2"
                />
                <FormInput
                  label="Ngày sinh"
                  name="birthday"
                  type="date"
                  value={toInputDate(formData.birthday)}
                  onChange={handleInputChange}
                  required={requiredFields.birthday}
                />
                <FormInput
                  label="CCCD / CMND"
                  name="idCard"
                  value={formData.idCard}
                  onChange={handleInputChange}
                  required={requiredFields.idCard}
                  placeholder="Nhập số CCCD (12 số)..."
                />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Xếp vào lớp (tùy chọn)
                  </label>
                  <div className="relative">
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-pointer"
                    >
                      <option value="">-- Chưa xếp lớp --</option>
                      {batches
                        .filter(b => b.status !== 'Đã kết thúc')
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.code} — {b.courseTitle}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                {user?.businessType === 'language' ? (
                  <FormInput
                    label="Khóa học đăng ký"
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    required={requiredFields.rank}
                    placeholder="Ví dụ: IELTS, TOEIC, Giao tiếp..."
                  />
                ) : (user?.businessType || 'driving') === 'driving' ? (
                  <FormInput
                    label="Hạng bằng (lái xe — tùy chọn)"
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                    required={requiredFields.rank}
                    placeholder="Ví dụ: A1, B2, C... hoặc để trống"
                  />
                ) : null}

                <FormInput
                  label="Ngày đăng ký"
                  name="registrationDate"
                  value={formData.registrationDate}
                  onChange={handleInputChange}
                  readOnly
                />
                <FormInput
                  label="Ngày nhập học"
                  name="enrollmentDate"
                  type="date"
                  value={toInputDate(formData.enrollmentDate)}
                  onChange={handleInputChange}
                />
                {usesCourseFeePolicy ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      Học phí đã chốt
                    </label>
                    <div className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
                      Sẽ lấy tự động từ khóa học khi xếp lớp.
                    </div>
                  </div>
                ) : (
                  <FormInput
                    label="Học phí (VND)"
                    name="fee"
                    value={formData.fee}
                    onChange={handleInputChange}
                    placeholder="Nhập học phí..."
                  />
                )}
                <FormInput
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ..."
                  className="sm:col-span-2"
                />
              </div>

              {(user?.businessType || 'driving') === 'driving' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <UploadCard
                    label="CCCD mặt trước"
                    file={formData.idCardFrontFile}
                    isUploading={uploadingField === 'idCardFrontFile'}
                    onFileChange={(file) => handleUploadFile('idCardFrontFile', file)}
                    onRemove={() => setFormData(prev => ({ ...prev, idCardFrontFile: undefined }))}
                  />
                  <UploadCard
                    label="CCCD mặt sau"
                    file={formData.idCardBackFile}
                    isUploading={uploadingField === 'idCardBackFile'}
                    onFileChange={(file) => handleUploadFile('idCardBackFile', file)}
                    onRemove={() => setFormData(prev => ({ ...prev, idCardBackFile: undefined }))}
                  />
                  <UploadCard
                    label="Ảnh chân dung"
                    file={formData.portraitFile}
                    isUploading={uploadingField === 'portraitFile'}
                    onFileChange={(file) => handleUploadFile('portraitFile', file)}
                    onRemove={() => setFormData(prev => ({ ...prev, portraitFile: undefined }))}
                  />
                </div>
              )}

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
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-100 transition-all disabled:opacity-70"
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
      )}
    </AnimatePresence>
  );
}
