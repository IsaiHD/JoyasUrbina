import { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventario';
import { salesService } from '../services/ventas.service';
import type { CartItem, MetodoPago } from '../types/ventas.types';
import type { Producto } from '../types/inventario.types';

export default function SalesPage() {
  const { products, refresh } = useInventory(); // Reutilizamos el hook de inventario
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pagos, setPagos] = useState<MetodoPago[]>([]);
  const [selectedPago, setSelectedPago] = useState<number>(0);
  const [precioInput, setPrecioInput] = useState<number>(0); // Precio manual ya que no tenemos precio en la tabla producto aun
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingSale, setLoadingSale] = useState(false);

  // Cargar métodos de pago al iniciar
  useEffect(() => {
    salesService.getPaymentMethods().then(setPagos);
  }, []);

  // Agregar al carrito
  const addToCart = (product: Producto) => {
    // Verificar si ya existe
    const exists = cart.find(c => c.id_producto === product.id_producto);
    
    if (exists) {
      if (exists.cantidadVenta + 1 > product.stock) return alert("¡Sin stock suficiente!");
      setCart(cart.map(c => c.id_producto === product.id_producto 
        ? { ...c, cantidadVenta: c.cantidadVenta + 1, subtotal: (c.cantidadVenta + 1) * precioInput } 
        : c
      ));
    } else {
      if (product.stock < 1) return alert("Producto sin stock");
      // Nota: Como tu tabla producto no tiene precio, pedimos ingresarlo o asumimos 0.
      // Aquí uso un prompt simple por ahora o el precioInput global
      const precio = prompt(`Ingrese precio de venta para ${product.nombre}:`, "0");
      if (precio === null) return;
      
      setCart([...cart, { ...product, cantidadVenta: 1, subtotal: Number(precio) }]);
    }
  };

  // Remover del carrito
  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id_producto !== id));
  };

  // Finalizar Venta
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Carro vacío");
    if (!selectedPago) return alert("Seleccione método de pago");

    try {
      setLoadingSale(true);
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      await salesService.processSale(cart, selectedPago, total);
      
      alert("✅ Venta registrada con éxito");
      setCart([]); // Limpiar carro
      refresh(); // Recargar inventario para ver el stock actualizado
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoadingSale(false);
    }
  };

  // Filtrar productos por buscador
  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
      
      {/* COLUMNA IZQUIERDA: CATÁLOGO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input 
          placeholder="🔍 Buscar joya por nombre o SKU..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.1em' }}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', overflowY: 'auto' }}>
          {filteredProducts.map(p => (
            <div 
              key={p.id_producto} 
              onClick={() => addToCart(p)}
              style={{ 
                background: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', 
                border: '1px solid #e5e7eb', transition: 'transform 0.1s',
                opacity: p.stock === 0 ? 0.6 : 1
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{p.nombre}</div>
              <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{p.sku}</div>
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: p.stock > 0 ? '#166534' : 'red' }}>Stock: {p.stock}</span>
                <span style={{ color: '#2563eb' }}>+ Agregar</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: CARRITO (POS) */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0 }}>🛒 Carrito de Venta</h2>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {cart.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Selecciona productos...</p> : 
            cart.map(item => (
              <div key={item.id_producto} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{item.nombre}</div>
                  <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{item.cantidadVenta} x ${item.subtotal/item.cantidadVenta}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>${item.subtotal}</div>
                  <button onClick={() => removeFromCart(item.id_producto)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8em' }}>Eliminar</button>
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ borderTop: '2px solid #f3f4f6', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold', marginBottom: '15px' }}>
            <span>Total:</span>
            <span>${grandTotal}</span>
          </div>

          <select 
            value={selectedPago} 
            onChange={e => setSelectedPago(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            <option value={0}>-- Método de Pago --</option>
            {pagos.map(p => <option key={p.id_pago} value={p.id_pago}>{p.tipo_pago}</option>)}
          </select>

          <button 
            onClick={handleCheckout}
            disabled={loadingSale}
            style={{ 
              width: '100%', padding: '15px', background: '#111827', color: 'white', 
              border: 'none', borderRadius: '8px', fontSize: '1.1em', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            {loadingSale ? 'Procesando...' : '✅ CONFIRMAR VENTA'}
          </button>
        </div>
      </div>

    </div>
  );
}