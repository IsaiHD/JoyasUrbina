// src/services/dashboard.service.ts
import { supabase } from '../supabaseClient';
import type { DashboardStats, StackedChartData } from '../types/dashboard.types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const today = new Date();
    const startOfToday = today.toISOString().split('T')[0];
    
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    const startOfLastWeek = lastWeek.toISOString();

    const [prodResponse, salesResponse, salesWeekResponse] = await Promise.all([
      supabase.from('producto').select('stock, tipo_joyas(nombre_tipo)'),
      supabase.from('venta').select('total_venta').gte('created_at', `${startOfToday}T00:00:00`),
      supabase.from('venta')
        .select('total_venta, created_at, producto(nombre)')
        .gte('created_at', startOfLastWeek)
    ]);

    if (prodResponse.error) throw new Error(prodResponse.error.message);
    if (salesResponse.error) throw new Error(salesResponse.error.message);
    if (salesWeekResponse.error) throw new Error(salesWeekResponse.error.message);

    const productos = prodResponse.data || [];
    const ventasHoy = salesResponse.data || [];
    const ventasSemana = salesWeekResponse.data || [];

    // --- LÓGICA GRÁFICO APILADO ---
    
    // 1. Inicializar mapa de los últimos 7 días y un Set para nombres únicos
    const salesMap: Record<string, StackedChartData> = {};
    const productNamesSet = new Set<string>(); // Usamos Set para no tener duplicados

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('es-CL', { weekday: 'short' }); 
      // Inicializamos solo con el nombre del día
      salesMap[dayName] = { name: dayName }; 
    }

    // 2. Rellenar y aplanar datos
    ventasSemana.forEach((v: any) => {
      const date = new Date(v.created_at);
      const dayName = date.toLocaleDateString('es-CL', { weekday: 'short' });
      const productName = v.producto?.nombre || 'Otros';
      const amount = Number(v.total_venta);

      if (salesMap[dayName]) {
        // Agregamos el nombre al Set global
        productNamesSet.add(productName);

        // Si ya existe valor para este producto ese día, sumamos; si no, inicializamos.
        const currentAmount = (salesMap[dayName][productName] as number) || 0;
        salesMap[dayName][productName] = currentAmount + amount;
      }
    });

    // Convertir el mapa a array para Recharts
    const salesLast7Days = Object.values(salesMap);
    // Convertir el Set a array
    const productNamesList = Array.from(productNamesSet);

    // --- LÓGICA TORTA (Sin cambios) ---
    const categoryMap: Record<string, number> = {};
    productos.forEach((p: any) => {
      const tipo = p.tipo_joyas?.nombre_tipo || 'Sin Tipo';
      categoryMap[tipo] = (categoryMap[tipo] || 0) + 1;
    });
    const stockByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    return {
      totalProducts: productos.length,
      lowStock: productos.filter((p: any) => p.stock <= 3).length,
      salesCount: ventasHoy.length,
      revenueToday: ventasHoy.reduce((acc, v) => acc + Number(v.total_venta), 0),
      stockByCategory,
      salesLast7Days,
      productNamesList // Retornamos la lista para generar las barras
    };
  }
};