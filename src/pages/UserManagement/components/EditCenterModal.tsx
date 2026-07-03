import React from 'react';
import { Building2, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { cn } from '../../../lib/utils';

const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10';
const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

interface EditCenterModalProps {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  isSA: boolean;
  fName: string;
  setFName: (val: string) => void;
  fEmail: string;
  setFEmail: (val: string) => void;
  fPass: string;
  setFPass: (val: string) => void;
  fBusinessType: 'driving' | 'language' | 'general';
  setFBusinessType: (val: 'driving' | 'language' | 'general') => void;
  fMaxUsersLimit: number;
  setFMaxUsersLimit: (val: number) => void;
  fBankId: string;
  setFBankId: (val: string) => void;
  fBankAccountNo: string;
  setFBankAccountNo: (val: string) => void;
  fActive: boolean;
  setFActive: (val: boolean) => void;
  showPass: boolean;
  setShowPass: (val: boolean) => void;
  onSubmit: () => void;
}

export function EditCenterModal({
  open,
  onClose,
  submitting,
  isSA,
  fName,
  setFName,
  fEmail,
  setFEmail,
  fPass,
  setFPass,
  fBusinessType,
  setFBusinessType,
  fMaxUsersLimit,
  setFMaxUsersLimit,
  fBankId,
  setFBankId,
  fBankAccountNo,
  setFBankAccountNo,
  fActive,
  setFActive,
  showPass,
  setShowPass,
  onSubmit,
}: EditCenterModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={() => !submitting && onClose()}
      icon={Building2}
      title="Cấu hình trung tâm"
      subtitle="Chỉnh sửa thông tin, đổi mật khẩu hoặc giới hạn tài khoản"
    >
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Tên trung tâm / Admin</label>
            <input
              type="text"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="VD: Trung tâm ABC"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Email đăng nhập</label>
            <input
              type="email"
              value={fEmail}
              onChange={(e) => setFEmail(e.target.value)}
              placeholder="admin@trungtam.vn"
              className={INPUT}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Mật khẩu mới (Bỏ trống nếu không đổi)</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={fPass}
                onChange={(e) => setFPass(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className={cn(INPUT, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Lĩnh vực hoạt động</label>
            <select
              value={fBusinessType}
              onChange={(e) => setFBusinessType(e.target.value as 'driving' | 'language' | 'general')}
              className={INPUT}
            >
              <option value="driving">Đào tạo lái xe</option>
              <option value="language">Đào tạo ngoại ngữ</option>
              <option value="general">Lĩnh vực tổng hợp (Chung)</option>
            </select>
          </div>
        </div>

        {isSA && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Giới hạn nhân viên</label>
              <input
                type="number"
                min="0"
                value={fMaxUsersLimit}
                onChange={(e) => setFMaxUsersLimit(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Mặc định: 10"
                className={INPUT}
              />
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Cấu hình đồng bộ & Thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Ngân hàng (VietQR)</label>
              <select value={fBankId} onChange={(e) => setFBankId(e.target.value)} className={INPUT}>
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
            </div>
            <div>
              <label className={LABEL}>Số tài khoản</label>
              <input
                type="text"
                value={fBankAccountNo}
                onChange={(e) => setFBankAccountNo(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập số tài khoản..."
                className={INPUT}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-150">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-700">Trạng thái hoạt động</span>
            <p className="text-[10px] text-slate-400">Cho phép hoặc tạm dừng hoạt động trung tâm này.</p>
          </div>
          <button
            type="button"
            onClick={() => setFActive(!fActive)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-205 ease-in-out focus:outline-none",
              fActive ? "bg-cyan-600" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-205 ease-in-out",
                fActive ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Lưu thay
          đổi
        </button>
      </div>
    </ModalShell>
  );
}
