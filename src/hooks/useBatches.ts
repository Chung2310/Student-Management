import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { Batch } from '../types';

export function useBatches(ownerFilter?: string) {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!user) {
      setBatches([]);
      setLoading(false);
      return;
    }

    try {
      const url = ownerFilter ? `/batches?ownerFilter=${encodeURIComponent(ownerFilter)}` : "/batches";
      const res = await apiFetch(url);
      if (res.success && res.batches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.batches.map((b: any) => ({
          ...b,
          id: b._id,
        })) as Batch[];
        setBatches(mapped);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  }, [user, ownerFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBatches();

    const handleMutation = () => {
      fetchBatches();
    };

    window.addEventListener("batch-mutation", handleMutation);
    return () => {
      window.removeEventListener("batch-mutation", handleMutation);
    };
  }, [fetchBatches]);

  return { batches, loading, refetch: fetchBatches };
}
export type UseBatchesReturn = ReturnType<typeof useBatches>;
