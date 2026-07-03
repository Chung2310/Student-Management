import React from 'react';
import { Building2, Edit2, Trash2, Lock, Unlock, ShieldCheck, Shield, User as UserIcon } from 'lucide-react';
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

interface UserGridViewProps {
  filtered: ManagedUser[];
  users: ManagedUser[];
  user: { uid: string; role: string; centerId: string } | null;
  centerMap: Map<string, { admin: ManagedUser | null; users: ManagedUser[] }>;
  isSA: boolean;
  canManage: boolean;
  startEdit: (item: ManagedUser) => void;
  handleToggleLock: (item: ManagedUser) => void;
  handleDeleteUser: (item: ManagedUser) => void;
}

const ROLE_CFG: Record<ManagedUser['role'], {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  superadmin: { label: 'Superadmin', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: ShieldCheck },
  admin: { label: 'Admin', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Shield },
  user: { label: 'Nhân viên', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: UserIcon },
};

export function UserGridView({
  filtered,
  users,
  user,
  centerMap,
  isSA,
  canManage,
  startEdit,
  handleToggleLock,
  handleDeleteUser,
}: UserGridViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const rc = ROLE_CFG[item.role];
          const RI = rc.icon;
          const ca = centerMap.get(item.centerId)?.admin;
          const cl =
            item.role === 'superadmin'
              ? 'Hệ thống'
              : item.role === 'admin'
              ? item.displayName
              : ca
              ? ca.displayName
              : item.centerId
              ? item.centerId.slice(0, 8) + '…'
              : '—';
          const isSelf = item.uid === user?.uid;
          const canEditItem =
            canManage &&
            (isSA || (user?.role === 'admin' && item.role === 'user' && item.centerId === user?.centerId));

          return (
            <div
              key={item.uid}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300",
                item.isActive === false && "opacity-75 bg-slate-50/50"
              )}
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-slate-100 text-sm font-bold text-slate-600 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {item.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900 leading-snug">{item.displayName}</h3>
                    <p className="truncate text-xs text-slate-500 font-medium">{item.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                          rc.bg,
                          rc.border,
                          rc.color
                        )}
                      >
                        <RI className="h-3 w-3" />
                        {item.role === 'user' ? (isSA ? 'Nhân viên' : 'Giảng viên') : rc.label}
                      </span>
                      {isSA && item.role === 'admin' && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                          Giới hạn: {item.maxUsersLimit ?? 10}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-slate-100" />

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Trung tâm</span>
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      {cl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Trạng thái</span>
                    {item.isActive === false ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 uppercase tracking-wide">
                        <Lock className="h-2.5 w-2.5" /> Bị khoá
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                        <Unlock className="h-2.5 w-2.5" /> Hoạt động
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canEditItem && (
                <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    title="Chỉnh sửa"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {!isSelf && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleLock(item)}
                        title={item.isActive === false ? "Mở khóa" : "Khóa tài khoản"}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer",
                          item.isActive === false
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-amber-200 text-amber-600 hover:bg-amber-50"
                        )}
                      >
                        {item.isActive === false ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(item)}
                        title="Xóa tài khoản"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-500">
        Hiển thị {filtered.length} / {users.length} {isSA ? 'người dùng' : 'giảng viên'}
      </div>
    </div>
  );
}
