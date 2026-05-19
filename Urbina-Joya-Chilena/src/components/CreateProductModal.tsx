import { useState, useEffect, type CSSProperties } from 'react';
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
  skuPrevisualizado: string;
  previewSKU: (idTipo: number, idMaterial: number) => void;
}

export default function CreateProductModal({ 
  isOpen, onClose, onSubmit, catalogs, productToEdit, skuPrevisualizado, previewSKU 
}: Props) {
  
  const [form, setForm] = useState<any>({
    nombre: '', sku: '', stock: 0,
    id_material: 0, id_piedra: 0, id_tipo: 0, es_reversible: false
  });
  const [saving, setSaving] = useState(false);

  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isOpen && productToEdit) {
      setForm({
        nombre: productToEdit.nombre,
        sku: productToEdit.sku,
        stock: productToEdit.stock,
        id_material: productToEdit.material?.id_material || 0,
        id_piedra: productToEdit.piedra?.id_piedra || 0,
        id_tipo: productToEdit.tipo_joyas?.id_tipo || 0,
        es_reversible: (productToEdit as any).es_reversible || false
      });
    } else if (isOpen) {
      setForm({ nombre: '', sku: '', stock: 0, id_material: 0, id_piedra: 0, id_tipo: 0, es_reversible: false });
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const dataToSend = isEditMode ? form : { ...form, sku: skuPrevisualizado };
    const success = await onSubmit(dataToSend, productToEdit?.id_producto);
    setSaving(false);
    if (success) onClose();
  };

  const handleChange = (e: any) => {
    const { name, value, type, tagName, checked } = e.target;
    const val = type === 'checkbox' ? checked : 
                (type === 'number' || tagName === 'SELECT') ? Number(value) : value;
    
    const nextForm = { ...form, [name]: val };
    setForm(nextForm);

    if (!isEditMode && (name === 'id_tipo' || name === 'id_material')) {
      previewSKU(
        name === 'id_tipo' ? val : nextForm.id_tipo,
        name === 'id_material' ? val : nextForm.id_material
      );
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{isEditMode ? '📦 Reponer Stock' : '✨ Nuevo Producto'}</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} disabled={isEditMode} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cantidad</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} required style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
            <div>
              <label style={labelStyle}>SKU</label>
              <input name="sku" value={isEditMode ? form.sku : skuPrevisualizado} readOnly required style={inputStyle} />
            </div>
            <div style={{ marginTop: '15px' }}>
              <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input name="es_reversible" type="checkbox" checked={form.es_reversible} onChange={handleChange} />
                Reversible
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select name="id_material" value={form.id_material} onChange={handleChange} disabled={isEditMode} required style={inputStyle}>
              <option value={0}>-- Material --</option>
              {catalogs.materiales.map(m => <option key={m.id_material} value={m.id_material}>{m.nombre_material}</option>)}
            </select>
            <select name="id_tipo" value={form.id_tipo} onChange={handleChange} disabled={isEditMode} required style={inputStyle}>
              <option value={0}>-- Tipo Joya --</option>
              {catalogs.tipos.map(t => <option key={t.id_tipo} value={t.id_tipo}>{t.nombre_tipo}</option>)}
            </select>
          </div>

          <select name="id_piedra" value={form.id_piedra} onChange={handleChange} disabled={isEditMode} required style={inputStyle}>
            <option value={0}>-- Piedra --</option>
            {catalogs.piedras.map(p => <option key={p.id_piedra} value={p.id_piedra}>{p.nombre_piedra}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={btnCancel}>Cancelar</button>
            <button type="submit" disabled={saving} style={btnSubmit}>{saving ? '...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle: CSSProperties = { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px' };
const inputStyle: CSSProperties = { padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', width: '100%', boxSizing: 'border-box' };
const labelStyle: CSSProperties = { display: 'block', marginBottom: '5px', fontSize: '0.85em', fontWeight: 'bold' };
const btnSubmit: CSSProperties = { flex: 2, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancel: CSSProperties = { flex: 1, padding: '10px', background: '#e5e7eb', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const closeButtonStyle: CSSProperties = { background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#6b7280' };