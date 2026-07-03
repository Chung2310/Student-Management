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

interface UserListViewProps {
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

export function UserListView({
  filtered,
  users,
  user,
  centerMap,
  isSA,
  canManage,
  startEdit,
  handleToggleLock,
  handleDeleteUser,
}: UserListViewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 font-semibold text-slate-500">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{isSA ? 'Người dùng' : 'Giảng viên'}</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Vai trò</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Trung tâm</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Trạng thái</th>
              {isSA && <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Tạo bởi</th>}
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr
                  key={item.uid}
                  className={cn(
                    "transition-colors hover:bg-slate-50/60",
                    item.isActive === false && "opacity-60 bg-slate-50/30"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {item.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.displayName}</p>
                        <p className="truncate text-xs text-slate-500">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold w-fit',
                          rc.bg,
                          rc.border,
                          rc.color
                        )}
                      >
                        <RI className="h-3 w-3" />
                        {item.role === 'user' ? (isSA ? 'Nhân viên' : 'Giảng viên') : rc.label}
                      </span>
                      {isSA && item.role === 'admin' && (
                        <span className="text-[10px] text-slate-400 font-semibold leading-none">
                          Giới hạn: {item.maxUsersLimit ?? 10} NV
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {cl}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.isActive === false ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        <Lock className="h-2.5 w-2.5" /> Bị khoá
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Unlock className="h-2.5 w-2.5" /> Hoạt động
                      </span>
                    )}
                  </td>
                  {isSA && (
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {item.createdBy
                        ? users.find((u) => u.uid === item.createdBy)?.displayName ||
                          item.createdBy.slice(0, 8) + '…'
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEditItem && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            title="Chỉnh sửa"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleLock(item)}
                                title={item.isActive === false ? "Mở khóa" : "Khóa tài khoản"}
                                className={cn(
                                  "rounded-lg p-1.5 transition-all cursor-pointer",
                                  item.isActive === false
                                    ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                    : "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                )}
                              >
                                {item.isActive === false ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(item)}
                                title="Xóa tài khoản"
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-500">
        Hiển thị {filtered.length} / {users.length} {isSA ? 'người dùng' : 'giảng viên'}
      </div>
    </div>
  );
}
