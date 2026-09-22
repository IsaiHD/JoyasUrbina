// Asegúrate de que la ruta a tu supabaseClient sea la correcta
import { supabase } from '../supabaseClient'; // o donde lo tengas
import type { CreateVentaDTO, Venta } from '../types/ventas.types';

export const ventasService = {
  // 1. Obtener todas las ventas (con sus nombres relacionados)
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
    return data || [];
  },
  
  // 2. Registrar nueva venta
  async createVenta(venta: CreateVentaDTO): Promise<boolean> {
    const { error } = await supabase.from('venta').insert([venta]);
    if (error) throw new Error(error.message);
    return true;
  },

  // 3. Obtener los catálogos para el formulario
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

  // 4. Obtener métodos de pago
  async getMetodosPago() {
    const { data, error } = await supabase
      .from('metodo_pago')
      .select('*')
      .order('tipo_pago');
      
    if (error) throw new Error(error.message);
    return data || [];
  }
};