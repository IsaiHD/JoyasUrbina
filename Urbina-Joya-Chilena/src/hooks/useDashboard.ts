import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard.service';

export interface DashboardStats {
  revenueToday: number;
  salesCount: number;
  salesLast7Days: any[];
  productNamesList: string[];
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenueToday: 0,
    salesCount: 0,
    salesLast7Days: [],
    productNamesList: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}