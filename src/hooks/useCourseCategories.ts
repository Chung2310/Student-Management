import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';

export interface CourseCategoryItem {
  id: string;
  name: string;
}

export function useCourseCategories(ownerFilter?: string) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CourseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const url = ownerFilter ? `/courses/categories?ownerFilter=${encodeURIComponent(ownerFilter)}` : "/courses/categories";
      const res = await apiFetch(url);
      if (res.success && res.data) {
        const mapped = res.data.map((cat: { _id: string; name: string }) => ({
          id: cat._id,
          name: cat.name,
        }));
        setCategories(mapped);
      }
    } catch (error) {
      console.error("Error fetching course categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user, ownerFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();

    const handleMutation = () => {
      fetchCategories();
    };

    window.addEventListener("course-category-mutation", handleMutation);
    return () => {
      window.removeEventListener("course-category-mutation", handleMutation);
    };
  }, [fetchCategories]);

  return { categories, loading, refetch: fetchCategories };
}
