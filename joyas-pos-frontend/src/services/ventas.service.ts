import { supabase } from '../supabaseClient';
import type { CreateVentaDTO, Venta, VentaPayload } from '../types/ventas.types';

export const vincularPagoConVenta = async (venta: VentaPayload, transaccionId: number) => {
  // 1. Obtener usuario actual autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Insertar en la tabla venta
  const { data: ventaData, error: ventaError } = await supabase
    .from('venta')
    .insert([{
      nombre_producto: venta.nombre_producto,
      sku_joya: venta.sku_joya,
      precio_venta: venta.precio_venta,
      cantidad: venta.cantidad || 1,
      id_metodo_pago: venta.id_metodo_pago,
      id_tipo: venta.id_tipo,
      id_material: venta.id_material,
      id_piedra: venta.id_piedra,
      id_piedra_secundaria: venta.id_piedra_secundaria,
      id_usuario: user?.id,
      payment_id: venta.payment_id,
      cuotas: venta.cuotas
    }])
    .select()
    .single();

  if (ventaError) throw new Error(ventaError.message);

  // 3. Marcar la transacción como VINCULADA en la tabla intermedia
  const { error: txError } = await supabase
    .from('pago_transaccion')
    .update({ estado_vinculacion: 'VINCULADO' })
    .eq('id_transaccion', transaccionId);

  if (txError) throw new Error(txError.message);

  return ventaData;
};

export const ventasService = {
  // 1. Obtener todas las ventas (con sus relaciones)
  async getVentas(): Promise<Venta[]> {
    const { data, error } = await supabase
      .from('venta')
      .select(`
        *,
        tipo_joyas ( id_tipo, nombre_tipo ),
        material ( id_material, nombre_material ),
        piedra_principal:piedra!venta_id_piedra_fkey ( id_piedra, nombre_piedra ),
        piedra_secundaria:piedra!venta_id_piedra_secundaria_fkey ( id_piedra, nombre_piedra ),
        metodo_pago ( id_pago, tipo_pago )
      `)
      .order('fecha_venta', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as unknown as Venta[]) || [];
  },

  // 2. Registrar nueva venta directa (manual)
  async createVenta(venta: CreateVentaDTO): Promise<boolean> {
    const { error } = await supabase.from('venta').insert([venta]);
    if (error) throw new Error(error.message);
    return true;
  },

  // 3. Vincular pago Point
  vincularPagoConVenta,

  // 4. Obtener catálogos para los selects del formulario
  async getCatalogs() {
    const [tiposRes, materialesRes, piedrasRes] = await Promise.all([
      supabase.from('tipo_joyas').select('*').order('nombre_tipo'),
      supabase.from('material').select('*').order('nombre_material'),
      supabase.from('piedra').select('*').order('nombre_piedra')
    ]);

    if (tiposRes.error) throw new Error(tiposRes.error.message);
    if (materialesRes.error) throw new Error(materialesRes.error.message);
    if (piedrasRes.error) throw new Error(piedrasRes.error.message);

    return {
      tipos: tiposRes.data || [],
      materiales: materialesRes.data || [],
      piedras: piedrasRes.data || []
    };
  },

  // 5. Obtener métodos de pago
  async getMetodosPago() {
    const { data, error } = await supabase
      .from('metodo_pago')
      .select('*')
      .order('tipo_pago');

    if (error) throw new Error(error.message);
    return data || [];
  }
};