import { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventario';
import { salesService } from '../services/ventas.service';
import PriceModal from '../components/PrecioModal'; 
import SuccessModal from '../components/CompraExitoModal'; // <--- 1. IMPORTAR NUEVO MODAL
import type { CartItem, MetodoPago } from '../types/ventas.types';
import type { Producto } from '../types/inventario.types';

export default function SalesPage() {
  const { products, refresh } = useInventory();
  
  // Estados principales
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pagos, setPagos] = useState<MetodoPago[]>([]);
  const [selectedPago, setSelectedPago] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSale, setLoadingSale] = useState(false);

  // Estados para los Modales
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Producto | null>(null);
  const [showSuccess, setShowSuccess] = useState(false); // <--- 2. ESTADO PARA MODAL ÉXITO

  useEffect(() => {
    salesService.getPaymentMethods().then(setPagos);
  }, []);

  // --- LÓGICA AL HACER CLIC EN UN PRODUCTO ---
  const handleProductClick = (product: Producto) => {
    const exists = cart.find(c => c.id_producto === product.id_producto);
    
    if (exists) {
      if (exists.cantidadVenta + 1 > product.stock) {
        return alert(`¡Solo quedan ${product.stock} unidades!`);
      }
      const unitPrice = exists.subtotal / exists.cantidadVenta;

      setCart(cart.map(c => c.id_producto === product.id_producto 
        ? { ...c, cantidadVenta: c.cantidadVenta + 1, subtotal: (c.cantidadVenta + 1) * unitPrice } 
        : c
      ));

    } else {
      if (product.stock < 1) return alert("Producto sin stock");
      setPendingProduct(product);
      setIsPriceModalOpen(true);
    }
  };

  // --- LÓGICA CUANDO EL MODAL CONFIRMA EL PRECIO ---
  const handlePriceConfirm = (price: number) => {
    if (pendingProduct) {
      setCart([...cart, { ...pendingProduct, cantidadVenta: 1, subtotal: price }]);
      setPendingProduct(null);
      setIsPriceModalOpen(false);
    }
  };

  // Remover del carrito
  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id_producto !== id));
  };

  // --- 3. FINALIZAR VENTA (MODIFICADO) ---
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Carro vacío");
    if (!selectedPago) return alert("Seleccione método de pago");

    try {
      setLoadingSale(true);
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      await salesService.processSale(cart, selectedPago, total);
      
      // EXITO:
      setCart([]);
      setSelectedPago(0);
      refresh(); 
      
      // En lugar de alert, mostramos el modal bonito
      setShowSuccess(true); // <--- ACTIVAR MODAL

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoadingSale(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
      
      {/* COLUMNA IZQUIERDA: CATÁLOGO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        <input 
          placeholder="🔍 Buscar joya por nombre o SKU..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1em', width: '100%', boxSizing: 'border-box' }}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto', paddingRight: '5px' }}>
          {filteredProducts.map(p => (
            <div 
              key={p.id_producto} 
              onClick={() => handleProductClick(p)}
              style={{ 
                background: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', 
                border: '1px solid #e5e7eb', transition: 'transform 0.1s, box-shadow 0.1s',
                opacity: p.stock === 0 ? 0.6 : 1,
                position: 'relative',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{p.nombre}</div>
                <div style={{ fontSize: '0.8em', color: '#6b7280', marginBottom: '8px' }}>{p.sku}</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: p.stock > 0 ? '#166534' : '#ef4444', fontSize: '0.85em', background: p.stock > 0 ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                  {p.stock} un.
                </span>
                <span style={{ 
                  color: 'white', background: '#3b82f6', padding: '6px 12px', 
                  borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold' 
                }}>
                  +
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: CARRITO */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.05)', height: '100%', boxSizing: 'border-box' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #f3f4f6', paddingBottom: '15px' }}>🛒 Carrito</h2>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', gap: '10px' }}>
              <span style={{ fontSize: '2em' }}>🛍️</span>
              <p>Selecciona productos...</p>
            </div>
          ) : 
            cart.map(item => (
              <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>{item.nombre}</div>
                  <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                    {item.cantidadVenta} x ${(item.subtotal / item.cantidadVenta).toLocaleString('es-CL')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#111827' }}>${item.subtotal.toLocaleString('es-CL')}</div>
                  <button onClick={() => removeFromCart(item.id_producto)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold' }}>
                    ELIMINAR
                  </button>
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4em', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
            <span>Total</span>
            <span>${grandTotal.toLocaleString('es-CL')}</span>
          </div>

          <select 
            value={selectedPago} 
            onChange={e => setSelectedPago(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1em', backgroundColor: '#f9fafb' }}
          >
            <option value={0}>Selecciona Método de Pago</option>
            {pagos.map(p => <option key={p.id_pago} value={p.id_pago}>{p.tipo_pago}</option>)}
          </select>

          <button 
            onClick={handleCheckout}
            disabled={loadingSale}
            style={{ 
              width: '100%', padding: '15px', background: '#111827', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: loadingSale ? 'not-allowed' : 'pointer',
              opacity: loadingSale ? 0.7 : 1, transition: 'background 0.2s'
            }}
          >
            {loadingSale ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>

      {/* --- RENDERIZADO DE MODALES --- */}

      <PriceModal 
        isOpen={isPriceModalOpen}
        onClose={() => { setIsPriceModalOpen(false); setPendingProduct(null); }}
        onConfirm={handlePriceConfirm}
        productName={pendingProduct?.nombre || ''}
      />

      {/* Nuevo Modal de Éxito */}
      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Venta registrada y stock actualizado."
      />

    </div>
  );
}