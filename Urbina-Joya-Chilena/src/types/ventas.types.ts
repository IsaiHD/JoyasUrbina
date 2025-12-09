import type { Producto } from './inventario.types';

export interface CartItem extends Producto {
  cantidadVenta: number; // Cuántos está comprando de este producto
  subtotal: number;      // Precio * Cantidad (Asumiremos precio fijo por ahora o manual)
}

export interface MetodoPago {
  id_pago: number;
  tipo_pago: string;
}