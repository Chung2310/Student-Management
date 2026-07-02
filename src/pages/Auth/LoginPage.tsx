import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, CheckCircle2, ShieldCheck, Zap, RefreshCcw, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, MapPin, Calendar, ChevronLeft, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import { UploadedFile } from '../../types';

type PublicFileField = 'idCardFrontFile' | 'idCardBackFile' | 'portraitFile';

interface LoginPageProps {
  onNavigateToPath: (path: string) => void;
}

export function LoginPage({ onNavigateToPath }: LoginPageProps) {
  const { loginWithEmail, isLoggingIn } = useAuth();
  const queryParams = new URLSearchParams(window.location.search);
  const teacherId = queryParams.get('teacherId');

  const [mode, setMode] = useState<'login' | 'register'>(teacherId ? 'register' : 'login');
  const [teacherName, setTeacherName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<PublicFileField | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [birthday, setBirthday] = useState('');
  const [idCard, setIdCard] = useState('');
  const [rank, setRank] = useState('B2');
  const [area, setArea] = useState('Nội thành');
  const [address, setAddress] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [idCardFrontFile, setIdCardFrontFile] = useState<UploadedFile | undefined>();
  const [idCardBackFile, setIdCardBackFile] = useState<UploadedFile | undefined>();
  const [portraitFile, setPortraitFile] = useState<UploadedFile | undefined>();

  useEffect(() => {
    if (!teacherId) return;
    apiFetch(`/auth/teacher/${teacherId}`)
      .then(res => {
        if (res.success && res.data) setTeacherName(res.data.displayName);
      })
      .catch(() => setErrorMsg('Không tìm thấy thông tin giáo viên. Vui lòng kiểm tra lại liên kết quét mã!'));
  }, [teacherId]);

  const formatDate = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    if (clean.length > 4) return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    if (clean.length > 2) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      await loginWithEmail(email, password);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    }
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
        if (field === 'idCardFrontFile') setIdCardFrontFile(uploaded);
        if (field === 'idCardBackFile') setIdCardBackFile(uploaded);
        if (field === 'portraitFile') setPortraitFile(uploaded);
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
    setIsRegistering(true);

    if (!fullName || !phone || !emailReg || !birthday || !idCard || !rank || !area || !address || !enrollmentDate) {
      setErrorMsg('Vui lòng điền đầy đủ tất cả các trường thông tin.');
      setIsRegistering(false);
      return;
    }
    if (!idCardFrontFile || !idCardBackFile || !portraitFile) {
      setErrorMsg('Vui lòng tải đủ ảnh CCCD mặt trước, CCCD mặt sau và ảnh chân dung.');
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
          birthday,
          idCard,
          rank,
          area,
          address,
          enrollmentDate,
          idCardFrontFile,
          idCardBackFile,
          portraitFile,
          teacherId,
        }),
      });
      if (res.success) setRegSuccess(true);
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
    setIdCardFrontFile(undefined);
    setIdCardBackFile(undefined);
    setPortraitFile(undefined);
    setRegSuccess(false);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative flex-1 flex flex-col p-8 lg:p-16 z-10">
        <div className="flex items-center gap-3 mb-12">
          <img src="https://res.cloudinary.com/dgaofuhmv/image/upload/v1775301001/unnamed_tcmlmp.png" alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 bg-cyan-600/10" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">IGEN Quản lý Học viên</h1>
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Hệ thống quản lý thông minh</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-8 text-balance">
              NÂNG TẦM <span className="text-cyan-500">QUẢN LÝ</span> ĐÀO TẠO.
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed mb-12">
              Giải pháp toàn diện tối ưu hóa quy trình tiếp nhận hồ sơ, theo dõi học phí và quản lý học vụ tự động cho các tổ chức giáo dục.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <FeatureItem icon={ShieldCheck} text="Bảo mật dữ liệu tuyệt đối" />
              <FeatureItem icon={Zap} text="Xử lý hồ sơ trong tích tắc" />
              <FeatureItem icon={CheckCircle2} text="Tự động hóa thông báo" />
              <FeatureItem icon={Zap} text="Báo cáo tài chính chi tiết" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative w-full lg:w-[560px] bg-white lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col p-8 lg:p-12 z-20 overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-6">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Đăng nhập</h3>
                    {teacherId && <button onClick={() => setMode('register')} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer">Đăng ký học viên</button>}
                  </div>
                </div>
                {errorMsg && <AlertBanner message={errorMsg} />}
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <Input icon={Mail} type="email" value={email} onChange={setEmail} placeholder="example@gmail.com" label="Username (Email)" />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }} className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-600 transition-colors">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                    {isLoggingIn ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                    {isLoggingIn ? 'Đang xử lý...' : 'Đăng nhập hệ thống'}
                  </button>
                </form>
              </motion.div>
            ) : regSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Đăng ký thành công!</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">Hồ sơ học viên <span className="font-bold text-slate-800">{fullName}</span> đã được ghi nhận thành công và liên kết trực tiếp vào danh sách của giáo viên <span className="font-bold text-cyan-600">{teacherName || 'hệ thống'}</span>.</p>
                  <button onClick={resetRegister} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg cursor-pointer">Quay lại đăng nhập</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  {teacherId && <button onClick={() => setMode('login')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mb-4 cursor-pointer"><ChevronLeft className="w-4 h-4" /> Quay lại đăng nhập</button>}
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng ký học viên mới</h3>
                  {teacherName && <p className="text-slate-500 text-sm font-medium mt-1">Giáo viên hướng dẫn: <span className="text-cyan-600 font-bold">{teacherName}</span></p>}
                </div>
                {errorMsg && <AlertBanner message={errorMsg} />}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <Input icon={User} value={fullName} onChange={setFullName} placeholder="Nguyễn Văn A" label="Họ và tên *" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input icon={Phone} value={phone} onChange={setPhone} placeholder="09xxxxxxxx" label="Số điện thoại *" />
                    <Input icon={Calendar} value={birthday} onChange={(value) => setBirthday(formatDate(value))} placeholder="dd/mm/yyyy" label="Ngày sinh *" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={rank} onChange={setRank} label="Hạng bằng *" options={['A1', 'A2', 'B1', 'B2', 'C']} />
                    <Select value={area} onChange={setArea} label="Khu vực *" options={['Nội thành', 'Ngoại thành', 'Tỉnh lân cận']} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={idCard} onChange={setIdCard} placeholder="Số CCCD..." label="Số CCCD/CMND *" />
                    <Input type="email" value={emailReg} onChange={setEmailReg} placeholder="name@example.com" label="Email *" />
                  </div>
                  <Input icon={Calendar} value={enrollmentDate} onChange={(value) => setEnrollmentDate(formatDate(value))} placeholder="dd/mm/yyyy" label="Ngày nhập học *" />
                  <Input icon={MapPin} value={address} onChange={setAddress} placeholder="Nhập địa chỉ của bạn..." label="Địa chỉ *" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PublicUploadCard label="CCCD mặt trước *" file={idCardFrontFile} isUploading={uploadingField === 'idCardFrontFile'} onUpload={(file) => handleUploadFile('idCardFrontFile', file)} onRemove={() => setIdCardFrontFile(undefined)} />
                    <PublicUploadCard label="CCCD mặt sau *" file={idCardBackFile} isUploading={uploadingField === 'idCardBackFile'} onUpload={(file) => handleUploadFile('idCardBackFile', file)} onRemove={() => setIdCardBackFile(undefined)} />
                    <PublicUploadCard label="Ảnh chân dung *" file={portraitFile} isUploading={uploadingField === 'portraitFile'} onUpload={(file) => handleUploadFile('portraitFile', file)} onRemove={() => setPortraitFile(undefined)} />
                  </div>
                  <button type="submit" disabled={isRegistering} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer">
                    {isRegistering ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {isRegistering ? 'Đang gửi thông tin...' : 'Hoàn tất đăng ký'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legal links footer */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-450">
          <button 
            type="button"
            onClick={() => onNavigateToPath('/terms')} 
            className="hover:text-cyan-650 transition-colors cursor-pointer bg-transparent border-none p-0 font-bold"
          >
            Điều khoản dịch vụ
          </button>
          <span className="text-slate-200">|</span>
          <button 
            type="button"
            onClick={() => onNavigateToPath('/privacy')} 
            className="hover:text-cyan-650 transition-colors cursor-pointer bg-transparent border-none p-0 font-bold"
          >
            Chính sách bảo mật
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ icon: Icon, value, onChange, placeholder, label, type = 'text' }: { icon?: React.ComponentType<{ className?: string }>; value: string; onChange: (value: string) => void; placeholder?: string; label: string; type?: string; }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input type={type} required placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm ${Icon ? 'pl-11 pr-4' : 'px-4'}`} />
      </div>
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[]; }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-sm appearance-none">
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function AlertBanner({ message }: { message: string }) {
  return <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-bold"><AlertCircle className="w-5 h-5 shrink-0" />{message}</div>;
}

function FeatureItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>, text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <span className="text-slate-400 text-sm font-semibold">{text}</span>
    </div>
  );
}

function PublicUploadCard({ label, file, isUploading, onUpload, onRemove }: { label: string; file?: UploadedFile; isUploading: boolean; onUpload: (file?: File) => void; onRemove: () => void; }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-700">{label}</p>
        {file && <button type="button" onClick={onRemove} className="text-rose-500"><Trash2 className="w-4 h-4" /></button>}
      </div>
      {file ? (
        <a href={file.url} target="_blank" rel="noreferrer" className="block">
          <div className="h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            {file.type.includes('image') ? <img src={file.url} alt={file.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-400" />}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 truncate">{file.name}</p>
        </a>
      ) : (
        <label className="h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
          {isUploading ? <RefreshCcw className="w-4 h-4 text-cyan-500 animate-spin" /> : <Upload className="w-4 h-4 text-cyan-500" />}
          <span className="text-[10px] text-slate-500 mt-2">Tải ảnh lên</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
