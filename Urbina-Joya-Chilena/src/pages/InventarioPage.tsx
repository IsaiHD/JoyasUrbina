import { useState } from 'react';
import { useInventory } from '../hooks/useInventario';
import { useAuth } from '../hooks/useAuth';
import CreateProductModal from '../components/CreateProductModal';
import type { CreateProductDTO, Producto } from '../types/inventario.types';

export default function InventoryPage() {
  // 1. Extraemos las nuevas propiedades del hook
  const { 
    products, 
    catalogs, 
    loading, 
    error, 
    addProduct, 
    updateProduct,
    skuPrevisualizado,
    previewSKU 
  } = useInventory();
  
  const { role } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Producto | null>(null);

  const handleSave = async (data: CreateProductDTO, id?: number) => {
    if (id) {
      return await updateProduct(id, data);
    } else {
      return await addProduct(data);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (producto: Producto) => {
    setEditingItem(producto);
    setIsModalOpen(true);
  };

  if (loading && products.length === 0) return <div style={{ padding: '20px' }}>Cargando sistema...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', height: '100%', boxSizing: 'border-box' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#111827' }}>📦 Inventario</h2>
          <span style={{ fontSize: '0.9em', color: '#6b7280' }}>Total: {products.length} productos</span>
        </div>
        
        {role === 'admin' && (
          <button 
            onClick={openCreate}
            style={{ 
              backgroundColor: '#2563eb', color: 'white', border: 'none', 
              padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', 
              fontWeight: 'bold'
            }}
          >
            + Nuevo Producto
          </button>
        )}
      </header>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px', color: '#6b7280' }}>Producto</th>
                <th style={{ padding: '16px', color: '#6b7280' }}>SKU</th>
                <th style={{ padding: '16px', color: '#6b7280' }}>Detalles</th>
                <th style={{ padding: '16px', color: '#6b7280' }}>Stock</th>
                {role === 'admin' && <th style={{ padding: '16px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id_producto} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{p.nombre}</td>
                  <td style={{ padding: '16px', fontFamily: 'monospace', color: '#4b5563' }}>{p.sku}</td>
                  <td style={{ padding: '16px', fontSize: '0.9em' }}>
                     <span style={{ marginRight:'5px', background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:'10px' }}>{p.tipo_joyas?.nombre_tipo}</span>
                     <span style={{ background:'#f3f4f6', color:'#374151', padding:'2px 8px', borderRadius:'10px' }}>{p.material?.nombre_material}</span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{p.stock}</td>
                  
                  {role === 'admin' && (
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => openEdit(p)}
                        style={{ 
                          background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', 
                          cursor: 'pointer', padding: '5px 10px', fontSize: '1.2em' 
                        }}
                        title="Editar Stock"
                      >
                        ✏️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {role === 'admin' && (
        <CreateProductModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          catalogs={catalogs}
          productToEdit={editingItem}
          // 2. Pasamos las herramientas de SKU al modal
          skuPrevisualizado={skuPrevisualizado}
          previewSKU={previewSKU}
        />
      )}
    </div>
  );
}