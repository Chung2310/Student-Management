import React from 'react';
import { Building2, Eye, EyeOff, Plus, Loader2 } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { cn } from '../../../lib/utils';

const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10';
const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

interface CenterModalProps {
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
  showPass: boolean;
  setShowPass: (val: boolean) => void;
  onSubmit: () => void;
}

export function CenterModal({
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
  showPass,
  setShowPass,
  onSubmit,
}: CenterModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={() => !submitting && onClose()}
      icon={Building2}
      title="Thêm trung tâm mới"
      subtitle="Tạo tài khoản Admin quản lý trung tâm riêng"
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
            <label className={LABEL}>Mật khẩu</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={fPass}
                onChange={(e) => setFPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
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

        <div className="flex items-start gap-2.5 rounded-xl bg-cyan-50 px-4 py-3 text-xs text-cyan-700">
          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Admin sẽ tự động quản lý trung tâm riêng và có thể thêm nhân viên vào trung tâm của mình.</span>
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tạo trung tâm
        </button>
      </div>
    </ModalShell>
  );
}
