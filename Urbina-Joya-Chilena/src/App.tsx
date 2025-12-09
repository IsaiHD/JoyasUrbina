import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

// --- TIPOS DE DATOS ---
interface Producto {
  id_producto: number
  sku: string 
  nombre: string
  stock: number
  material: { nombre_material: string } | null
  piedra: { nombre_piedra: string } | null
  tipo_joyas: { nombre_tipo: string } | null
}

interface Auxiliar { id: number, nombre: string } 

function App() {
  // --- ESTADOS ---
  const [productos, setProductos] = useState<Producto[]>([])
  const [materiales, setMateriales] = useState<Auxiliar[]>([])
  const [piedras, setPiedras] = useState<Auxiliar[]>([])
  const [tipos, setTipos] = useState<Auxiliar[]>([])
  const [cargando, setCargando] = useState(true)
  const [vistaActual, setVistaActual] = useState('inventario') // Para cambiar pestañas en el futuro

  // Estado del formulario
  const [nuevoProducto, setNuevoProducto] = useState({
    sku: '', nombre: '', stock: 0, id_material: '', id_piedra: '', id_tipo: ''
  })
  
  // Estado para mostrar/ocultar el formulario
  const [mostrarForm, setMostrarForm] = useState(false)

  // --- KPI (Indicadores Clave) ---
  const totalProductos = productos.length
  const stockBajo = productos.filter(p => p.stock <= 2).length
  const totalUnidades = productos.reduce((acc, item) => acc + item.stock, 0)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      // Cargar productos + relaciones
      const { data: dataProd } = await supabase
        .from('producto')
        .select(`*, material (nombre_material), piedra (nombre_piedra), tipo_joyas (nombre_tipo)`)
        .order('id_producto', { ascending: false })

      if (dataProd) setProductos(dataProd as any)

      // Cargar listas auxiliares
      const { data: dataMat } = await supabase.from('material').select('id_material, nombre_material')
      const { data: dataPie } = await supabase.from('piedra').select('id_piedra, nombre_piedra')
      const { data: dataTip } = await supabase.from('tipo_joyas').select('id_tipo, nombre_tipo')

      if (dataMat) setMateriales(dataMat.map((x: any) => ({ id: x.id_material, nombre: x.nombre_material })))
      if (dataPie) setPiedras(dataPie.map((x: any) => ({ id: x.id_piedra, nombre: x.nombre_piedra })))
      if (dataTip) setTipos(dataTip.map((x: any) => ({ id: x.id_tipo, nombre: x.nombre_tipo })))

    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setCargando(false)
    }
  }

  async function crearProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoProducto.id_material || !nuevoProducto.id_tipo) return alert("Faltan datos")

    try {
      const { error } = await supabase.from('producto').insert([{
        SKU: nuevoProducto.sku,
        nombre: nuevoProducto.nombre,
        stock: parseInt(String(nuevoProducto.stock)),
        id_material: parseInt(nuevoProducto.id_material),
        id_piedra: parseInt(nuevoProducto.id_piedra),
        id_tipo: parseInt(nuevoProducto.id_tipo)
      }])
      if (error) throw error
      alert("¡Guardado!")
      setNuevoProducto({ sku: '', nombre: '', stock: 0, id_material: '', id_piedra: '', id_tipo: '' })
      setMostrarForm(false) // Cerrar formulario al guardar
      cargarDatos()
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const handleChange = (e: any) => {
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value })
  }

  // --- RENDERIZADO (LAYOUT DASHBOARD) ---
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#f4f7fe' }}>
      
      {/* 1. SIDEBAR (Barra Lateral) */}
      <aside style={{ width: '250px', backgroundColor: '#111827', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '40px', color: '#38bdf8' }}>💎 Joyas Urbina</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setVistaActual('inventario')} style={btnSidebarStyle(vistaActual === 'inventario')}>📦 Inventario</button>
          <button onClick={() => setVistaActual('ventas')} style={btnSidebarStyle(vistaActual === 'ventas')}>💰 Ventas (Pronto)</button>
          <button onClick={() => setVistaActual('clientes')} style={btnSidebarStyle(vistaActual === 'clientes')}>bust Clientes (Pronto)</button>
        </nav>
        
        <div style={{ marginTop: 'auto', fontSize: '0.8em', color: '#6b7280' }}>
          v1.0.0 - Panel Admin
        </div>
      </aside>

      {/* 2. AREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* HEADER SUPERIOR */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#1f2937' }}>Resumen General</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{background: '#e0e7ff', color:'#3730a3', padding: '5px 10px', borderRadius:'20px', fontSize:'0.9em'}}>Admin</span>
          </div>
        </header>

        {/* TARJETAS KPI (ESTADÍSTICAS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <CardKPI title="Total Joyas" value={totalProductos} icon="💎" color="#3b82f6" />
          <CardKPI title="Unidades Totales" value={totalUnidades} icon="📦" color="#10b981" />
          <CardKPI title="Stock Crítico" value={stockBajo} icon="⚠️" color="#ef4444" alert={stockBajo > 0} />
        </div>

        {/* SECCIÓN INVENTARIO */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Inventario Actual</h3>
            <button 
              onClick={() => setMostrarForm(!mostrarForm)}
              style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mostrarForm ? '❌ Cancelar' : '+ Nueva Joya'}
            </button>
          </div>

          {/* FORMULARIO DESPLEGABLE */}
          {mostrarForm && (
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <form onSubmit={crearProducto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <input name="nombre" placeholder="Nombre Producto" value={nuevoProducto.nombre} onChange={handleChange} required style={inputStyle} />
                <input name="sku" placeholder="SKU" value={nuevoProducto.sku} onChange={handleChange} required style={inputStyle} />
                <select name="id_tipo" value={nuevoProducto.id_tipo} onChange={handleChange} required style={inputStyle}>
                  <option value="">Tipo...</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <select name="id_material" value={nuevoProducto.id_material} onChange={handleChange} required style={inputStyle}>
                  <option value="">Material...</option>
                  {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
                <select name="id_piedra" value={nuevoProducto.id_piedra} onChange={handleChange} required style={inputStyle}>
                  <option value="">Piedra...</option>
                  {piedras.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input type="number" name="stock" placeholder="Cantidad Stock" value={nuevoProducto.stock} onChange={handleChange} required style={inputStyle} />
                <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Guardar en BD</button>
              </form>
            </div>
          )}

          {/* TABLA DE DATOS */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#000000ff', fontSize: '0.9em' }}>

                  <th style={{ padding: '12px' }}>Producto</th>
                  <th style={{ padding: '12px' }}>SKU</th>
                  <th style={{ padding: '12px' }}>Detalles</th>
                  <th style={{ padding: '12px' }}>Stock</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? <tr><td colSpan={5} style={{padding:'20px', textAlign:'center'}}>Cargando datos...</td></tr> : 
                 productos.map((p) => (
                  <tr key={p.id_producto} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontWeight: '500', color: 'rgba(0, 0, 0, 1)' }}>{p.nombre}</td>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '0.9em' }}>{p.sku || p.sku}</td>
                    <td style={{ padding: '12px', fontSize: '0.9em' }}>
                      <span style={badgeStyle}>{p.tipo_joyas?.nombre_tipo}</span> 
                      <span style={{marginLeft:'5px', color:'#555'}}>{p.material?.nombre_material}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 1)' }}>{p.stock}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        background: p.stock < 3 ? '#fecaca' : '#d1fae5', 
                        color: p.stock < 3 ? '#991b1b' : '#065f46',
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em', fontWeight: 'bold'
                      }}>
                        {p.stock < 3 ? 'Bajo Stock' : 'Disponible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  )
}

// --- COMPONENTES VISUALES SIMPLES (ESTILOS) ---

const CardKPI = ({ title, value, icon, color, alert }: any) => (
  <div style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${alert ? 'red' : color}` }}>
    <div style={{ fontSize: '2em', background: '#f3f4f6', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{icon}</div>
    <div>
      <div style={{ color: '#6b7280', fontSize: '0.9em' }}>{title}</div>
      <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
    </div>
  </div>
)

// Estilos en variables para no ensuciar el HTML
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }
const badgeStyle = { background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }

const btnSidebarStyle = (active: boolean) => ({
  background: active ? '#1f2937' : 'transparent',
  color: active ? 'white' : '#9ca3af',
  border: 'none', padding: '12px', textAlign: 'left' as const, cursor: 'pointer', borderRadius: '8px', fontSize: '1em',
  transition: '0.2s', marginBottom: '5px'
})

export default App