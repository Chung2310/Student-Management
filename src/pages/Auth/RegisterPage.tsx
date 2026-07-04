import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, RefreshCcw, AlertCircle, User, 
  Phone, MapPin, ChevronLeft, Upload, 
  Image as ImageIcon, Trash2 
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { UploadedFile } from '../../types';
import { toDisplayDate } from '../../lib/utils';
import { DateInput } from '../../components/ui/DateInput';

type PublicFileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

interface RegisterPageProps {
  onNavigateToPath: (path: string) => void;
}

export function RegisterPage({ onNavigateToPath }: RegisterPageProps) {
  const queryParams = new URLSearchParams(window.location.search);
  const teacherId = queryParams.get('teacherId');

  const [teacherName, setTeacherName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<PublicFileField | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [birthday, setBirthday] = useState('');
  const [idCard, setIdCard] = useState('');
  const [rank, setRank] = useState('Không (ngành khác)');
  const [address, setAddress] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [referral, setReferral] = useState('');
  const [idCardFrontFile, setIdCardFrontFile] = useState<UploadedFile | undefined>();
  const [idCardBackFile, setIdCardBackFile] = useState<UploadedFile | undefined>();
  const [portraitFile, setPortraitFile] = useState<UploadedFile | undefined>();

  // Field-specific validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!teacherId) return;
    apiFetch(`/auth/teacher/${teacherId}`)
      .then(res => {
        if (res.success && res.data) setTeacherName(res.data.displayName);
      })
      .catch(() => setErrorMsg('Không tìm thấy thông tin giáo viên. Vui lòng kiểm tra lại liên kết quét mã!'));
  }, [teacherId]);

  const updateField = (field: string, val: string) => {
    if (field === 'fullName') setFullName(val);
    if (field === 'phone') setPhone(val);
    if (field === 'email') setEmailReg(val);
    if (field === 'birthday') setBirthday(val);
    if (field === 'idCard') setIdCard(val);
    if (field === 'rank') setRank(val);
    if (field === 'address') setAddress(val);
    if (field === 'referral') setReferral(val);
    if (field === 'enrollmentDate') setEnrollmentDate(val);

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateFileField = (field: PublicFileField, val: UploadedFile | undefined) => {
    if (field === 'idCardFrontFile') setIdCardFrontFile(val);
    if (field === 'idCardBackFile') setIdCardBackFile(val);
    if (field === 'portraitFile') setPortraitFile(val);

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: string) => {
    const newErrors = { ...errors };
    if (field === 'phone') {
      const phoneRegex = /^(0[35789]\d{8})$/;
      if (!phone.trim()) {
        newErrors.phone = 'Số điện thoại không được để trống.';
      } else if (!phoneRegex.test(phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).';
      } else {
        delete newErrors.phone;
      }
    }
    if (field === 'idCard') {
      const idCardRegex = /^\d{12}$/;
      if (!idCard.trim()) {
        newErrors.idCard = 'Số CCCD/CMND không được để trống.';
      } else if (!idCardRegex.test(idCard.trim())) {
        newErrors.idCard = 'Số CCCD không hợp lệ (phải gồm đúng 12 chữ số).';
      } else {
        delete newErrors.idCard;
      }
    }
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.trim()) {
        newErrors.email = 'Email không được để trống.';
      } else if (!emailRegex.test(emailReg.trim())) {
        newErrors.email = 'Định dạng email không hợp lệ (ví dụ: name@example.com).';
      } else {
        delete newErrors.email;
      }
    }
    setErrors(newErrors);
  };

  const handleUploadFile = async (field: PublicFileField, file?: File) => {
    if (!file) return;
    setUploadingField(field);
    setErrorMsg('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiFetch('/upload', { method: 'POST', body });
      if (res.success && res.data) {
        const uploaded = {
          name: res.data.name,
          url: res.data.url,
          type: res.data.type,
          uploadedAt: res.data.uploadedAt || new Date().toISOString(),
        };
        updateFileField(field, uploaded);
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Tải ảnh thất bại.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrors({});
    setIsRegistering(true);

    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống.';
    }

    // Validate phone number
    const phoneRegex = /^(0[35789]\d{8})$/;
    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống.';
    } else if (!phoneRegex.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09).';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.trim()) {
      newErrors.email = 'Email không được để trống.';
    } else if (!emailRegex.test(emailReg.trim())) {
      newErrors.email = 'Định dạng email không hợp lệ (ví dụ: name@example.com).';
    }

    // Validate CCCD
    const idCardRegex = /^\d{12}$/;
    if (!idCard.trim()) {
      newErrors.idCard = 'Số CCCD/CMND không được để trống.';
    } else if (!idCardRegex.test(idCard.trim())) {
      newErrors.idCard = 'Số CCCD không hợp lệ (phải gồm đúng 12 chữ số).';
    }

    // Validate dates
    if (!birthday) {
      newErrors.birthday = 'Ngày sinh không được để trống.';
    } else {
      const birthDate = new Date(birthday);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate >= today) {
        newErrors.birthday = 'Ngày sinh không hợp lệ (phải là ngày trong quá khứ).';
      }
    }

    if (!enrollmentDate) {
      newErrors.enrollmentDate = 'Ngày nhập học không được để trống.';
    } else {
      const enrollDate = new Date(enrollmentDate);
      if (isNaN(enrollDate.getTime())) {
        newErrors.enrollmentDate = 'Ngày nhập học không hợp lệ.';
      }
    }

    if (!address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống.';
    }

    // Validate file uploads
    if (!idCardFrontFile) {
      newErrors.idCardFrontFile = 'Ảnh CCCD mặt trước là bắt buộc.';
    }
    if (!idCardBackFile) {
      newErrors.idCardBackFile = 'Ảnh CCCD mặt sau là bắt buộc.';
    }
    if (!portraitFile) {
      newErrors.portraitFile = 'Ảnh chân dung là bắt buộc.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsRegistering(false);
      return;
    }

    try {
      const res = await apiFetch('/students/public-register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone,
          email: emailReg,
          birthday: toDisplayDate(birthday),
          idCard,
          rank: rank === 'Không (ngành khác)' ? '' : rank,
          address,
          enrollmentDate: toDisplayDate(enrollmentDate),
          idCardFrontFile,
          idCardBackFile,
          portraitFile,
          teacherId,
          referral,
        }),
      });
      if (res.success) {
        setRegSuccess(true);
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Đăng ký thất bại.');
    } finally {
      setIsRegistering(false);
    }
  };

  const resetRegister = () => {
    setFullName('');
    setPhone('');
    setEmailReg('');
    setBirthday('');
    setIdCard('');
    setAddress('');
    setEnrollmentDate('');
    setReferral('');
    setIdCardFrontFile(undefined);
    setIdCardBackFile(undefined);
    setPortraitFile(undefined);
    setRegSuccess(false);
    setErrors({});
    onNavigateToPath('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 z-20 overflow-hidden my-4"
      >
        <AnimatePresence mode="wait">
          {!regSuccess ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <button 
                    onClick={() => onNavigateToPath('/login')} 
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mb-2 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Quay lại đăng nhập
                  </button>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng ký học viên mới</h3>
                  {teacherName && (
                    <p className="text-slate-500 text-xs font-semibold mt-1">
                      Giáo viên hướng dẫn: <span className="text-cyan-600 font-bold">{teacherName}</span>
                    </p>
                  )}
                </div>
                <img 
                  src="/logo-igen.png" 
                  alt="Logo" 
                  className="w-10 h-10 rounded-xl object-contain shadow-md shrink-0 self-start sm:self-center" 
                />
              </div>

              {errorMsg && <AlertBanner message={errorMsg} />}

              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-5">
                <Input 
                  icon={User} 
                  value={fullName} 
                  onChange={(val) => updateField('fullName', val)} 
                  placeholder="Nguyễn Văn A" 
                  label="Họ và tên *" 
                  error={errors.fullName}
                  onBlur={() => handleBlur('fullName')}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    icon={Phone} 
                    value={phone} 
                    onChange={(val) => updateField('phone', val)} 
                    placeholder="09xxxxxxxx" 
                    label="Số điện thoại *" 
                    error={errors.phone}
                    onBlur={() => handleBlur('phone')}
                  />
                  <DateInput
                    label="Ngày sinh"
                    value={birthday}
                    onChange={(val) => updateField('birthday', val)}
                    error={errors.birthday}
                    onBlur={() => handleBlur('birthday')}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select 
                    value={rank} 
                    onChange={(val) => updateField('rank', val)} 
                    label="Hạng bằng (lái xe)" 
                    options={['Không (ngành khác)', 'A1', 'A2', 'B1', 'B2', 'C']} 
                  />
                  <DateInput
                    label="Ngày nhập học"
                    value={enrollmentDate}
                    onChange={(val) => updateField('enrollmentDate', val)}
                    error={errors.enrollmentDate}
                    onBlur={() => handleBlur('enrollmentDate')}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    value={idCard} 
                    onChange={(val) => updateField('idCard', val)} 
                    placeholder="Số CCCD..." 
                    label="Số CCCD/CMND *" 
                    error={errors.idCard}
                    onBlur={() => handleBlur('idCard')}
                  />
                  <Input 
                    type="email" 
                    value={emailReg} 
                    onChange={(val) => updateField('email', val)} 
                    placeholder="name@example.com" 
                    label="Email *" 
                    error={errors.email}
                    onBlur={() => handleBlur('email')}
                  />
                </div>
                
                <Input 
                  icon={MapPin} 
                  value={address} 
                  onChange={(val) => updateField('address', val)} 
                  placeholder="Nhập địa chỉ của bạn..." 
                  label="Địa chỉ *" 
                  error={errors.address}
                  onBlur={() => handleBlur('address')}
                />
                <Input 
                  icon={User} 
                  value={referral} 
                  onChange={(val) => updateField('referral', val)} 
                  placeholder="Nhập tên người giới thiệu (nếu có)..." 
                  label="Người giới thiệu" 
                  required={false} 
                />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hình ảnh đính kèm *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PublicUploadCard 
                      label="CCCD mặt trước *" 
                      file={idCardFrontFile} 
                      isUploading={uploadingField === 'idCardFrontFile'} 
                      onUpload={(file) => handleUploadFile('idCardFrontFile', file)} 
                      onRemove={() => updateFileField('idCardFrontFile', undefined)} 
                      error={errors.idCardFrontFile}
                    />
                    <PublicUploadCard 
                      label="CCCD mặt sau *" 
                      file={idCardBackFile} 
                      isUploading={uploadingField === 'idCardBackFile'} 
                      onUpload={(file) => handleUploadFile('idCardBackFile', file)} 
                      onRemove={() => updateFileField('idCardBackFile', undefined)} 
                      error={errors.idCardBackFile}
                    />
                    <PublicUploadCard 
                      label="Ảnh chân dung *" 
                      file={portraitFile} 
                      isUploading={uploadingField === 'portraitFile'} 
                      onUpload={(file) => handleUploadFile('portraitFile', file)} 
                      onRemove={() => updateFileField('portraitFile', undefined)} 
                      error={errors.portraitFile}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isRegistering} 
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer"
                >
                  {isRegistering ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isRegistering ? 'Đang gửi thông tin...' : 'Hoàn tất đăng ký'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-6"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Đăng ký thành công!</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                Hồ sơ học viên <span className="font-bold text-slate-800">{fullName}</span> đã được ghi nhận thành công và liên kết trực tiếp vào danh sách của giáo viên <span className="font-bold text-cyan-600">{teacherName || 'hệ thống'}</span>.
              </p>
              <button 
                onClick={resetRegister} 
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg cursor-pointer"
              >
                Quay lại trang chủ
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Subcomponents matching LoginPage
interface InputProps {
  icon?: React.ComponentType<{ className?: string }>; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string; 
  label: string; 
  type?: string; 
  required?: boolean; 
  error?: string;
  onBlur?: () => void;
}

function Input({ 
  icon: Icon, value, onChange, placeholder, label, type = 'text', required = true, error, onBlur 
}: InputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalVal(value);
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
        <input 
          ref={inputRef}
          type={type} 
          required={required} 
          placeholder={placeholder} 
          value={localVal} 
          onChange={(e) => {
            setLocalVal(e.target.value);
            onChange(e.target.value);
          }}
          onBlur={() => {
            setLocalVal(value);
            onBlur?.();
          }}
          className={`w-full py-3.5 rounded-xl bg-slate-50 border outline-none transition-all font-medium text-slate-900 text-sm ${error ? 'border-rose-300 bg-rose-50/10 focus:border-rose-500' : 'border-slate-100 focus:border-cyan-600 focus:bg-white'} ${Icon ? 'pl-11 pr-4' : 'px-4'}`} 
        />
      </div>
      {error && <p className="text-[11px] font-bold text-rose-500 ml-1">{error}</p>}
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[]; }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-sm appearance-none"
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function AlertBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-bold">
      <AlertCircle className="w-5 h-5 shrink-0" />
      {message}
    </div>
  );
}

function PublicUploadCard({ 
  label, file, isUploading, onUpload, onRemove, error 
}: { 
  label: string; 
  file?: UploadedFile; 
  isUploading: boolean; 
  onUpload: (file?: File) => void; 
  onRemove: () => void; 
  error?: string;
}) {
  return (
    <div className={`border rounded-2xl p-3 space-y-2 transition-colors ${error ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-700">{label}</p>
        {file && <button type="button" onClick={onRemove} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>}
      </div>
      {file ? (
        <a href={file.url} target="_blank" rel="noreferrer" className="block">
          <div className="h-40 sm:h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            {file.type.includes('image') ? <img src={file.url} alt={file.name} className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-slate-400" />}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 truncate">{file.name}</p>
        </a>
      ) : (
        <label className={`h-40 sm:h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors ${error ? 'border-rose-300' : 'border-slate-200'}`}>
          {isUploading ? <RefreshCcw className="w-4 h-4 text-cyan-500 animate-spin" /> : <Upload className="w-4 h-4 text-cyan-500" />}
          <span className="text-[10px] text-slate-500 mt-2">Tải ảnh lên</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
      )}
      {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}
    </div>
  );
}
