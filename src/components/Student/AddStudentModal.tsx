import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useAdminCenters } from '../../hooks/useAdminCenters';
import { useCourses } from '../../hooks/useCourses';
import { formatVND, toDisplayDate, compressImage, isPastDate, isValidDate } from '../../lib/utils';
import { DrivingStudent, Student, UploadedFile, Partner } from '../../types';
import { findDuplicateStudentField } from '../../lib/studentUniqueness';
import { FormInput, UploadCard } from './components/StudentFormFields';
import { CustomSelect } from '../ui/CustomSelect';
import { useLicenseRanks } from '../../hooks/useLicenseRanks';
import { DateInput } from '../ui/DateInput';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: DrivingStudent) => void;
  students: Student[];
  selectedCenter?: string;
}

type FileField = 'idCardFrontFile' | 'idCardBackFile' | 'vneidIdCardFile' | 'portraitFile';

export function AddStudentModal({ isOpen, onClose, onSuccess, students, selectedCenter }: AddStudentModalProps) {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const { centers } = useAdminCenters();
  const businessType = user?.businessType || 'driving';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<FileField | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCenterId, setSelectedCenterId] = useState<string>(() => {
    return selectedCenter && selectedCenter !== 'all' ? selectedCenter : '';
  });
  const { courses } = useCourses(user?.role === 'superadmin' ? selectedCenterId : undefined);
  const { ranks: licenseRanks } = useLicenseRanks(user?.role === 'superadmin' ? selectedCenterId : undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCenterId(selectedCenter && selectedCenter !== 'all' ? selectedCenter : '');
  }, [selectedCenter]);

  const [referralMode, setReferralMode] = useState<'none' | 'partner' | 'custom'>('none');
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const ownerId = user?.role === 'superadmin' ? selectedCenterId : undefined;
        const params = new URLSearchParams({ isActive: 'true' });
        if (ownerId) params.append('ownerFilter', ownerId);

        const res = await apiFetch(`/partners?${params.toString()}`);
        if (res.success && res.partners) {
          setPartners(res.partners);
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    };
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen, selectedCenterId, user]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referral: '',
    partnerId: '',
    birthday: '',
    idCard: '',
    rank: '',
    courseId: '',
    registrationDate: new Date().toLocaleDateString('vi-VN'),
    enrollmentDate: '',
    fee: '',
    address: '',
    email: '',
    idCardFrontFile: undefined as UploadedFile | undefined,
    idCardBackFile: undefined as UploadedFile | undefined,
    vneidIdCardFile: undefined as UploadedFile | undefined,
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

    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['fullName', 'phone', 'email', 'birthday', 'enrollmentDate', 'idCard', 'rank'];
    fieldsToValidate.forEach(field => {
      const val = formData[field as keyof typeof formData];
      if (typeof val === 'string') {
        const err = validateField(field, val);
        if (err) newErrors[field] = err;
      }
    });

    if (businessType === 'driving') {
      if (!formData.idCardFrontFile) {
        newErrors.idCardFrontFile = 'Vui lòng tải lên ảnh mặt trước CCCD.';
      }
      if (!formData.idCardBackFile) {
        newErrors.idCardBackFile = 'Vui lòng tải lên ảnh mặt sau CCCD.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const message = 'Vui lòng kiểm tra lại các thông tin nhập vào.';
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
          fee: formData.fee,
          idCardFront: formData.idCardFrontFile?.url || '',
          idCardBack: formData.idCardBackFile?.url || '',
          status: businessType === 'driving' ? ['Chờ KSK'] : ['Đang học'],
          registrationDate: new Date().toLocaleDateString('vi-VN'),
          centerId: selectedCenterId || undefined,
          partnerId: formData.partnerId || undefined,
        }),
      });

      if (res.success && res.data) {
        const studentWithId = { id: res.data._id, ...res.data };

        window.dispatchEvent(new Event('student-mutation'));
        toast.success('Đã lưu hồ sơ học viên thành công!');
        onClose();
        onSuccess(studentWithId);

        setFormData({
          fullName: '',
          phone: '',
          referral: '',
          partnerId: '',
          birthday: '',
          idCard: '',
          rank: '',
          courseId: '',
          registrationDate: new Date().toLocaleDateString('vi-VN'),
          enrollmentDate: '',
          fee: '',
          address: '',
          email: '',
          idCardFrontFile: undefined,
          idCardBackFile: undefined,
          vneidIdCardFile: undefined,
          portraitFile: undefined,
        });
        setReferralMode('none');
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
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setFormData(prev => ({
      ...prev,
      courseId: courseId,
      rank: course ? course.title : '',
      fee: course ? formatVND(course.fee) : '',
    }));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.rank;
      delete copy.fee;
      return copy;
    });
  };

  const validateField = (name: string, value: string): string => {
    if (requiredFields[name as keyof typeof requiredFields] && !value.trim()) {
      if (name === 'fullName') return 'Họ và tên không được để trống.';
      if (name === 'phone') return 'Số điện thoại không được để trống.';
      if (name === 'birthday') return 'Ngày sinh không được để trống.';
      if (name === 'idCard') return 'CCCD/CMND không được để trống.';
      if (name === 'email') return 'Email không được để trống.';
      if (name === 'rank') {
        return businessType === 'driving'
          ? 'Hạng bằng không được để trống.'
          : 'Khóa học đăng ký không được để trống.';
      }
    }

    if (name === 'phone' && value) {
      const phoneRegex = /^(0[35789]\d{8})$/;
      if (!phoneRegex.test(value)) {
        return 'Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).';
      }
    }

    if ((name === 'birthday' || name === 'enrollmentDate') && value && !isValidDate(value)) {
      return 'Ngày không hợp lệ. Vui lòng nhập đúng định dạng DD/MM/YYYY.';
    }

    if (name === 'birthday' && value && !isPastDate(value)) {
      return 'Ngày sinh phải là một ngày trong quá khứ.';
    }

    if (name === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Định dạng email không hợp lệ.';
      }
    }

    if (name === 'idCard' && value) {
      const idCardRegex = /^(\d{9}|\d{12})$/;
      if (!idCardRegex.test(value)) {
        return 'Số CCCD/CMND không hợp lệ (phải gồm 9 hoặc 12 chữ số).';
      }
      if (businessType === 'driving' && value.trim().length !== 12) {
        return 'Số CCCD phải có đúng 12 chữ số.';
      }
    }

    if (value && (name === 'phone' || name === 'email' || name === 'idCard')) {
      const checkData = {
        email: name === 'email' ? value : formData.email,
        phone: name === 'phone' ? value : formData.phone,
        idCard: name === 'idCard' ? value : formData.idCard,
      };
      const duplicateField = findDuplicateStudentField(students, checkData, undefined, businessType);
      if (duplicateField && duplicateField.field === name) {
        return `${duplicateField.label} đã tồn tại trong hệ thống.`;
      }
    }

    return '';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }));
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

            <form className="p-6 overflow-y-auto space-y-4 flex-1 min-h-0" onSubmit={handleSubmit}>
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
                  onBlur={handleInputBlur}
                  required={requiredFields.fullName}
                  placeholder="Nhập họ và tên..."
                  error={errors.fullName}
                />
                <FormInput
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  required={requiredFields.phone}
                  placeholder="Nhập số điện thoại..."
                  error={errors.phone}
                />
                <FormInput
                  label="Email học viên"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  required={requiredFields.email}
                  placeholder="Nhập địa chỉ email..."
                  className="sm:col-span-2"
                  error={errors.email}
                />

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Nguồn giới thiệu
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <select
                        value={referralMode}
                        onChange={(e) => {
                          const mode = e.target.value as 'none' | 'partner' | 'custom';
                          setReferralMode(mode);
                          if (mode === 'none') {
                            setFormData(prev => ({ ...prev, partnerId: '', referral: '' }));
                          } else if (mode === 'custom') {
                            setFormData(prev => ({ ...prev, partnerId: '', referral: '' }));
                          } else {
                            setFormData(prev => ({ ...prev, partnerId: partners[0]?._id || '', referral: partners[0]?.name || '' }));
                          }
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-pointer"
                      >
                        <option value="none">Không có giới thiệu</option>
                        <option value="partner">Đối tác / CTV hệ thống</option>
                        <option value="custom">Nhập người giới thiệu khác</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    {referralMode === 'partner' && (
                      <div className="relative">
                        <select
                          value={formData.partnerId}
                          onChange={(e) => {
                            const pId = e.target.value;
                            const pObj = partners.find(p => p._id === pId);
                            setFormData(prev => ({ ...prev, partnerId: pId, referral: pObj ? pObj.name : '' }));
                          }}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-pointer"
                        >
                          <option value="">-- Chọn đối tác --</option>
                          {partners.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.phone})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    )}

                    {referralMode === 'custom' && (
                      <input
                        type="text"
                        name="referral"
                        value={formData.referral}
                        onChange={handleInputChange}
                        placeholder="Nhập tên người giới thiệu..."
                        className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-cyan-600 transition-all"
                      />
                    )}
                  </div>
                </div>

                <DateInput
                  label="Ngày sinh"
                  variant="modal"
                  value={formData.birthday}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, birthday: value }));
                    if (errors.birthday) setErrors(prev => ({ ...prev, birthday: '' }));
                  }}
                  onBlur={(value) => setErrors(prev => ({ ...prev, birthday: validateField('birthday', value) }))}
                  required={requiredFields.birthday}
                  error={errors.birthday}
                />
                <FormInput
                  label="CCCD / CMND"
                  name="idCard"
                  value={formData.idCard}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  required={requiredFields.idCard}
                  placeholder="Nhập số CCCD (12 số)..."
                  error={errors.idCard}
                />



                {user?.businessType === 'language' || user?.businessType === 'general' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                      Khóa học đăng ký {requiredFields.rank && '*'}
                    </label>
                    <div className="relative">
                      <select
                        name="courseId"
                        value={formData.courseId}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className={`w-full px-4 py-2 bg-white border rounded-xl text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 transition-all cursor-pointer ${errors.rank ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200'
                          }`}
                      >
                        <option value="">-- Chọn khóa học --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.rank && <p className="text-[10px] text-rose-500 font-bold">{errors.rank}</p>}
                  </div>
                ) : (user?.businessType || 'driving') === 'driving' ? (
                  <CustomSelect
                    label="Hạng bằng (lái xe — tùy chọn)"
                    value={formData.rank}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, rank: val }));
                      if (errors.rank) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.rank;
                          return copy;
                        });
                      }
                    }}
                    options={licenseRanks.map(r => ({ value: r.name, label: r.name }))}
                    placeholder="-- Chọn hạng bằng --"
                    error={errors.rank}
                    theme="modal"
                  />
                ) : null}

                <FormInput
                  label="Ngày đăng ký"
                  name="registrationDate"
                  value={formData.registrationDate}
                  onChange={handleInputChange}
                  readOnly
                />
                <DateInput
                  label="Ngày nhập học"
                  variant="modal"
                  value={formData.enrollmentDate}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, enrollmentDate: value }));
                    if (errors.enrollmentDate) setErrors(prev => ({ ...prev, enrollmentDate: '' }));
                  }}
                  onBlur={(value) => setErrors(prev => ({ ...prev, enrollmentDate: validateField('enrollmentDate', value) }))}
                  required={false}
                  error={errors.enrollmentDate}
                />
                <FormInput
                  label="Học phí (VND)"
                  name="fee"
                  value={formData.fee}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Nhập học phí..."
                  error={errors.fee}
                />
                <FormInput
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Nhập địa chỉ..."
                  className="sm:col-span-2"
                />
              </div>

              {(user?.businessType || 'driving') === 'driving' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UploadCard
                    label="CCCD mặt trước"
                    file={formData.idCardFrontFile}
                    isUploading={uploadingField === 'idCardFrontFile'}
                    onFileChange={(file) => {
                      handleUploadFile('idCardFrontFile', file);
                      if (errors.idCardFrontFile) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.idCardFrontFile;
                          return copy;
                        });
                      }
                    }}
                    onRemove={() => setFormData(prev => ({ ...prev, idCardFrontFile: undefined }))}
                    error={errors.idCardFrontFile}
                  />
                  <UploadCard
                    label="CCCD mặt sau"
                    file={formData.idCardBackFile}
                    isUploading={uploadingField === 'idCardBackFile'}
                    onFileChange={(file) => {
                      handleUploadFile('idCardBackFile', file);
                      if (errors.idCardBackFile) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.idCardBackFile;
                          return copy;
                        });
                      }
                    }}
                    onRemove={() => setFormData(prev => ({ ...prev, idCardBackFile: undefined }))}
                    error={errors.idCardBackFile}
                  />
                  <UploadCard
                    label="Ảnh CCCD trên VNeID"
                    file={formData.vneidIdCardFile}
                    isUploading={uploadingField === 'vneidIdCardFile'}
                    onFileChange={(file) => handleUploadFile('vneidIdCardFile', file)}
                    onRemove={() => setFormData(prev => ({ ...prev, vneidIdCardFile: undefined }))}
                  />
                  <UploadCard
                    label="Ảnh chân dung"
                    file={formData.portraitFile}
                    isUploading={uploadingField === 'portraitFile'}
                    onFileChange={(file) => {
                      handleUploadFile('portraitFile', file);
                      if (errors.portraitFile) {
                        setErrors(prev => {
                          const copy = { ...prev };
                          delete copy.portraitFile;
                          return copy;
                        });
                      }
                    }}
                    onRemove={() => setFormData(prev => ({ ...prev, portraitFile: undefined }))}
                    error={errors.portraitFile}
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
