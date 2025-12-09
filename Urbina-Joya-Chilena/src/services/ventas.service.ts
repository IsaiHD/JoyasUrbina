import { supabase } from '../supabaseClient';
import type { CartItem, MetodoPago } from '../types/ventas.types';

export const salesService = {
  // Obtener métodos de pago para el dropdown
  getPaymentMethods: async (): Promise<MetodoPago[]> => {
    const { data, error } = await supabase.from('metodo_pago').select('*');
    if (error) throw new Error(error.message);
    return data as MetodoPago[];
  },

  // Procesar la venta completa
  processSale: async (cart: CartItem[], idPago: number, totalTotal: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    // 1. Preparamos los datos para insertar en lote
    const ventasParaInsertar = cart.map(item => ({
      id_producto: item.id_producto,
      id_usuario: user.id,
      id_pago: idPago,
      cantidad: item.cantidadVenta,
      total_venta: item.subtotal // Ojo: aquí deberías tener precio unitario en producto, por ahora usaremos manual o un valor fijo
    }));

    // 2. Insertamos las ventas
    const { error: errorVenta } = await supabase.from('venta').insert(ventasParaInsertar);
    if (errorVenta) throw new Error("Error registrando venta: " + errorVenta.message);

    // 3. Descontamos Stock (Esto idealmente se hace con un RPC en BD, pero lo haremos aquí por simplicidad)
    // Hacemos un loop de actualizaciones
    for (const item of cart) {
      const nuevoStock = item.stock - item.cantidadVenta;
      await supabase
        .from('producto')
        .update({ stock: nuevoStock })
        .eq('id_producto', item.id_producto);
    }
  }
};