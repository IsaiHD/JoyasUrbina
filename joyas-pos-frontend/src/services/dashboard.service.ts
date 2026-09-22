import { supabase } from '../supabaseClient'; // Ajusta la ruta a tu cliente

export const dashboardService = {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día de hoy

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Obtener todas las ventas de los últimos 7 días
    const { data: recentSales, error: salesError } = await supabase
      .from('venta')
      .select('fecha_venta, precio_venta, nombre_producto')
      .gte('fecha_venta', sevenDaysAgo.toISOString())
      .order('fecha_venta', { ascending: true });

    if (salesError) throw new Error(salesError.message);

    let revenueToday = 0;
    let salesCount = 0;
    
    // Objeto para agrupar ventas por día
    const dailySalesMap: Record<string, any> = {};
    const productNamesSet = new Set<string>(); // Para saber qué productos mostrar en la leyenda

    // Inicializar los últimos 7 días en el mapa (para que no salgan días en blanco)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('es-CL', { weekday: 'short' });
      dailySalesMap[dayName] = { name: dayName };
    }

    if (recentSales) {
      recentSales.forEach((sale: { fecha_venta: string | number | Date; precio_venta: number; nombre_producto: string; }) => {
        const saleDate = new Date(sale.fecha_venta);
        const dayName = saleDate.toLocaleDateString('es-CL', { weekday: 'short' });
        
        // Métricas de "Hoy"
        if (saleDate >= today) {
          revenueToday += sale.precio_venta;
          salesCount++;
        }

        // Datos para el gráfico apilado
        const productName = sale.nombre_producto || 'Otros';
        productNamesSet.add(productName);

        if (dailySalesMap[dayName]) {
          // Si el producto ya tiene ventas ese día, le sumamos el precio, si no, lo inicializamos
          dailySalesMap[dayName][productName] = (dailySalesMap[dayName][productName] || 0) + sale.precio_venta;
        }
      });
    }

    // Convertir el mapa a un array para Recharts
    const salesLast7Days = Object.values(dailySalesMap);
    const productNamesList = Array.from(productNamesSet);

    return {
      revenueToday,
      salesCount,
      salesLast7Days,
      productNamesList
    };
  }
};