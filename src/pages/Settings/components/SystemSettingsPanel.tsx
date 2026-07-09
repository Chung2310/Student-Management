import React from 'react';
import { Activity, CheckCircle2, Info, Loader2, Mail, QrCode, Smartphone } from 'lucide-react';
import { cn, getVietQRBankCode } from '../../../lib/utils';
import { PrimaryButton, SecondaryButton, SettingsInput, SettingsPanel } from './SettingsShared';

interface SystemSettingsPanelProps {
  businessType?: 'driving' | 'language' | 'general';
  isAdmin: boolean;
  vietqrEnabled: boolean;
  setVietqrEnabled: (value: boolean) => void;
  vietqrBankId: string;
  setVietqrBankId: (value: string) => void;
  vietqrAccountNo: string;
  setVietqrAccountNo: (value: string) => void;
  vietqrAccountName: string;
  setVietqrAccountName: (value: string) => void;
  vietqrTemplate: string;
  setVietqrTemplate: (value: string) => void;
  isSavingVietqr: boolean;
  onSaveVietqr: () => void;
  smtpHost: string;
  setSmtpHost: (value: string) => void;
  smtpPort: string;
  setSmtpPort: (value: string) => void;
  smtpSecure: boolean;
  setSmtpSecure: (value: boolean) => void;
  smtpUser: string;
  setSmtpUser: (value: string) => void;
  smtpPass: string;
  setSmtpPass: (value: string) => void;
  smtpFrom: string;
  setSmtpFrom: (value: string) => void;
  smtpSandboxEmail: string;
  setSmtpSandboxEmail: (value: string) => void;
  isSavingSmtp: boolean;
  isTestingSmtp: boolean;
  onSaveSmtp: () => void;
  onTestSmtp: () => void;
  smsProvider: 'twilio' | 'stringee' | 'tingting';
  setSmsProvider: (value: 'twilio' | 'stringee' | 'tingting') => void;
  tingtingApiKey: string;
  setTingtingApiKey: (value: string) => void;
  tingtingSender: string;
  setTingtingSender: (value: string) => void;
  isSavingSms: boolean;
  isTestingSms: boolean;
  onSaveSms: () => void;
  onTestSms: () => void;
}

