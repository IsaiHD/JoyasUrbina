// src/hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardStats } from '../types/dashboard.types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStock: 0,
    salesCount: 0,
    revenueToday: 0,
    salesLast7Days: [],
    productNamesList: [], // <--- Nuevo estado inicial
    stockByCategory: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}