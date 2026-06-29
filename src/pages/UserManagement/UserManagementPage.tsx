import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2, ChevronDown, Eye, EyeOff, Filter, Loader2,
  Plus, Search, Shield, ShieldCheck, User as UserIcon,
  UserPlus, Users, X, Edit2, Trash2, Lock, Unlock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';

type ManagedUser = {
  uid: string; email: string; displayName: string;
  role: 'superadmin' | 'admin' | 'user'; centerId: string; createdBy?: string; isActive?: boolean;
  bankAccountNo?: string; bankId?: string;
};
type RoleFilter = 'all' | 'superadmin' | 'admin' | 'user';
type ModalMode = null | 'center' | 'user' | 'edit-user' | 'edit-center';

const ROLE_CFG: Record<ManagedUser['role'], { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  superadmin: { label: 'Superadmin', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: ShieldCheck },
  admin: { label: 'Admin', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Shield },
  user: { label: 'Nhân viên', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: UserIcon },
};

const INPUT = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10';
const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

/* ═══ Generic Modal Shell ═══ */
function ModalShell({ open, onClose, icon: Icon, title, subtitle, children }: {
  open: boolean; onClose: () => void; icon: React.ComponentType<{ className?: string }>;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ═══ Main Page ═══ */
export function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === 'superadmin' || user?.role === 'admin';
  const isSA = user?.role === 'superadmin';

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalMode>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [showPass, setShowPass] = useState(false);

  // Form fields
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPass, setFPass] = useState('');
  const [fCenter, setFCenter] = useState('');
  const [fActive, setFActive] = useState(true);
  const [fBankAccountNo, setFBankAccountNo] = useState('');
  const [fBankId, setFBankId] = useState('mbbank');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const resetForm = () => {
    setFName('');
    setFEmail('');
    setFPass('');
    setFCenter('');
    setFActive(true);
    setFBankAccountNo('');
    setFBankId('mbbank');
    setEditingUser(null);
    setShowPass(false);
  };
  const openModal = (m: ModalMode) => { resetForm(); setModal(m); };
  const startEdit = (item: ManagedUser) => {
    resetForm();
    setEditingUser(item);
    setFName(item.displayName);
    setFEmail(item.email);
    setFCenter(item.centerId);
    setFActive(item.isActive !== false);
    setFBankAccountNo(item.bankAccountNo || '');
    setFBankId(item.bankId || 'mbbank');
    setModal(item.role === 'admin' ? 'edit-center' : 'edit-user');
  };

  // Fetch users
  useEffect(() => {
    if (!canManage) return;
    (async () => {
      try { setLoading(true); const r = await apiFetch('/auth/users'); setUsers(r.data?.users || []); }
      catch { toast.error('Không tải được danh sách người dùng.'); }
      finally { setLoading(false); }
    })();
  }, [canManage, toast]);

  // Derived
  const adminList = useMemo(() => users.filter(u => u.role === 'admin'), [users]);
  const stats = useMemo(() => {
    const s = { total: users.length, superadmin: 0, admin: 0, user: 0 };
    users.forEach(u => { s[u.role]++; }); return s;
  }, [users]);

  const centerMap = useMemo(() => {
    const m = new Map<string, { admin: ManagedUser | null; users: ManagedUser[] }>();
    users.forEach(u => {
      if (u.role === 'superadmin') return;
      if (!m.has(u.centerId)) m.set(u.centerId, { admin: null, users: [] });
      const e = m.get(u.centerId)!;
      if (u.role === 'admin') e.admin = u; else e.users.push(u);
    });
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    let l = users;
    if (roleFilter !== 'all') l = l.filter(u => u.role === roleFilter);
    if (search.trim()) { const q = search.toLowerCase(); l = l.filter(u => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
    return l;
  }, [users, roleFilter, search]);

  // Submit handler
  const handleSubmit = async () => {
    if (!canManage || !modal) return;
    const isCenter = modal === 'center';

    // Front-end validations
    if (!fName.trim()) {
      toast.error(isCenter ? 'Vui lòng nhập tên trung tâm.' : 'Vui lòng nhập họ tên.');
      return;
    }
    if (!fEmail.trim()) {
      toast.error('Vui lòng nhập email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.trim())) {
      toast.error('Định dạng email không hợp lệ.');
      return;
    }
    if (!fPass) {
      toast.error('Vui lòng nhập mật khẩu.');
      return;
    }
    if (fPass.length < 6) {
      toast.error('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    if (isSA && !isCenter && !fCenter) {
      toast.error('Vui lòng chọn trung tâm để gán nhân viên.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          displayName: fName, email: fEmail, password: fPass,
          role: isCenter ? 'admin' : 'user',
          centerId: isCenter ? '' : (isSA ? fCenter : user?.centerId),
          bankAccountNo: fBankAccountNo,
          bankId: fBankId,
        }),
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      setModal(null); resetForm();
      toast.success(isCenter ? 'Đã tạo trung tâm mới!' : 'Đã thêm người dùng!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Lỗi không xác định'); }
    finally { setSubmitting(false); }
  };

  const handleEditSubmit = async () => {
    if (!canManage || !editingUser) return;

    // Front-end validations
    if (!fName.trim()) {
      toast.error(editingUser.role === 'admin' ? 'Vui lòng nhập tên trung tâm.' : 'Vui lòng nhập họ tên.');
      return;
    }
    if (!fEmail.trim()) {
      toast.error('Vui lòng nhập email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.trim())) {
      toast.error('Định dạng email không hợp lệ.');
      return;
    }
    if (fPass.trim() && fPass.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }
    if (isSA && editingUser.role === 'user' && !fCenter) {
      toast.error('Vui lòng chọn trung tâm để gán nhân viên.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: fName,
        email: fEmail,
        isActive: fActive,
        bankAccountNo: fBankAccountNo,
        bankId: fBankId,
      };
      if (fPass.trim()) {
        payload.password = fPass;
      }
      if (isSA) {
        payload.centerId = editingUser.role === 'admin' ? editingUser.uid : fCenter;
      }
      await apiFetch(`/auth/users/${editingUser.uid}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      setModal(null);
      resetForm();
      toast.success('Đã cập nhật thông tin người dùng!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: ManagedUser) => {
    if (!canManage) return;
    if (targetUser.uid === user?.uid) {
      toast.error('Bạn không thể tự xóa tài khoản của chính mình.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${targetUser.displayName}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await apiFetch(`/auth/users/${targetUser.uid}`, {
        method: 'DELETE',
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      toast.success('Đã xóa người dùng thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  const handleToggleLock = async (targetUser: ManagedUser) => {
    if (!canManage) return;
    if (targetUser.uid === user?.uid) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }
    const newStatus = targetUser.isActive === false;
    try {
      await apiFetch(`/auth/users/${targetUser.uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      toast.success(newStatus ? 'Đã kích hoạt tài khoản!' : 'Đã khóa tài khoản thành công!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    }
  };

  if (!canManage) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-slate-400">
        <Shield className="mb-3 h-12 w-12 text-slate-300" />
        <p className="text-lg font-bold">Bạn không có quyền truy cập</p>
        <p className="text-sm">Chỉ Superadmin và Admin mới được xem trang này.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSA ? 'Quản lý tất cả trung tâm và người dùng trong hệ thống.' : 'Quản lý nhân viên trong trung tâm của bạn.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isSA && (
              <button type="button" onClick={() => openModal('center')}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 transition-all hover:bg-cyan-100">
                <Building2 className="h-4 w-4" /> Thêm trung tâm
              </button>
            )}
            <button type="button" onClick={() => openModal('user')}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-cyan-700">
              <UserPlus className="h-4 w-4" /> Thêm người dùng
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { label: 'Tổng cộng', value: stats.total, icon: Users, accent: 'text-slate-700' },
            ...(isSA ? [{ label: 'Superadmin', value: stats.superadmin, icon: ShieldCheck, accent: 'text-amber-600' }] : []),
            { label: 'Trung tâm', value: stats.admin, icon: Building2, accent: 'text-cyan-600' },
            { label: 'Nhân viên', value: stats.user, icon: UserIcon, accent: 'text-violet-600' },
          ] as { label: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }[]).map(s => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50', s.accent)}><s.icon className="h-4 w-4" /></div>
              <div><p className="text-xs font-medium text-slate-500">{s.label}</p><p className="text-lg font-bold text-slate-900">{s.value}</p></div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc email..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleFilter)}
              className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10">
              <option value="all">Tất cả</option>
              {isSA && <option value="superadmin">Superadmin</option>}
              <option value="admin">Admin</option>
              <option value="user">Nhân viên</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-600" /> Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <Users className="mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-500">{search || roleFilter !== 'all' ? 'Không tìm thấy' : 'Chưa có người dùng'}</p>
              <p className="mt-1 text-sm text-slate-400">{search || roleFilter !== 'all' ? 'Thử đổi bộ lọc.' : 'Nhấn nút phía trên để thêm.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Người dùng</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Trung tâm</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                    {isSA && <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tạo bởi</th>}
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const rc = ROLE_CFG[item.role]; const RI = rc.icon;
                    const ca = centerMap.get(item.centerId)?.admin;
                    const cl = item.role === 'superadmin' ? 'Hệ thống' : item.role === 'admin' ? item.displayName : ca ? ca.displayName : (item.centerId ? item.centerId.slice(0, 8) + '…' : '—');
                    const isSelf = item.uid === user?.uid;
                    const canEditItem = canManage && (isSA || (user?.role === 'admin' && item.role === 'user' && item.centerId === user?.centerId));
                    return (
                      <tr key={item.uid} className={cn("transition-colors hover:bg-slate-50/60", item.isActive === false && "opacity-60 bg-slate-50/30")}>
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
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold', rc.bg, rc.border, rc.color)}>
                            <RI className="h-3 w-3" />{rc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />{cl}
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
                            {item.createdBy ? users.find(u => u.uid === item.createdBy)?.displayName || item.createdBy.slice(0, 8) + '…' : '—'}
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
          )}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-500">
              Hiển thị {filtered.length} / {users.length} người dùng
            </div>
          )}
        </div>

      </div>

      {/* ═══ Modal: Thêm trung tâm ═══ */}
      <ModalShell open={modal === 'center'} onClose={() => !submitting && setModal(null)}
        icon={Building2} title="Thêm trung tâm mới" subtitle="Tạo tài khoản Admin quản lý trung tâm riêng">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>Tên trung tâm / Admin</label>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="VD: Trung tâm ABC" className={INPUT} /></div>
            <div><label className={LABEL}>Email đăng nhập</label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="admin@trungtam.vn" className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>Mật khẩu</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" className={cn(INPUT, 'pr-10')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cấu hình đồng bộ & Thanh toán</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Ngân hàng (VietQR)</label>
                <select value={fBankId} onChange={e => setFBankId(e.target.value)} className={INPUT}>
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
                <input type="text" value={fBankAccountNo} onChange={e => setFBankAccountNo(e.target.value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản..." className={INPUT} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-cyan-50 px-4 py-3 text-xs text-cyan-700">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Admin sẽ tự động quản lý trung tâm riêng và có thể thêm nhân viên vào trung tâm của mình.</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button type="button" onClick={() => setModal(null)} disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Huỷ</button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tạo trung tâm
          </button>
        </div>
      </ModalShell>

      {/* ═══ Modal: Thêm người dùng ═══ */}
      <ModalShell open={modal === 'user'} onClose={() => !submitting && setModal(null)}
        icon={UserPlus} title="Thêm người dùng" subtitle={isSA ? 'Thêm nhân viên vào một trung tâm' : 'Thêm nhân viên vào trung tâm của bạn'}>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>Họ tên</label>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Nguyễn Văn A" className={INPUT} /></div>
            <div><label className={LABEL}>Email</label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@domain.com" className={INPUT} /></div>
          </div>
          <div className={cn(isSA ? 'grid grid-cols-2 gap-4' : '')}>
            <div><label className={LABEL}>Mật khẩu</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" className={cn(INPUT, 'pr-10')} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {isSA && (
              <div><label className={LABEL}>Gán vào trung tâm</label>
                <select value={fCenter} onChange={e => setFCenter(e.target.value)} className={INPUT}>
                  <option value="">— Chọn trung tâm —</option>
                  {adminList.map(a => <option key={a.uid} value={a.centerId}>{a.displayName}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
            <span>{isSA ? 'Nhân viên cần được gán vào một trung tâm cụ thể.' : 'Nhân viên sẽ tự động thuộc trung tâm của bạn.'}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button type="button" onClick={() => setModal(null)} disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Huỷ</button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Thêm người dùng
          </button>
        </div>
      </ModalShell>

      {/* ═══ Modal: Sửa trung tâm ═══ */}
      <ModalShell open={modal === 'edit-center'} onClose={() => !submitting && setModal(null)}
        icon={Building2} title="Sửa thông tin trung tâm" subtitle="Chỉnh sửa thông tin trung tâm hoặc tài khoản Admin quản lý">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>Tên trung tâm / Admin</label>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="VD: Trung tâm ABC" className={INPUT} /></div>
            <div><label className={LABEL}>Email đăng nhập</label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="admin@trungtam.vn" className={INPUT} /></div>
          </div>
          <div><label className={LABEL}>Mật khẩu mới (Bỏ trống nếu không đổi)</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="Nhập mật khẩu mới..." className={cn(INPUT, 'pr-10')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cấu hình đồng bộ & Thanh toán</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Ngân hàng (VietQR)</label>
                <select value={fBankId} onChange={e => setFBankId(e.target.value)} className={INPUT}>
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
                <input type="text" value={fBankAccountNo} onChange={e => setFBankAccountNo(e.target.value.replace(/\D/g, ''))} placeholder="Nhập số tài khoản..." className={INPUT} />
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
          <button type="button" onClick={() => setModal(null)} disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Huỷ</button>
          <button type="button" onClick={handleEditSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Lưu thay đổi
          </button>
        </div>
      </ModalShell>

      {/* ═══ Modal: Sửa người dùng ═══ */}
      <ModalShell open={modal === 'edit-user'} onClose={() => !submitting && setModal(null)}
        icon={UserPlus} title="Sửa thông tin người dùng" subtitle={isSA ? 'Chỉnh sửa thông tin nhân viên hoặc chuyển trung tâm' : 'Chỉnh sửa thông tin nhân viên'}>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>Họ tên</label>
              <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Nguyễn Văn A" className={INPUT} /></div>
            <div><label className={LABEL}>Email</label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@domain.com" className={INPUT} /></div>
          </div>
          <div className={cn(isSA ? 'grid grid-cols-2 gap-4' : '')}>
            <div><label className={LABEL}>Mật khẩu mới (Bỏ trống nếu không đổi)</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={fPass} onChange={e => setFPass(e.target.value)} placeholder="Nhập mật khẩu mới..." className={cn(INPUT, 'pr-10')} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {isSA && (
              <div><label className={LABEL}>Gán vào trung tâm</label>
                <select value={fCenter} onChange={e => setFCenter(e.target.value)} className={INPUT}>
                  <option value="">— Chọn trung tâm —</option>
                  {adminList.map(a => <option key={a.uid} value={a.centerId}>{a.displayName}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-150">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-700">Trạng thái hoạt động</span>
              <p className="text-[10px] text-slate-400">Cho phép hoặc khóa tài khoản nhân viên này.</p>
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
          <button type="button" onClick={() => setModal(null)} disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Huỷ</button>
          <button type="button" onClick={handleEditSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Lưu thay đổi
          </button>
        </div>
      </ModalShell>
    </>
  );
}
