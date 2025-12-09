// src/pages/DashboardPage.tsx
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import KpiCard from '../components/KpiCard/KpiCard';
import '../components/KpiCard/KpiCard.css';

// Paleta de colores para las distintas joyas en la barra apilada
const BAR_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Amarillo/Naranja
  '#8b5cf6', // Morado
  '#ec4899', // Rosado
  '#06b6d4', // Cian
  '#6366f1'  // Índigo
];

// --- TOOLTIP PERSONALIZADO PARA BARRAS APILADAS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Calculamos el total del día sumando los segmentos
    const totalDay = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

    return (
      <div className="custom-tooltip">
        <div className="tooltip-title">{label} - Total: ${totalDay.toLocaleString('es-CL')}</div>
        <div className="tooltip-list">
          {/* Iteramos sobre cada segmento de la barra apilada */}
          {payload.map((entry: any, index: number) => (
            <div key={index} className="tooltip-item" style={{ borderLeft: `4px solid ${entry.color}`, paddingLeft: '8px' }}>
              <span>{entry.name}</span> {/* Nombre del producto */}
              <strong>${Number(entry.value).toLocaleString('es-CL')}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { stats, loading } = useDashboard();
  const { role } = useAuth();

  if (role !== 'admin') return <div className="dashboard-container error-msg">⛔ Acceso Restringido</div>;
  if (loading) return <div className="dashboard-container loading-msg">🔄 Cargando métricas...</div>;

  return (
    <div className="dashboard-container">
      {/* Header y KPIs (Sin cambios) */}
      <div className="dashboard-header">
        <span style={{ fontSize: '1.5em' }}>📊</span>
        <h1 className="dashboard-title">Panel de Control</h1>
      </div>

      <div className="kpi-grid">
        <KpiCard title="INGRESOS HOY" value={`$${stats.revenueToday.toLocaleString('es-CL')}`} icon="💰" color="#10b981" />
        <KpiCard title="VENTAS HOY" value={stats.salesCount} icon="📄" color="#3b82f6" />
        <KpiCard title="STOCK BAJO" value={stats.lowStock} icon="⚠️" color="#ef4444" alert={stats.lowStock > 0} />
        <KpiCard title="INVENTARIO TOTAL" value={stats.totalProducts} icon="💎" color="#8b5cf6" />
      </div>

      {/* GRÁFICO DE BARRAS APILADAS */}
      <div className="chart-container">
        <div className="chart-header">
          <span style={{ fontSize: '1.2em' }}>📈</span>
          <h3 className="chart-title">Tendencia de Ventas (Detalle por Producto)</h3>
        </div>

        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.salesLast7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>

              {/* GENERACIÓN DINÁMICA DE BARRAS APILADAS */}
              {/* Iteramos sobre la lista de nombres de productos que obtuvimos del servicio */}
              {stats.productNamesList.map((productName, index) => (
                <Bar
                  key={productName}
                  dataKey={productName} // Usamos el nombre del producto como llave
                  stackId="1" // ¡ESTO ES LO IMPORTANTE! El mismo ID apila las barras
                  fill={BAR_COLORS[index % BAR_COLORS.length]} // Asignamos color cíclicamente
                  radius={index === stats.productNamesList.length - 1 ? [6, 6, 0, 0] : [0,0,0,0]} // Solo redondeamos la última barra superior
                  barSize={50}
                  name={productName} // Para la leyenda
                />
              ))}

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}