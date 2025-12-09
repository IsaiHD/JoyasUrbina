import { useState, useEffect } from 'react';
import type { CreateProductDTO, Material, Piedra, TipoJoya, Producto } from '../types/inventario.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDTO, id?: number) => Promise<boolean>;
  catalogs: {
    materiales: Material[];
    piedras: Piedra[];
    tipos: TipoJoya[];
  };
  productToEdit?: Producto | null;
}

export default function CreateProductModal({ isOpen, onClose, onSubmit, catalogs, productToEdit }: Props) {
  const [form, setForm] = useState<CreateProductDTO>({
    nombre: '', sku: '', stock: 0,
    id_material: 0, id_piedra: 0, id_tipo: 0
  });
  const [saving, setSaving] = useState(false);

  const isEditMode = !!productToEdit; // Variable booleana para saber si editamos

  useEffect(() => {
    if (isOpen && productToEdit) {
      // MODO EDICIÓN
      setForm({
        nombre: productToEdit.nombre,
        sku: productToEdit.sku,
        stock: productToEdit.stock,
        id_material: productToEdit.material?.id_material || 0,
        id_piedra: productToEdit.piedra?.id_piedra || 0,
        id_tipo: productToEdit.tipo_joyas?.id_tipo || 0,
      });
    } else if (isOpen && !productToEdit) {
      // MODO CREACIÓN
      setForm({ nombre: '', sku: '', stock: 0, id_material: 0, id_piedra: 0, id_tipo: 0 });
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await onSubmit(form, productToEdit?.id_producto);
    setSaving(false);
    if (success) onClose();
  };

  const handleChange = (e: any) => {
    const value = e.target.type === 'number' || e.target.tagName === 'SELECT' 
      ? Number(e.target.value) 
      : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  // Estilo dinámico: Si está bloqueado, se ve gris
  const getStyle = (disabled: boolean) => ({
    ...inputStyle,
    backgroundColor: disabled ? '#f3f4f6' : 'white',
    color: disabled ? '#6b7280' : 'black',
    cursor: disabled ? 'not-allowed' : 'text'
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px' }}>
        
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditMode ? '📦 Reponer Stock' : '✨ Nuevo Producto'}
        </h2>
        
        {isEditMode && (
          <div style={{ background: '#fff7ed', color: '#c2410c', padding: '10px', borderRadius: '5px', fontSize: '0.85em', marginBottom: '15px', border: '1px solid #ffedd5' }}>
            🔒 Para mantener la integridad de las ventas, solo puedes modificar el stock. Si necesitas cambiar el nombre o SKU, crea un producto nuevo.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          
          {/* NOMBRE: Bloqueado en Edición */}
          <div>
            <label style={labelStyle}>Nombre del Producto</label>
            <input 
              name="nombre" 
              value={form.nombre} 
              onChange={handleChange} 
              disabled={isEditMode} // <--- BLOQUEADO
              required 
              style={getStyle(isEditMode)} 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* SKU: Bloqueado en Edición */}
            <div>
              <label style={labelStyle}>SKU</label>
              <input 
                name="sku" 
                value={form.sku} 
                onChange={handleChange} 
                disabled={isEditMode} // <--- BLOQUEADO
                required 
                style={getStyle(isEditMode)} 
              />
            </div>
            
            {/* STOCK: SIEMPRE EDITABLE (Este es el importante) */}
            <div>
              <label style={{...labelStyle, color: '#166534'}}>Stock Disponible</label>
              <input 
                name="stock" 
                type="number" 
                value={form.stock} 
                onChange={handleChange} 
                required 
                autoFocus={isEditMode} // Al abrir, el cursor va directo aquí
                style={{...getStyle(false), borderColor: '#166534', fontWeight: 'bold'}} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* MATERIAL: Bloqueado en Edición */}
            <div>
              <label style={labelStyle}>Material</label>
              <select 
                name="id_material" 
                value={form.id_material} 
                onChange={handleChange} 
                disabled={isEditMode} // <--- BLOQUEADO
                required 
                style={getStyle(isEditMode)}
              >
                <option value={0}>-- Selecciona --</option>
                {catalogs.materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
              </select>
            </div>

            {/* TIPO: Bloqueado en Edición */}
            <div>
              <label style={labelStyle}>Tipo de Joya</label>
              <select 
                name="id_tipo" 
                value={form.id_tipo} 
                onChange={handleChange} 
                disabled={isEditMode} // <--- BLOQUEADO
                required 
                style={getStyle(isEditMode)}
              >
                <option value={0}>-- Selecciona --</option>
                {catalogs.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>)}
              </select>
            </div>
          </div>

          {/* PIEDRA: Bloqueado en Edición */}
          <div>
            <label style={labelStyle}>Piedra</label>
            <select 
              name="id_piedra" 
              value={form.id_piedra} 
              onChange={handleChange} 
              disabled={isEditMode} // <--- BLOQUEADO
              required 
              style={getStyle(isEditMode)}
            >
              <option value={0}>-- Selecciona --</option>
              {catalogs.piedras.map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#e5e7eb', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {saving ? 'Guardando...' : (isEditMode ? 'Actualizar Stock' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.85em', color: '#4b5563', fontWeight: 'bold' };