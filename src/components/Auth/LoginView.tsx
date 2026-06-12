import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Car, CheckCircle2, ShieldCheck, Zap, RefreshCcw, Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff, AlertCircle, User, Link } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export function LoginView() {
  const { login, loginWithEmail, registerWithEmail, isLoggingIn } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gasUrl, setGasUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || (isRegisterMode && (!displayName || !gasUrl))) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    
    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password, displayName, gasUrl);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  const handleModeSwitch = (mode: boolean) => {
    setIsRegisterMode(mode);
    setErrorMsg('');
    setDisplayName('');
    setGasUrl('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Left Side: Branding & Info */}
      <div className="relative flex-1 flex flex-col p-8 lg:p-16 z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Car className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">QLHV Lái Xe</h1>
            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Hệ thống quản lý thông minh</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-8 text-balance">
              NÂNG TẦM <span className="text-indigo-500">QUẢN LÝ</span> ĐÀO TẠO.
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
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">&copy; 2026 IGENTECH.VN</p>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <div className="w-2 h-2 rounded-full bg-slate-800" />
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="relative w-full lg:w-[540px] bg-white lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col p-8 lg:p-12 z-20">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRegisterMode ? 'register' : 'login'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                  {isRegisterMode && (
                    <button 
                      onClick={() => handleModeSwitch(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập'}
                  </h3>
                </div>
                <p className="text-slate-500 font-medium">
                  {isRegisterMode 
                    ? 'Tạo tài khoản mới để bắt đầu quản lý hệ thống của bạn.' 
                    : 'Chào mừng bạn trở lại, hãy đăng nhập để tiếp tục quản lý.'}
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
                {isRegisterMode && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}

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
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
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
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isRegisterMode && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL GAS</label>
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="url"
                        required
                        placeholder="https://script.google.com/macros/s/..."
                        value={gasUrl}
                        onChange={(e) => { setGasUrl(e.target.value); setErrorMsg(''); }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white outline-none transition-all font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {!isRegisterMode && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Quên mật khẩu?</button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : isRegisterMode ? (
                    <UserPlus className="w-5 h-5" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {isLoggingIn ? 'Đang xử lý...' : (isRegisterMode ? 'Đăng ký ngay' : 'Đăng nhập hệ thống')}
                </button>
              </form>

              {!isRegisterMode && (
                <>
                  <div className="relative flex items-center justify-center py-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <span className="relative px-4 bg-white text-[10px] font-bold text-slate-300 uppercase tracking-widest">Hoặc đăng nhập nhanh</span>
                  </div>

                  <button
                    onClick={login}
                    disabled={isLoggingIn}
                    type="button"
                    className="w-full flex items-center justify-center gap-4 py-4 rounded-2xl text-sm font-bold bg-white border-2 border-slate-100 text-slate-700 hover:border-indigo-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>

                  <div className="mt-8 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      Chưa có tài khoản?{' '}
                      <button 
                        onClick={() => handleModeSwitch(true)}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Đăng ký ngay
                      </button>
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-auto text-center pt-8">
          <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
            Điều khoản sử dụng & Chính sách bảo mật
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <span className="text-slate-400 text-sm font-semibold">{text}</span>
    </div>
  );
}
