import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';

interface LicenseRankApiItem {
  _id: string;
  name: string;
}

interface LicenseRanksResponse {
  success: boolean;
  data: LicenseRankApiItem[];
}

export interface LicenseRankItem {
  id: string;
  name: string;
}

export function useLicenseRanks(ownerFilter?: string) {
  const { user } = useAuth();
  const [ranks, setRanks] = useState<LicenseRankItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanks = useCallback(async () => {
    try {
      let url = "/license-ranks";
      if (ownerFilter) {
        url = `/auth/teacher/${encodeURIComponent(ownerFilter)}/ranks`;
      } else if (!user) {
        setRanks([]);
        setLoading(false);
        return;
      }
      
      const res = await apiFetch<LicenseRanksResponse>(url);

      if (res.success) {
        const mapped: LicenseRankItem[] = res.data.map((rank) => ({
          id: rank._id,
          name: rank.name,
        }));
        setRanks(mapped);
      } else {
        setRanks([]);
      }
    } catch (error) {
      console.error("Error fetching license ranks:", error);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  }, [user, ownerFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRanks();

    const handleMutation = () => {
      fetchRanks();
    };

    window.addEventListener("license-rank-mutation", handleMutation);
    return () => {
      window.removeEventListener("license-rank-mutation", handleMutation);
    };
  }, [fetchRanks]);

  return { ranks, loading, refetch: fetchRanks };
}
