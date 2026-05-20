import { useState, useEffect } from 'react';
import { useVentas } from '../hooks/useVentas';
import { useAuth } from '../hooks/useAuth';
import type { CreateVentaDTO } from '../types/ventas.types';
import SuccessModal from '../components/CompraExitoModal'; 
import './VentasPage.css'; // <--- IMPORTAMOS EL CSS AQUI

export default function VentasPage() {
  const { ventas, catalogs, metodosPago, addVenta } = useVentas();
  const { session } = useAuth();
  
  const [loadingSale, setLoadingSale] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    nombre_producto: '',
    precio_venta: '', 
    cantidad: 1,
    es_reversible: false,
    id_metodo_pago: 0,
    id_tipo: 0,
    id_material: 0,
    id_piedra: 0,
    id_piedra_secundaria: 0
  });

  useEffect(() => {
    const idTipo = Number(form.id_tipo);
    const idMat = Number(form.id_material);
    const idPiedra1 = Number(form.id_piedra);
    const idPiedra2 = Number(form.id_piedra_secundaria);

    const tipoName = catalogs.tipos.find(t => t.id_tipo === idTipo)?.nombre_tipo;
    const materialName = catalogs.materiales.find(m => m.id_material === idMat)?.nombre_material;
    const piedraName = catalogs.piedras.find(p => p.id_piedra === idPiedra1)?.nombre_piedra;
    const piedra2Name = catalogs.piedras.find(p => p.id_piedra === idPiedra2)?.nombre_piedra;

    let autoNombre = '';
    if (tipoName) autoNombre += tipoName;
    if (materialName) autoNombre += ` de ${materialName}`;

    if (form.es_reversible && piedraName && piedra2Name) {
      autoNombre += ` Reversible ${piedraName} y ${piedra2Name}`;
    } else if (piedraName && piedraName !== 'Sin Piedra') {
      autoNombre += ` con ${piedraName}`;
    }

    if (autoNombre.trim() !== '') {
      setForm(prev => ({ ...prev, nombre_producto: autoNombre.trim() }));
    } else {
      setForm(prev => ({ ...prev, nombre_producto: '' }));
    }
  }, [form.id_tipo, form.id_material, form.id_piedra, form.id_piedra_secundaria, form.es_reversible, catalogs]);

  const handleChange = (e: any) => {
    const { name, value, type, tagName, checked } = e.target;
    const val = type === 'checkbox' ? checked : 
                (type === 'number' || tagName === 'SELECT') ? Number(value) : value;
    
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloNumeros = e.target.value.replace(/\D/g, '');
    setForm(prev => ({ ...prev, precio_venta: soloNumeros }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_metodo_pago) return alert("Seleccione método de pago");
    if (!form.nombre_producto) return alert("Por favor, seleccione un tipo de joya.");
    
    if (form.es_reversible) {
      if (!form.id_piedra || !form.id_piedra_secundaria) {
        return alert("Debe seleccionar ambas piedras para una joya reversible.");
      }
      if (form.id_piedra === form.id_piedra_secundaria) {
        return alert("Las piedras de ambos lados deben ser diferentes.");
      }
    }

    try {
      setLoadingSale(true);
      
      const ventaData: CreateVentaDTO = {
        nombre_producto: form.nombre_producto,
        precio_venta: Number(form.precio_venta), 
        cantidad: form.cantidad,
        es_reversible: form.es_reversible,
        id_metodo_pago: form.id_metodo_pago,
        id_tipo: form.id_tipo,
        id_material: form.id_material,
        id_piedra: form.id_piedra,
        id_piedra_secundaria: form.es_reversible ? form.id_piedra_secundaria : undefined,
        id_usuario: session?.user?.id || ''
      };

      const success = await addVenta(ventaData);
      
      if (success) {
        setForm({
          nombre_producto: '', precio_venta: '', cantidad: 1, es_reversible: false,
          id_metodo_pago: 0, id_tipo: 0, id_material: 0, id_piedra: 0, id_piedra_secundaria: 0
        });
        setShowSuccess(true);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoadingSale(false);
    }
  };

  const formatDinero = (monto: number) => 
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto);

  const formatFecha = (fechaStr: string) => 
    new Date(fechaStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  const precioFormateado = form.precio_venta 
    ? `$ ${Number(form.precio_venta).toLocaleString('es-CL')}` 
    : '';

  const ventasHoy = ventas.slice(0, 8); 
  const totalHoy = ventasHoy.reduce((sum, v) => sum + v.precio_venta, 0);

  return (
    <div className="ventas-container">
      
      {/* COLUMNA IZQUIERDA: CAJA REGISTRADORA */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#111827', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
          🛒 Nueva Venta Rápida
        </h2>
        
        <form onSubmit={handleCheckout} style={{ display: 'grid', gap: '20px', flex: 1 }}>
          
          <div className="form-row-2-1">
            <div>
              <label style={labelStyle}>¿Qué se vendió?</label>
              <input 
                name="nombre_producto" 
                value={form.nombre_producto} 
                readOnly 
                required 
                style={{...inputStyle, backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280'}} 
                placeholder="Se genera automáticamente..." 
              />
            </div>
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input name="cantidad" type="number" min="1" value={form.cantidad} onChange={handleChange} required style={inputStyle} />
            </div>
          </div>

          <div className="form-row-1-1">
            <div>
              <label style={labelStyle}>Tipo</label>
              <select name="id_tipo" value={form.id_tipo} onChange={handleChange} style={inputStyle}>
                <option value={0}>-- Selecciona --</option>
                {catalogs.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Material</label>
              <select name="id_material" value={form.id_material} onChange={handleChange} style={inputStyle}>
                <option value={0}>-- Selecciona --</option>
                {catalogs.materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '15px'}}>
              <input name="es_reversible" type="checkbox" checked={form.es_reversible} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              Es Reversible
            </label>

            <div className={form.es_reversible ? "form-row-1-1" : ""}>
              <div>
                <label style={labelStyle}>{form.es_reversible ? 'Piedra Lado A' : 'Piedra'}</label>
                <select name="id_piedra" value={form.id_piedra} onChange={handleChange} style={inputStyle}>
                  <option value={0}>-- Selecciona --</option>
                  {catalogs.piedras
                    .filter(p => form.es_reversible && form.id_piedra_secundaria != 0 ? p.id_piedra !== Number(form.id_piedra_secundaria) : true)
                    .map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)
                  }
                </select>
              </div>

              {form.es_reversible && (
                <div>
                  <label style={labelStyle}>Piedra Lado B</label>
                  <select name="id_piedra_secundaria" value={form.id_piedra_secundaria} onChange={handleChange} style={inputStyle}>
                    <option value={0}>-- Selecciona --</option>
                    {catalogs.piedras
                      .filter(p => form.id_piedra != 0 ? p.id_piedra !== Number(form.id_piedra) : true)
                      .map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)
                    }
                  </select>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: '20px', marginTop: 'auto' }}>
            <div className="form-row-1-1" style={{ marginBottom: '20px' }}>
              <div>
                <label style={{...labelStyle, color: '#16a34a'}}>Precio Total ($)</label>
                <input 
                  name="precio_venta" 
                  type="text" 
                  value={precioFormateado} 
                  onChange={handlePriceChange} 
                  required 
                  style={{...inputStyle, borderColor: '#16a34a', fontSize: '1.2em', fontWeight: 'bold'}} 
                  placeholder="$ 0" 
                />
              </div>
              <div>
                <label style={labelStyle}>Método de Pago</label>
                <select name="id_metodo_pago" value={form.id_metodo_pago} onChange={handleChange} required style={{...inputStyle, fontSize: '1.1em', backgroundColor: '#f9fafb'}}>
                  <option value={0}>Selecciona Pago</option>
                  {metodosPago.map(p => <option key={p.id_pago} value={p.id_pago}>{p.tipo_pago}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loadingSale} style={btnSubmit}>
              {loadingSale ? 'Procesando...' : '💰 Registrar Venta'}
            </button>
          </div>
        </form>
      </div>

      {/* COLUMNA DERECHA: ÚLTIMAS VENTAS */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #cbd5e1', paddingBottom: '15px', fontSize: '1.2em', color: '#334155' }}>
          📋 Últimas Ventas
        </h2>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {ventasHoy.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '50px' }}>No hay ventas recientes.</div>
          ) : (
            ventasHoy.map(v => (
              <div key={v.id_venta} style={{ background: 'white', padding: '12px', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{v.nombre_producto}</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{formatDinero(v.precio_venta)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#64748b' }}>
                  <span>{formatFecha(v.fecha_venta)} • {v.metodo_pago?.tipo_pago}</span>
                  <span>{v.cantidad} un.</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold', color: '#0f172a' }}>
            <span>Total Reciente</span>
            <span>{formatDinero(totalHoy)}</span>
          </div>
        </div>
      </div>

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Venta registrada exitosamente."
      />
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' as const, fontSize: '1em' };
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '0.9em', color: '#4b5563', fontWeight: 'bold' };
const btnSubmit = { width: '100%', padding: '15px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' };