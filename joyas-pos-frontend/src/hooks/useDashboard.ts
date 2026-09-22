import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';

export function useDashboard() {
  const [stats, setStats] = useState({
    revenueToday: 0,
    salesCount: 0,
    salesLast7Days: [] as any[],
    productNamesList: [] as string[]
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();

      if (data && data.salesLast7Days && data.productNamesList) {
        // Normalizamos los días para que CADA día tenga todos los productos de la lista en 0 si no se vendieron
        const normalizedSales = data.salesLast7Days.map((dayObj: any) => {
          const completeDay = { ...dayObj };
          data.productNamesList.forEach((prodName: string) => {
            if (!(prodName in completeDay)) {
              completeDay[prodName] = 0;
            }
          });
          return completeDay;
        });

        setStats({
          revenueToday: data.revenueToday || 0,
          salesCount: data.salesCount || 0,
          salesLast7Days: normalizedSales,
          productNamesList: data.productNamesList || []
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...stats,
    loading,
    error,
    refetch: fetchStats
  };
}