export function SystemSettingsPanel(props: SystemSettingsPanelProps) {
  const {
    isAdmin,
    vietqrEnabled,
    setVietqrEnabled,
    vietqrBankId,
    setVietqrBankId,
    vietqrAccountNo,
    setVietqrAccountNo,
    vietqrAccountName,
    setVietqrAccountName,
    vietqrTemplate,
    setVietqrTemplate,
    isSavingVietqr,
    onSaveVietqr,
    smtpHost,
    setSmtpHost,
    smtpPort,
    setSmtpPort,
    smtpSecure,
    setSmtpSecure,
    smtpUser,
    setSmtpUser,
    smtpPass,
    setSmtpPass,
    smtpFrom,
    setSmtpFrom,
    smtpSandboxEmail,
    setSmtpSandboxEmail,
    isSavingSmtp,
    isTestingSmtp,
    onSaveSmtp,
    onTestSmtp,
    smsProvider,
    setSmsProvider,
    tingtingApiKey,
    setTingtingApiKey,
    tingtingSender,
    setTingtingSender,
    isSavingSms,
    isTestingSms,
    onSaveSms,
    onTestSms,
  } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SettingsPanel
        title="Cấu hình VietQR & chuyển khoản"
        icon={QrCode}
        actions={
          <PrimaryButton onClick={onSaveVietqr} disabled={!isAdmin || isSavingVietqr}>
            {isSavingVietqr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Lưu cấu hình
          </PrimaryButton>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600">Trạng thái VietQR</label>
              <button
                type="button"
                disabled={!isAdmin}
                onClick={() => setVietqrEnabled(!vietqrEnabled)}
                className={cn(
                  'font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                  vietqrEnabled ? 'text-emerald-500' : 'text-slate-400'
                )}
              >
                <CheckCircle2 size={14} /> {vietqrEnabled ? 'Đang bật' : 'Đang tắt'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[160px]">
              {vietqrEnabled && vietqrBankId && vietqrAccountNo ? (
                <img
                  src={`https://img.vietqr.io/image/${getVietQRBankCode(vietqrBankId)}-${vietqrAccountNo}-compact2.png?amount=0&addInfo=TEST&accountName=${encodeURIComponent(vietqrAccountName)}`}
                  alt="VietQR Code"
                  className="w-32 h-32 object-contain rounded-lg shadow-sm bg-white"
                />
              ) : (
                <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300">
                  <QrCode size={48} />
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SettingsInput label="Ngân hàng">
                <select
                  disabled={!isAdmin}
                  value={vietqrBankId}
                  onChange={(e) => setVietqrBankId(e.target.value)}
                  className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="mbbank">MBBank (MB)</option>
                  <option value="vietcombank">Vietcombank (VCB)</option>
                  <option value="techcombank">Techcombank (TCB)</option>
                  <option value="vietinbank">Vietinbank (CTG)</option>
                  <option value="bidv">BIDV</option>
                  <option value="agribank">Agribank (VBA)</option>
                  <option value="acb">ACB</option>
                  <option value="sacombank">Sacombank (STB)</option>
                  <option value="tpbank">TPBank (TPB)</option>
                  <option value="vpbank">VPBank (VPB)</option>
                </select>
              </SettingsInput>

              <SettingsInput label="Số tài khoản">
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="Nhập số tài khoản..."
                  value={vietqrAccountNo}
                  onChange={(e) => setVietqrAccountNo(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </SettingsInput>
            </div>

            <SettingsInput label="Tên chủ tài khoản">
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="VD: NGUYEN VAN A"
                value={vietqrAccountName}
                onChange={(e) => setVietqrAccountName(e.target.value.toUpperCase())}
                className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </SettingsInput>

            <SettingsInput label="Nội dung chuyển khoản mặc định">
              <div className="space-y-2">
                <textarea
                  disabled={!isAdmin}
                  rows={3}
                  value={vietqrTemplate}
                  onChange={(e) => setVietqrTemplate(e.target.value)}
                  placeholder="VD: [Mã HV] - [Họ tên] - Nộp học phí khóa {hang}"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-cyan-600/5 focus:border-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 italic font-medium">
                  Có thể dùng các biến như `[Mã HV]`, `[Họ tên]`, `{'{hang}'}` để cá nhân hóa nội dung.
                </p>
              </div>
            </SettingsInput>

            {!isAdmin && (
              <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 flex items-start gap-2.5">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Tài khoản nhân viên chỉ được dùng cấu hình ngân hàng do quản trị viên thiết lập.
                </p>
              </div>
            )}
          </div>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Cấu hình máy chủ SMTP gửi mail"
        icon={Mail}
        iconClassName="text-rose-500"
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onTestSmtp} disabled={!isAdmin || isTestingSmtp}>
              {isTestingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
              Kiểm tra kết nối
            </SecondaryButton>
            <PrimaryButton onClick={onSaveSmtp} disabled={!isAdmin || isSavingSmtp}>
              {isSavingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Lưu cấu hình
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-rose-50/40 rounded-2xl border border-rose-100/30 p-4 text-xs text-rose-800 leading-relaxed space-y-1">
            <p className="font-bold">Hướng dẫn lấy App Password:</p>
            <p>
              1. Bật xác thực 2 bước cho tài khoản Google.
              <br />
              2. Truy cập{' '}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-rose-600">
                myaccount.google.com/apppasswords
              </a>
              .
              <br />
              3. Tạo mật khẩu ứng dụng mới và dán vào ô mật khẩu bên dưới.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SettingsInput label="SMTP Host">
              <input value={smtpHost} disabled={!isAdmin} onChange={(e) => setSmtpHost(e.target.value)} className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
            <SettingsInput label="SMTP Port">
              <input value={smtpPort} disabled={!isAdmin} onChange={(e) => setSmtpPort(e.target.value.replace(/\D/g, ''))} className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-5">
              <input type="checkbox" checked={smtpSecure} disabled={!isAdmin} onChange={(e) => setSmtpSecure(e.target.checked)} />
              <span className="text-sm font-semibold text-slate-700">Dùng kết nối bảo mật (SSL/TLS)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsInput label="Tài khoản SMTP">
              <input value={smtpUser} disabled={!isAdmin} onChange={(e) => setSmtpUser(e.target.value)} placeholder="VD: account@gmail.com" className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
            <SettingsInput label="Mật khẩu ứng dụng">
              <input type="password" value={smtpPass} disabled={!isAdmin} onChange={(e) => setSmtpPass(e.target.value)} placeholder="Nhập App Password..." className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsInput label="Email gửi đi (From)">
              <input value={smtpFrom} disabled={!isAdmin} onChange={(e) => setSmtpFrom(e.target.value)} placeholder='VD: "Hệ thống" <account@gmail.com>' className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
            <SettingsInput label="Email sandbox">
              <input value={smtpSandboxEmail} disabled={!isAdmin} onChange={(e) => setSmtpSandboxEmail(e.target.value)} placeholder="Nhận email test nội bộ..." className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-rose-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
            </SettingsInput>
          </div>

          {!isAdmin && (
            <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 flex items-start gap-2.5">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Tài khoản nhân viên chỉ được dùng cấu hình SMTP do quản trị viên thiết lập.
              </p>
            </div>
          )}
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Cấu hình SMS"
        icon={Smartphone}
        actions={
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onTestSms} disabled={!isAdmin || isTestingSms}>
              {isTestingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
              Kiểm tra kết nối
            </SecondaryButton>
            <PrimaryButton onClick={onSaveSms} disabled={!isAdmin || isSavingSms}>
              {isSavingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Lưu cấu hình
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsInput label="Nhà cung cấp SMS">
            <select
              disabled={!isAdmin}
              value={smsProvider}
              onChange={(e) => setSmsProvider(e.target.value as 'twilio' | 'stringee' | 'tingting')}
              className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="tingting">TingTing (SpeedSMS)</option>
              <option value="twilio">Twilio</option>
              <option value="stringee">Stringee</option>
            </select>
          </SettingsInput>

          <div className="md:col-span-2 space-y-4">
            {smsProvider === 'tingting' ? (
              <>
                <SettingsInput label="TingTing API Key">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={tingtingApiKey}
                    onChange={(e) => setTingtingApiKey(e.target.value)}
                    placeholder="Nhập API Key..."
                    className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </SettingsInput>

                <SettingsInput label="Tên Sender">
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={tingtingSender}
                    onChange={(e) => setTingtingSender(e.target.value)}
                    placeholder="Brandname hoặc Device ID"
                    className="w-full h-11 bg-slate-50 px-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-800 outline-none focus:border-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </SettingsInput>

                <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-800 font-bold text-xs">
                    <Info size={14} className="shrink-0" />
                    <span>Hướng dẫn cấu hình TingTing</span>
                  </div>
                  <ul className="text-[11px] text-cyan-700/90 leading-relaxed list-decimal pl-4 space-y-1 font-medium">
                    <li>Tạo tài khoản tại `app.tingting.im` và nạp số dư.</li>
                    <li>Tạo API Key trong mục Developers.</li>
                    <li>Nếu có Brandname riêng, nhập thêm vào trường Sender.</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[150px] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs italic">
                Nhà cung cấp này chưa được hỗ trợ trực tiếp trên giao diện. Vui lòng dùng TingTing.
              </div>
            )}
          </div>
        </div>
      </SettingsPanel>
    </div>
  );
}
