import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import KpiCard from '../components/KpiCard/KpiCard'; 

const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

const exportarExcel = () => {
  const datos = [
    { Concepto: "Ingresos Estimados (Mes Actual)", Monto: 1500000 },
    { Concepto: "Ingresos Proyectados (Mes + 1)", Monto: 1800000 },
    { Concepto: "Ingresos Proyectados (Mes + 2)", Monto: 2100000 },
  ];

  const worksheet = XLSX.utils.json_to_sheet(datos);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Proyección");

  XLSX.writeFile(workbook, "Proyeccion_Ingresos.xlsx");
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalDay = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

    return (
      <div style={{ background: 'white', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
          {label} - Total: ${totalDay.toLocaleString('es-CL')}
        </div>
        <div>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9em' }}>
              <span style={{ borderLeft: `4px solid ${entry.color}`, paddingLeft: '8px', color: '#4b5563', marginRight: '15px' }}>
                {entry.name}
              </span>
              <strong style={{ color: '#111827' }}>${Number(entry.value).toLocaleString('es-CL')}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  // Extraemos las propiedades directo del hook (sin el objeto intermedio 'stats')
  const { revenueToday, salesCount, salesLast7Days, productNamesList, loading, error } = useDashboard();
  const { role } = useAuth();
  if (role !== 'admin') return <div style={{ padding: '20px', color: 'red' }}>⛔ Acceso Restringido</div>;
  if (loading) return <div style={{ padding: '20px' }}>🔄 Cargando métricas...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>⚠️ Error: {error}</div>;

  return (
    <div style={{ padding: '20px', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <span style={{ fontSize: '2em' }}>📊</span>
        <h1 style={{ margin: 0, color: '#111827' }}>Panel de Ingresos</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KpiCard title="INGRESOS DE HOY" value={`$${revenueToday.toLocaleString('es-CL')}`} icon="💰" color="#10b981" />
        <KpiCard title="JOYAS VENDIDAS HOY" value={salesCount} icon="🛍️" color="#3b82f6" />
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#374151', fontSize: '1.2em' }}>📈 Ingresos de los Últimos 7 Días</h3>

        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesLast7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value.toLocaleString('es-CL')}`} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />

              {productNamesList.map((productName, index) => (
                <Bar
                  key={productName}
                  dataKey={productName}
                  stackId="1" 
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                  barSize={40}
                  name={productName}
                  radius={index === productNamesList.length - 1 ? [4, 4, 0, 0] : [0,0,0,0]}
                />
              ))}

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PROYECCIÓN MENSUAL CON DESCARGA */}
        <div style={{ 
          background: '#eff6ff', padding: '20px', borderRadius: '12px', 
          border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px'
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1em' }}>🚀 Proyección Mensual</h3>
            <p style={{ margin: '5px 0 0 0', color: '#60a5fa', fontSize: '0.85em' }}>Estimación basada en ritmo actual</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1e3a8a' }}>$ 5.400.000</div>
              <div style={{ fontSize: '0.8em', color: '#3b82f6' }}>Próximos 3 meses</div>
            </div>
            <button 
              onClick={exportarExcel} 
              style={{ 
                background: '#2563eb', color: 'white', border: 'none', padding: '10px 15px', 
                borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' 
              }}
            >
              📊 Descargar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}