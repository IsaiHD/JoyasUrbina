import React, { useState, useEffect, useMemo } from 'react';
import type { PagoTransaccion, ItemVentaBatch } from '../types/ventas.types';
import { ventasService } from '../services/ventas.service';
import { supabase } from '../supabaseClient';

interface Props {
  pago: PagoTransaccion | null;
  onClose: () => void;
  onVentaCompletada: () => void;
}

interface ItemFormState extends ItemVentaBatch {
  idTemporal: string;
}

export const AsignarProductoModal: React.FC<Props> = ({ pago, onClose, onVentaCompletada }) => {
  const [tipos, setTipos] = useState<any[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [piedras, setPiedras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<ItemFormState[]>([]);

  // 1. Cargar catálogos
  useEffect(() => {
    if (!pago) return;

    const cargarCatalogos = async () => {
      const [t, m, p] = await Promise.all([
        supabase.from('tipo_joyas').select('*').order('nombre_tipo'),
        supabase.from('material').select('*').order('nombre_material'),
        supabase.from('piedra').select('*').order('nombre_piedra'),
      ]);
      setTipos(t.data || []);
      setMateriales(m.data || []);
      setPiedras(p.data || []);
    };

    cargarCatalogos();
  }, [pago]);

  const crearItemVacio = (precioSugerido = 0): ItemFormState => ({
    idTemporal: Math.random().toString(36).substring(2, 9),
    nombre_producto: '',
    sku_joya: '',
    precio_venta: precioSugerido,
    cantidad: 1,
    es_reversible: false,
    id_tipo: undefined,
    id_material: undefined,
    id_piedra: undefined,
    id_piedra_secundaria: undefined,
  });

  // 2. Inicializar con 1 joya que absorbe todo el valor
  useEffect(() => {
    if (pago) {
      setItems([crearItemVacio(pago.monto)]);
    }
  }, [pago]);

  // Cálculos en tiempo real
  const totalCobrado = pago?.monto || 0;
  const totalAsignado = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.precio_venta) || 0) * (Number(it.cantidad) || 1), 0);
  }, [items]);
  
  const diferencia = totalCobrado - totalAsignado;

  if (!pago) return null;

  const handleItemChange = (index: number, field: keyof ItemVentaBatch, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const itemActualizado = { ...copy[index], [field]: value };

      // Autocompletar nombre
      if (['id_tipo', 'id_material', 'id_piedra'].includes(field as string)) {
        const tipoName = tipos.find(t => t.id_tipo === itemActualizado.id_tipo)?.nombre_tipo;
        const matName = materiales.find(m => m.id_material === itemActualizado.id_material)?.nombre_material;
        const piedraName = piedras.find(p => p.id_piedra === itemActualizado.id_piedra)?.nombre_piedra;

        let autoNombre = '';
        if (tipoName) autoNombre += tipoName;
        if (matName) autoNombre += ` de ${matName}`;
        if (piedraName && piedraName !== 'Sin Piedra') autoNombre += ` con ${piedraName}`;
        itemActualizado.nombre_producto = autoNombre.trim();
      }

      copy[index] = itemActualizado;
      return copy;
    });
  };

  // 3. LA MAGIA: Auto-calcular precio en cascada al terminar de editar un precio
  const handlePriceBlur = () => {
    setItems(prev => {
      const copy = [...prev];
      const asignado = copy.reduce((acc, it) => acc + ((Number(it.precio_venta) || 0) * (Number(it.cantidad) || 1)), 0);
      const diff = totalCobrado - asignado;

      if (diff > 0) {
        // Busca la primera joya que tenga precio 0 o esté vacía
        const nextZeroIdx = copy.findIndex(it => !it.precio_venta || Number(it.precio_venta) === 0);
        if (nextZeroIdx !== -1) {
          const cantidadNext = Number(copy[nextZeroIdx].cantidad) || 1;
          copy[nextZeroIdx] = { 
            ...copy[nextZeroIdx], 
            precio_venta: Math.round(diff / cantidadNext) 
          };
        }
      }
      return copy;
    });
  };

  const handleAddItem = () => {
    const saldoRestante = Math.max(0, diferencia);
    setItems(prev => [...prev, crearItemVacio(saldoRestante === 0 ? 0 : saldoRestante)]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => {
      const nuevosItems = prev.filter((_, i) => i !== index);
      return nuevosItems;
    });
  };

  const isFormValid =
    diferencia === 0 &&
    items.length > 0 &&
    items.every(it => it.nombre_producto.trim() !== '' && Number(it.precio_venta) >= 0 && Number(it.cantidad) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);

    try {
      const { data: mpData } = await supabase
        .from('metodo_pago')
        .select('id_pago')
        .ilike('tipo_pago', '%tarjeta%')
        .limit(1)
        .maybeSingle();

      await ventasService.vincularPagoBatch({
        payment_id: pago.payment_id,
        id_metodo_pago: mpData?.id_pago || 1,
        cuotas: pago.cuotas || 1,
        items: items.map(it => ({
          nombre_producto: it.nombre_producto,
          sku_joya: it.sku_joya ? it.sku_joya.trim() : undefined,
          precio_venta: Number(it.precio_venta),
          cantidad: Number(it.cantidad),
          es_reversible: Boolean(it.es_reversible),
          id_tipo: it.id_tipo || 1,
          id_material: it.id_material || 1,
          id_piedra: it.id_piedra || null,
          id_piedra_secundaria: it.id_piedra_secundaria || null,
        })),
      });

      onVentaCompletada();
      onClose();
    } catch (err: any) {
      alert('Error al vincular los productos con el pago: ' + err.message);
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
      backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        background: '#1e293b', color: 'white', padding: '24px', borderRadius: '14px',
        width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '1.25rem' }}>¡Cobro Point Aprobado!</h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {pago.payment_id}</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
          background: '#0f172a', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #334155',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Cobrado en Máquina:</span>
            <strong style={{ fontSize: '1.1rem', color: '#4ade80' }}>${totalCobrado.toLocaleString('es-CL')}</strong>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
              {pago.cuotas > 1 ? `${pago.cuotas} cuotas de $${valorCuotaCalculado.toLocaleString('es-CL')}` : '1 cuota'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Asignado:</span>
            <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>${totalAsignado.toLocaleString('es-CL')}</strong>
            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>{items.length} joya(s)</span>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Saldo Pendiente:</span>
            <strong style={{
              fontSize: '1.1rem',
              color: diferencia === 0 ? '#4ade80' : diferencia > 0 ? '#facc15' : '#f87171',
            }}>
              {diferencia === 0
                ? 'Cuadrado ✓'
                : diferencia > 0
                ? `Faltan $${diferencia.toLocaleString('es-CL')}`
                : `Sobran $${Math.abs(diferencia).toLocaleString('es-CL')}`}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, index) => (
              <div key={item.idTemporal} style={{
                background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #334155',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    Joya #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      style={{
                        background: 'transparent', border: 'none', color: '#f87171',
                        fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline',
                      }}
                    >
                      Quitar producto
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <input
                    readOnly
                    required
                    placeholder="Se compone al elegir Tipo y Material..."
                    value={item.nombre_producto}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: '6px',
                      border: '1px solid #475569', background: '#1e293b',
                      color: item.nombre_producto ? '#38bdf8' : '#64748b',
                      fontWeight: item.nombre_producto ? 'bold' : 'normal',
                      fontSize: '0.85rem', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tipo de Joya *</label>
                    <select
                      value={item.id_tipo ?? ''}
                      onChange={e => handleItemChange(index, 'id_tipo', e.target.value ? Number(e.target.value) : undefined)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="">Seleccione...</option>
                      {tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Material *</label>
                    <select
                      value={item.id_material ?? ''}
                      onChange={e => handleItemChange(index, 'id_material', e.target.value ? Number(e.target.value) : undefined)}
                      required
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="">Seleccione...</option>
                      {materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Piedra Principal</label>
                    <select
                      value={item.id_piedra ?? ''}
                      onChange={e => handleItemChange(index, 'id_piedra', e.target.value ? Number(e.target.value) : undefined)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '0.85rem' }}
                    >
                      <option value="">Sin Piedra</option>
                      {piedras.map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU (Opcional)</label>
                    <input
                      placeholder="JOY-001"
                      value={item.sku_joya}
                      onChange={e => handleItemChange(index, 'sku_joya', e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Precio Asignado ($) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={item.precio_venta === 0 ? '' : item.precio_venta}
                      onChange={e => handleItemChange(index, 'precio_venta', Number(e.target.value))}
                      onBlur={handlePriceBlur}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#4ade80', fontWeight: 'bold', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.cantidad}
                      onChange={e => handleItemChange(index, 'cantidad', Number(e.target.value))}
                      onBlur={handlePriceBlur}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box', textAlign: 'center' }}
                    />
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#e2e8f0' }}>
                      <input
                        type="checkbox"
                        checked={item.es_reversible}
                        onChange={(e) => handleItemChange(index, 'es_reversible', e.target.checked)}
                      />
                      Reversible
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            style={{
              margin: '12px 0', padding: '10px', background: '#334155', color: '#38bdf8',
              border: '1px dashed #475569', borderRadius: '8px', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '0.85rem',
            }}
          >
            + Agregar otra joya
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', background: '#334155', color: '#cbd5e1',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                flex: 2, padding: '12px',
                background: !isFormValid ? '#475569' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '8px',
                fontWeight: 'bold', cursor: !isFormValid ? 'not-allowed' : 'pointer',
                opacity: !isFormValid ? 0.6 : 1,
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