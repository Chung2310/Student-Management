import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { ManagedUser } from '../types';

export function useManagedUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/auth/users");
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();

    const handleMutation = () => {
      fetchUsers();
    };

    window.addEventListener("user-mutation", handleMutation);
    return () => {
      window.removeEventListener("user-mutation", handleMutation);
    };
  }, [fetchUsers]);

  return { users, loading, refetch: fetchUsers };
}
