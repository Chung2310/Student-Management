import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { ScheduleEvent } from '../types';

/** Lịch tổng hợp (lớp học định kỳ + kỳ thi + booking tài nguyên) trong một khoảng ngày */
export function useSchedule(from?: string, to?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/schedule", { params: { from, to } });
      if (res.success && res.events) {
        setEvents(res.events as ScheduleEvent[]);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  }, [user, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();

    const handleMutation = () => {
      fetchEvents();
    };

    window.addEventListener("exam-mutation", handleMutation);
    window.addEventListener("resource-mutation", handleMutation);
    window.addEventListener("batch-mutation", handleMutation);
    return () => {
      window.removeEventListener("exam-mutation", handleMutation);
      window.removeEventListener("resource-mutation", handleMutation);
      window.removeEventListener("batch-mutation", handleMutation);
    };
  }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}
export type UseScheduleReturn = ReturnType<typeof useSchedule>;
