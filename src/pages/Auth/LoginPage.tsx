import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, CheckCircle2, ShieldCheck, Zap, RefreshCcw, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { loginWithEmail, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

      {/* Right Side: Login Form */}
      <div className="relative w-full lg:w-[540px] bg-white lg:rounded-l-[3rem] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col p-8 lg:p-12 z-20">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    Đăng nhập
                  </h3>
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
                  className="w-full py-4 bg-cyan-600 text-white rounded-2xl font-bold hover:bg-cyan-700 shadow-lg shadow-cyan-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
