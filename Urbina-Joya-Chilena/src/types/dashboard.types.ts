// src/types/dashboard.types.ts

// Interfaz flexible para el gráfico apilado.
// name: "lun", "Anillo Oro": 50000, "Collar Plata": 20000
export interface StackedChartData {
  name: string; // El día de la semana
  // Esto permite propiedades dinámicas (nombres de productos) que sean números
  [productName: string]: string | number; 
}

export interface DashboardStats {
  totalProducts: number;
  lowStock: number;
  salesCount: number;
  revenueToday: number;
  // Cambiamos a la nueva estructura y agregamos la lista de nombres
  salesLast7Days: StackedChartData[];
  productNamesList: string[]; // <--- NUEVO: Para saber qué barras pintar
  stockByCategory: { name: string; value: number }[];
}