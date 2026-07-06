import React from 'react';
import { UserPlus, Shield, Loader2, Eye, EyeOff, Plus } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { cn } from '../../../lib/utils';

type ManagedUser = {
  uid: string;
  email: string;
  displayName: string;
  role: 'superadmin' | 'admin' | 'user';
  centerId: string;
  createdBy?: string;
  isActive?: boolean;
  bankAccountNo?: string;
  bankId?: string;
  businessType?: 'driving' | 'language' | 'general';
  maxUsersLimit?: number;
  permissions?: string[];
};

const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10';
const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

interface UserModalProps {
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
  fCenter: string;
  setFCenter: (val: string) => void;
  adminList: ManagedUser[];
  fPermissions: string[];
  setFPermissions: (val: string[]) => void;
  ALL_PERMISSIONS: string[];
  showPass: boolean;
  setShowPass: (val: boolean) => void;
  onSubmit: () => void;
}

export function UserModal({
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
  fCenter,
  setFCenter,
  adminList,
  fPermissions,
  setFPermissions,
  showPass,
  setShowPass,
  onSubmit,
}: UserModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={() => !submitting && onClose()}
      icon={UserPlus}
      title={isSA ? "Thêm người dùng" : "Thêm giảng viên"}
      subtitle={isSA ? 'Thêm nhân viên vào một trung tâm' : 'Thêm giảng viên vào trung tâm của bạn'}
    >
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Họ tên</label>
            <input
              type="text"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input
              type="email"
              value={fEmail}
              onChange={(e) => setFEmail(e.target.value)}
              placeholder="email@domain.com"
              className={INPUT}
            />
          </div>
        </div>
        <div className={cn(isSA ? 'grid grid-cols-2 gap-4' : '')}>
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
          {isSA && (
            <div>
              <label className={LABEL}>Gán vào trung tâm</label>
              <select value={fCenter} onChange={(e) => setFCenter(e.target.value)} className={INPUT}>
                <option value="">— Chọn trung tâm —</option>
                {adminList.map((a) => (
                  <option key={a.uid} value={a.centerId}>
                    {a.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Access Permissions Grid */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Quyền truy cập chức năng
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[
              { key: 'Students', label: 'Học viên' },
              { key: 'Exams', label: 'Lịch thi' },
              { key: 'Fees', label: 'Học phí' },
              { key: 'Bot', label: 'BOT Thông báo' },
              { key: 'Courses', label: 'Khóa học' },
              { key: 'Batches', label: 'Lớp & Khai giảng' },
              { key: 'Partners', label: 'Đối tác & CTV' },
              { key: 'Resources', label: 'Thiết bị' },
            ].map((p) => {
              const checked = fPermissions.includes(p.key);
              return (
                <label
                  key={p.key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all select-none",
                    checked
                      ? "border-cyan-200 bg-cyan-50/50 text-cyan-700 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFPermissions([...fPermissions, p.key]);
                      } else {
                        setFPermissions(fPermissions.filter((item) => item !== p.key));
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-350 text-cyan-600 focus:ring-cyan-500"
                  />
                  {p.label}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
          <span>
            {isSA
              ? 'Nhân viên cần được gán vào một trung tâm cụ thể.'
              : 'Giảng viên sẽ tự động thuộc trung tâm của bạn.'}
          </span>
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{' '}
          {isSA ? 'Thêm người dùng' : 'Thêm giảng viên'}
        </button>
      </div>
    </ModalShell>
  );
}
