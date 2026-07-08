import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Shield, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

// Subcomponents
import { UserStats } from './components/UserStats';
import { UserFilter } from './components/UserFilter';
import { UserListView } from './components/UserListView';
import { UserGridView } from './components/UserGridView';
import { CenterModal } from './components/CenterModal';
import { UserModal } from './components/UserModal';
import { EditCenterModal } from './components/EditCenterModal';
import { EditUserModal } from './components/EditUserModal';
import { Pagination } from '../../components/ui/Pagination';

type ManagedUser = {
  uid: string; email: string; displayName: string;
  role: 'superadmin' | 'admin' | 'user'; centerId: string; createdBy?: string; isActive?: boolean;
  bankAccountNo?: string; bankId?: string;
  businessType?: 'driving' | 'language' | 'general';
  maxUsersLimit?: number;
  permissions?: string[];
};
type RoleFilter = 'all' | 'superadmin' | 'admin' | 'user';
type ModalMode = null | 'center' | 'user' | 'edit-user' | 'edit-center';

const ALL_PERMISSIONS = ['Students', 'Exams', 'Fees', 'Bot', 'Courses', 'Batches', 'Partners', 'Resources'];

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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('erp_view_mode_users') as 'list' | 'grid') || 'list';
    }
    return 'list';
  });
  const pageSize = viewMode === 'grid' ? 6 : 8;

  const toggleViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('erp_view_mode_users', mode);
  };


  // Form fields
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPass, setFPass] = useState('');
  const [fCenter, setFCenter] = useState('');
  const [fActive, setFActive] = useState(true);
  const [fBankAccountNo, setFBankAccountNo] = useState('');
  const [fBankId, setFBankId] = useState('mbbank');
  const [fBusinessType, setFBusinessType] = useState<'driving' | 'language' | 'general'>('driving');
  const [fMaxUsersLimit, setFMaxUsersLimit] = useState<number>(10);
  const [fPermissions, setFPermissions] = useState<string[]>(ALL_PERMISSIONS);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const resetForm = () => {
    setFName('');
    setFEmail('');
    setFPass('');
    setFCenter('');
    setFActive(true);
    setFBankAccountNo('');
    setFBankId('mbbank');
    setFBusinessType('driving');
    setFMaxUsersLimit(10);
    setFPermissions(ALL_PERMISSIONS);
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
    setFBusinessType(item.businessType || 'driving');
    setFMaxUsersLimit(item.maxUsersLimit ?? 10);
    setFPermissions(item.permissions && item.permissions.length > 0 ? item.permissions : ALL_PERMISSIONS);
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
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const availablePermissions = useMemo(() => {
    if (isSA) {
      if (modal === 'center' || modal === 'edit-center') {
        return ALL_PERMISSIONS;
      }
      const targetCenterId = editingUser ? editingUser.centerId : fCenter;
      const centerAdmin = adminList.find(a => a.centerId === targetCenterId);
      return centerAdmin?.permissions && centerAdmin.permissions.length > 0 ? centerAdmin.permissions : ALL_PERMISSIONS;
    } else {
      return user?.permissions && user.permissions.length > 0 ? user.permissions : ALL_PERMISSIONS;
    }
  }, [isSA, modal, editingUser, fCenter, adminList, user]);

  useEffect(() => {
    if (modal === 'user') {
      const timer = setTimeout(() => {
        setFPermissions(prev => prev.filter(p => availablePermissions.includes(p)));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [fCenter, availablePermissions, modal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [search, roleFilter, viewMode]);

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
          businessType: fBusinessType,
          maxUsersLimit: isSA && isCenter ? fMaxUsersLimit : undefined,
          permissions: fPermissions,
        }),
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      window.dispatchEvent(new Event('user-mutation'));
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
        businessType: fBusinessType,
      };
      if (fPass.trim()) {
        payload.password = fPass;
      }
      payload.permissions = fPermissions;
      if (isSA) {
        payload.centerId = editingUser.role === 'admin' ? editingUser.uid : fCenter;
        if (editingUser.role === 'admin') {
          payload.maxUsersLimit = fMaxUsersLimit;
        }
      }
      await apiFetch(`/auth/users/${editingUser.uid}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const r = await apiFetch('/auth/users');
      setUsers(r.data?.users || []);
      window.dispatchEvent(new Event('user-mutation'));
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
      window.dispatchEvent(new Event('user-mutation'));
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
      window.dispatchEvent(new Event('user-mutation'));
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isSA ? 'Quản lý người dùng' : 'Quản lý giảng viên'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSA ? 'Quản lý tất cả trung tâm và người dùng trong hệ thống.' : 'Quản lý giảng viên trong trung tâm của bạn.'}
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
              <UserPlus className="h-4 w-4" /> {isSA ? 'Thêm người dùng' : 'Thêm giảng viên'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <UserStats stats={stats} isSA={isSA} />

        {/* Search & Filter */}
        <UserFilter
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          viewMode={viewMode}
          setViewMode={toggleViewMode}
          isSA={isSA}
        />

        {/* Content Area (Table or Grid) */}
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex min-h-[300px] items-center justify-center text-sm text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-600" /> Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex min-h-[300px] flex-col items-center justify-center text-center">
            <Users className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-500">{search || roleFilter !== 'all' ? 'Không tìm thấy' : (isSA ? 'Chưa có người dùng' : 'Chưa có giảng viên')}</p>
            <p className="mt-1 text-sm text-slate-400">{search || roleFilter !== 'all' ? 'Thử đổi bộ lọc.' : 'Nhấn nút phía trên để thêm.'}</p>
          </div>
        ) : viewMode === 'list' ? (
          <UserListView
            filtered={paginatedUsers}
            users={users}
            user={user}
            centerMap={centerMap}
            isSA={isSA}
            canManage={canManage}
            startEdit={startEdit}
            handleToggleLock={handleToggleLock}
            handleDeleteUser={handleDeleteUser}
          />
        ) : (
          <UserGridView
            filtered={paginatedUsers}
            users={users}
            user={user}
            centerMap={centerMap}
            isSA={isSA}
            canManage={canManage}
            startEdit={startEdit}
            handleToggleLock={handleToggleLock}
            handleDeleteUser={handleDeleteUser}
          />
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            itemName={isSA ? 'người dùng' : 'giảng viên'}
          />
        </div>
      </div>

      {/* Center Modal */}
      <CenterModal
        open={modal === 'center'}
        onClose={() => setModal(null)}
        submitting={submitting}
        isSA={isSA}
        fName={fName}
        setFName={setFName}
        fEmail={fEmail}
        setFEmail={setFEmail}
        fPass={fPass}
        setFPass={setFPass}
        fBusinessType={fBusinessType}
        setFBusinessType={setFBusinessType}
        fMaxUsersLimit={fMaxUsersLimit}
        setFMaxUsersLimit={setFMaxUsersLimit}
        fBankId={fBankId}
        setFBankId={setFBankId}
        fBankAccountNo={fBankAccountNo}
        setFBankAccountNo={setFBankAccountNo}
        fPermissions={fPermissions}
        setFPermissions={setFPermissions}
        showPass={showPass}
        setShowPass={setShowPass}
        onSubmit={handleSubmit}
      />

      {/* User Modal */}
      <UserModal
        open={modal === 'user'}
        onClose={() => setModal(null)}
        submitting={submitting}
        isSA={isSA}
        fName={fName}
        setFName={setFName}
        fEmail={fEmail}
        setFEmail={setFEmail}
        fPass={fPass}
        setFPass={setFPass}
        fCenter={fCenter}
        setFCenter={setFCenter}
        adminList={adminList}
        fPermissions={fPermissions}
        setFPermissions={setFPermissions}
        availablePermissions={availablePermissions}
        showPass={showPass}
        setShowPass={setShowPass}
        onSubmit={handleSubmit}
      />

      {/* Edit Center Modal */}
      <EditCenterModal
        open={modal === 'edit-center'}
        onClose={() => setModal(null)}
        submitting={submitting}
        isSA={isSA}
        fName={fName}
        setFName={setFName}
        fEmail={fEmail}
        setFEmail={setFEmail}
        fPass={fPass}
        setFPass={setFPass}
        fBusinessType={fBusinessType}
        setFBusinessType={setFBusinessType}
        fMaxUsersLimit={fMaxUsersLimit}
        setFMaxUsersLimit={setFMaxUsersLimit}
        fBankId={fBankId}
        setFBankId={setFBankId}
        fBankAccountNo={fBankAccountNo}
        setFBankAccountNo={setFBankAccountNo}
        fPermissions={fPermissions}
        setFPermissions={setFPermissions}
        fActive={fActive}
        setFActive={setFActive}
        showPass={showPass}
        setShowPass={setShowPass}
        onSubmit={handleEditSubmit}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={modal === 'edit-user'}
        onClose={() => setModal(null)}
        submitting={submitting}
        isSA={isSA}
        fName={fName}
        setFName={setFName}
        fEmail={fEmail}
        setFEmail={setFEmail}
        fPass={fPass}
        setFPass={setFPass}
        fCenter={fCenter}
        setFCenter={setFCenter}
        adminList={adminList}
        fPermissions={fPermissions}
        setFPermissions={setFPermissions}
        availablePermissions={availablePermissions}
        fActive={fActive}
        setFActive={setFActive}
        showPass={showPass}
        setShowPass={setShowPass}
        onSubmit={handleEditSubmit}
      />
    </>
  );
}
