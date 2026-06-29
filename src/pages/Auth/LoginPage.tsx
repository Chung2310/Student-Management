import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, CheckCircle2, ShieldCheck, Zap, RefreshCcw, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, MapPin, Calendar, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';

export function LoginPage() {
  const { loginWithEmail, isLoggingIn } = useAuth();
  
  // Auth query detection
  const queryParams = new URLSearchParams(window.location.search);
  const teacherId = queryParams.get('teacherId');
  
  const [mode, setMode] = useState<'login' | 'register'>(teacherId ? 'register' : 'login');
  const [teacherName, setTeacherName] = useState<string>('');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [birthday, setBirthday] = useState('');
  const [idCard, setIdCard] = useState('');
  const [rank, setRank] = useState('B2');
  const [area, setArea] = useState('Nội thành');
  const [address, setAddress] = useState('');

  // Fetch teacher's name if registration mode is active
  useEffect(() => {
    if (teacherId) {
      apiFetch(`/auth/teacher/${teacherId}`)
        .then(res => {
          if (res.success && res.data) {
            setTeacherName(res.data.displayName);
          }
        })
        .catch(err => {
          console.error("Fetch teacher error:", err);
          setErrorMsg("Không tìm thấy thông tin giáo viên. Vui lòng kiểm tra lại liên kết quét mã!");
        });
    }
  }, [teacherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      await loginWithEmail(email, password);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Đăng nhập thất bại.");
    }
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 8) value = value.slice(0, 8); // Max 8 digits

    let formatted = '';
    if (value.length > 0) {
      formatted += value.slice(0, 2);
    }
    if (value.length > 2) {
      formatted += '/' + value.slice(2, 4);
    }
    if (value.length > 4) {
      formatted += '/' + value.slice(4, 8);
    }
    setBirthday(formatted);
    setErrorMsg('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsRegistering(true);

    if (!fullName || !phone || !emailReg || !birthday || !idCard || !rank || !area || !address) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả các trường thông tin.");
      setIsRegistering(false);
      return;
    }

    // Validate phone number format (Vietnam phone: starts with 03, 05, 07, 08, 09 and has 10 digits)
    const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMsg("Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).");
      setIsRegistering(false);
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailReg.trim())) {
      setErrorMsg("Địa chỉ email không đúng định dạng.");
      setIsRegistering(false);
      return;
    }

    // Validate birthday format (dd/mm/yyyy)
    const birthdateRegex = /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!birthdateRegex.test(birthday.trim())) {
      setErrorMsg("Ngày sinh phải đúng định dạng ngày/tháng/năm (Ví dụ: 20/10/2000).");
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
          teacherId,
        }),
      });

      if (res.success) {
        setRegSuccess(true);
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Đăng ký thất bại.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-sky-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Left Side: Branding & Info */}
      <div className="relative flex-1 flex flex-col p-8 lg:p-16 z-10">
        <div className="flex items-center gap-3 mb-12">
          <img
            src="https://res.cloudinary.com/dgaofuhmv/image/upload/v1775301001/unnamed_tcmlmp.png"
            alt="Logo"
            className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-cyan-500/20 bg-cyan-600/10"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">IGEN Quản lý học viên Lái xe</h1>
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Hệ thống quản lý thông minh</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-8 text-balance">
              NÂNG TẦM <span className="text-cyan-500">QUẢN LÝ</span> ĐÀO TẠO.
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed mb-12">
              Giải pháp toàn diện tối ưu hóa quy trình tiếp nhận hồ sơ, theo dõi học phí và quản lý lịch thi tự động cho các trung tâm đào tạo lái xe.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <FeatureItem icon={ShieldCheck} text="Bảo mật dữ liệu tuyệt đối" />
              <FeatureItem icon={Zap} text="Xử lý hồ sơ trong tích tắc" />
              <FeatureItem icon={CheckCircle2} text="Tự động hóa thông báo" />
              <FeatureItem icon={Zap} text="Báo cáo tài chính chi tiết" />
            </div>
          </motion.div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">&copy; 2026 Igen Technology</p>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <div className="w-2 h-2 rounded-full bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Right Side: Forms */}
      <div className="relative w-full lg:w-[540px] bg-white lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col p-8 lg:p-12 z-20 overflow-y-auto no-scrollbar">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-6">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      Đăng nhập
                    </h3>
                    {teacherId && (
                      <button
                        onClick={() => setMode('register')}
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer"
                      >
                        Đăng ký học viên
                      </button>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium">
                    Chào mừng bạn trở lại, hãy đăng nhập để tiếp tục quản lý.
                  </p>
                </div>

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-bold"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username (Email)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">Quên mật khẩu?</button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {isLoggingIn ? 'Đang xử lý...' : 'Đăng nhập hệ thống'}
                  </button>
                </form>
              </motion.div>
            ) : regSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                    Đăng ký thành công!
                  </h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                    Hồ sơ học viên <span className="font-bold text-slate-800">{fullName}</span> đã được ghi nhận thành công và liên kết trực tiếp vào danh sách của giáo viên <span className="font-bold text-cyan-600">{teacherName || 'hệ thống'}</span>.
                  </p>
                  <button
                    onClick={() => {
                      // Reset registration state
                      setFullName('');
                      setPhone('');
                      setEmailReg('');
                      setBirthday('');
                      setIdCard('');
                      setAddress('');
                      setRegSuccess(false);
                      setMode('login');
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-lg cursor-pointer"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  {teacherId && (
                    <button
                      onClick={() => setMode('login')}
                      className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Quay lại đăng nhập
                    </button>
                  )}
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Đăng ký học viên mới
                  </h3>
                  {teacherName && (
                    <p className="text-slate-500 text-sm font-medium mt-1">
                      Giáo viên hướng dẫn: <span className="text-cyan-600 font-bold">{teacherName}</span>
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-sm font-bold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Họ và tên *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số điện thoại *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          placeholder="09xxxxxxxx"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); setErrorMsg(''); }}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ngày sinh *</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="dd/mm/yyyy"
                          value={birthday}
                          onChange={handleBirthdayChange}
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hạng bằng *</label>
                      <select
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-sm appearance-none"
                      >
                        <option value="A1">Hạng A1</option>
                        <option value="A2">Hạng A2</option>
                        <option value="B1">Hạng B1</option>
                        <option value="B2">Hạng B2</option>
                        <option value="C">Hạng C</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Khu vực *</label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-sm appearance-none"
                      >
                        <option value="Nội thành">Nội thành</option>
                        <option value="Ngoại thành">Ngoại thành</option>
                        <option value="Tỉnh lân cận">Tỉnh lân cận</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số CCCD/CMND *</label>
                      <input
                        type="text"
                        required
                        placeholder="Số CCCD..."
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={emailReg}
                        onChange={(e) => { setEmailReg(e.target.value); setErrorMsg(''); }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Địa chỉ *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nhập địa chỉ của bạn..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-cyan-600 focus:bg-white outline-none transition-all font-medium text-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
                  >
                    {isRegistering ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isRegistering ? 'Đang gửi thông tin...' : 'Hoàn tất đăng ký'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto text-center pt-8">
          <button className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors">
            Điều khoản sử dụng & Chính sách bảo mật
          </button>
        </div>
      </div>
    </div>
  );
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
