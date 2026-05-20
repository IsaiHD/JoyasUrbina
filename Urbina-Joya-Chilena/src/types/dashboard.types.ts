// src/types/dashboard.types.ts

// Interfaz flexible para el gráfico apilado.
// name: "lun", "Anillo Oro": 50000, "Collar Plata": 20000
export interface StackedChartData {
  name: string; // El día de la semana
  // Esto permite propiedades dinámicas (nombres de productos) que sean números
  [productName: string]: string | number; 
}

export interface DashboardStats {
  salesCount: number;
  revenueToday: number;
  // Estructura para el gráfico de barras apiladas
  salesLast7Days: StackedChartData[];
  productNamesList: string[]; // Para saber qué barras pintar dinámicamente
}