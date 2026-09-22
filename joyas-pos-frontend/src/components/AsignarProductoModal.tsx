import React, { useState, useEffect } from 'react';
import type { PagoTransaccion } from '../types/ventas.types';
import { vincularPagoConVenta } from '../services/ventas.service';
import { supabase } from '../supabaseClient';

interface Props {
  pago: PagoTransaccion | null;
  onClose: () => void;
  onVentaCompletada: () => void;
}

export const AsignarProductoModal: React.FC<Props> = ({ pago, onClose, onVentaCompletada }) => {
  const [nombreProducto, setNombreProducto] = useState('');
  const [sku, setSku] = useState('');
  const [idTipo, setIdTipo] = useState<number | undefined>();
  const [idMaterial, setIdMaterial] = useState<number | undefined>();
  const [idPiedra, setIdPiedra] = useState<number | undefined>();

  // Listas de catálogo
  const [tipos, setTipos] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [piedras, setPiedras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Cargar catálogos al abrir el modal
  useEffect(() => {
    if (!pago) return;

    const cargarCatalogos = async () => {
      const [t, m, p] = await Promise.all([
        supabase.from('tipo_joyas').select('*').order('nombre_tipo'),
        supabase.from('material').select('*').order('nombre_material'),
        supabase.from('piedra').select('*').order('nombre_piedra')
      ]);
      setTipos(t.data || []);
      setMateriales(m.data || []);
      setPiedras(p.data || []);
    };

    cargarCatalogos();
  }, [pago]);

  // 2. Componer el nombre automáticamente al cambiar tipo, material o piedra
  useEffect(() => {
    const tipoName = tipos.find(t => t.id_tipo === idTipo)?.nombre_tipo;
    const materialName = materiales.find(m => m.id_material === idMaterial)?.nombre_material;
    const piedraName = piedras.find(p => p.id_piedra === idPiedra)?.nombre_piedra;

    let autoNombre = '';
    if (tipoName) autoNombre += tipoName;
    if (materialName) autoNombre += ` de ${materialName}`;
    if (piedraName && piedraName !== 'Sin Piedra') autoNombre += ` con ${piedraName}`;

    setNombreProducto(autoNombre.trim());
  }, [idTipo, idMaterial, idPiedra, tipos, materiales, piedras]);

  if (!pago) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreProducto) {
      alert("Por favor seleccione al menos el tipo y material de la joya.");
      return;
    }

    setLoading(true);

    try {
      // Obtenemos el id del método de pago de tarjeta
      const { data: mpData } = await supabase
        .from('metodo_pago')
        .select('id_pago')
        .ilike('tipo_pago', '%tarjeta%')
        .limit(1)
        .maybeSingle();

      await vincularPagoConVenta({
        nombre_producto: nombreProducto,
        sku_joya: sku.trim() || undefined,
        precio_venta: pago.monto,
        cantidad: 1,
        id_metodo_pago: mpData?.id_pago || 1,
        id_tipo: idTipo,
        id_material: idMaterial,
        id_piedra: idPiedra,
        payment_id: pago.payment_id,
        cuotas: pago.cuotas
      }, pago.id_transaccion);

      onVentaCompletada();
      onClose();
    } catch (err: any) {
      alert("Error al vincular el producto con la venta: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const valorCuotaCalculado = pago.cuotas > 1 
    ? Math.round(pago.monto_cuota || pago.monto / pago.cuotas)
    : pago.monto;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{ background: '#1e293b', color: 'white', padding: '28px', borderRadius: '14px', width: '460px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#38bdf8' }}>¡Cobro Point Aprobado!</h2>
        
        <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0 16px 0', color: '#4ade80' }}>
          ${pago.monto.toLocaleString('es-CL')} 
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '8px', fontWeight: 'normal' }}>
            {pago.cuotas > 1 
              ? `(${pago.cuotas} cuotas de $${valorCuotaCalculado.toLocaleString('es-CL')})` 
              : '(Débito / 1 cuota)'}
          </span>
        </p>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' }}>
          Selecciona las características de la joya entregada:
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Campo auto-rellenable y de solo lectura */}
          <div>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre / Descripción</label>
            <input 
              readOnly
              required
              placeholder="Se genera automáticamente al elegir tipo y material..."
              value={nombreProducto} 
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid #475569', background: '#0f172a',
                color: nombreProducto ? '#38bdf8' : '#64748b',
                fontWeight: nombreProducto ? 'bold' : 'normal',
                cursor: 'not-allowed', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SKU (Opcional)</label>
              <input 
                placeholder="JOY-0042"
                value={sku} 
                onChange={e => setSku(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo de Joya</label>
              <select 
                value={idTipo ?? ''} 
                onChange={e => setIdTipo(e.target.value ? Number(e.target.value) : undefined)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Seleccione...</option>
                {tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Material</label>
              <select 
                value={idMaterial ?? ''} 
                onChange={e => setIdMaterial(e.target.value ? Number(e.target.value) : undefined)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Seleccione...</option>
                {materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Piedra Principal</label>
              <select 
                value={idPiedra ?? ''} 
                onChange={e => setIdPiedra(e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Ninguna / Sin Piedra</option>
                {piedras.map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', background: '#334155', color: '#cbd5e1',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
            <button 
              type="submit" 
              disabled={loading || !nombreProducto}
              style={{
                flex: 2, padding: '12px',
                background: !nombreProducto ? '#475569' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', cursor: !nombreProducto ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Guardando...' : 'Asociar a la Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};