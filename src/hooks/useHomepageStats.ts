import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepageStats {
  total_stories: number;
  total_users: number;
  total_questions: number;
  updated_at: string;
}

export const useHomepageStats = () => {
  const [stats, setStats] = useState<HomepageStats>({
    total_stories: 0,
    total_users: 0,
    total_questions: 0,
    updated_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_homepage_stats');

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const statsData = data as any;
        setStats({
          total_stories: statsData.total_stories || 0,
          total_users: statsData.total_users || 0,
          total_questions: statsData.total_questions || 0,
          updated_at: statsData.updated_at || new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Error fetching homepage stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('update_stats_cache');

      if (error) {
        throw error;
      }

      if (data) {
        const statsData = data as any;
        setStats({
          total_stories: statsData.total_stories || 0,
          total_users: statsData.total_users || 0,
          total_questions: statsData.total_questions || 0,
          updated_at: statsData.updated_at || new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Error refreshing stats:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats,
    refetch: fetchStats
  };
};