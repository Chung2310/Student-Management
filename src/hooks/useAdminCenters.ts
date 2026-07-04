import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';

export interface AdminCenter {
  uid: string;
  displayName: string;
  email: string;
  businessType?: string;
}

/**
 * Hook dành riêng cho superadmin: lấy danh sách tất cả admin (trung tâm).
 * Với các role khác sẽ trả về mảng rỗng.
 */
export function useAdminCenters() {
  const { user } = useAuth();
  const [centers, setCenters] = useState<AdminCenter[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCenters = useCallback(async () => {
    if (!user || user.role !== 'superadmin') {
      setCenters([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/users');
      if (res.success && res.data?.users) {
        // Chỉ lấy các admin (không lấy superadmin và user thường)
        interface AdminUserResponse {
          uid?: string;
          _id?: string;
          displayName: string;
          email: string;
          role: string;
          businessType?: string;
        }
        const admins: AdminCenter[] = (res.data.users as AdminUserResponse[])
          .filter((u) => u.role === 'admin')
          .map((u) => ({
            uid: u.uid || u._id || '',
            displayName: u.displayName,
            email: u.email,
            businessType: u.businessType,
          }));
        setCenters(admins);
      }
    } catch (err) {
      console.error('Failed to fetch admin centers:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCenters();
  }, [fetchCenters]);

  return { centers, loading };
}
