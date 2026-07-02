import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { ResourceItem } from '../types';

export function useResources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResources = useCallback(async () => {
    if (!user) {
      setResources([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/resources");
      if (res.success && res.resources) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.resources.map((r: any) => ({
          ...r,
          id: r._id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bookings: (r.bookings || []).map((b: any) => ({ ...b, id: b._id })),
        })) as ResourceItem[];
        setResources(mapped);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResources();

    const handleMutation = () => {
      fetchResources();
    };

    window.addEventListener("resource-mutation", handleMutation);
    return () => {
      window.removeEventListener("resource-mutation", handleMutation);
    };
  }, [fetchResources]);

  return { resources, loading, refetch: fetchResources };
}
export type UseResourcesReturn = ReturnType<typeof useResources>;
