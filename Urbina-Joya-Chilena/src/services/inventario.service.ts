import { supabase } from '../supabaseClient';
import type { Producto, CreateProductDTO, Material, Piedra, TipoJoya } from '../types/inventario.types';

export const inventoryService = {
  // ... (Tu método getAll déjalo tal cual) ...
  getAll: async (): Promise<Producto[]> => {
    // ... tu código existente ...
    const { data, error } = await supabase
      .from('producto')
      .select(`*, material (id_material, nombre_material), piedra (id_piedra, nombre_piedra), tipo_joyas (id_tipo, nombre_tipo)`)
      .order('id_producto', { ascending: false });

    if (error) throw new Error(error.message);
    
    return (data || []).map((item: any) => ({
      ...item,
      sku: item.sku || item.SKU || 'S/N'
    }));
  },

  // NUEVO: Método para crear
  create: async (product: CreateProductDTO): Promise<void> => {
    const { error } = await supabase.from('producto').insert({
      SKU: product.sku,      // Mapeamos a la columna exacta de la BD
      nombre: product.nombre,
      stock: product.stock,
      id_material: product.id_material,
      id_piedra: product.id_piedra,
      id_tipo: product.id_tipo // Asegúrate que en tu BD la columna sea id_tipo (o id_tipo_joya)
    });

    if (error) throw new Error(error.message);
  },

  // NUEVO: Métodos auxiliares para los Selects
  getCatalogs: async () => {
    // Hacemos las 3 peticiones en paralelo (Promesa.all) para que sea ultra rápido
    const [mat, pied, tip] = await Promise.all([
      supabase.from('material').select('*'),
      supabase.from('piedra').select('*'),
      supabase.from('tipo_joyas').select('*')
    ]);

    if (mat.error) throw new Error(mat.error.message);
    if (pied.error) throw new Error(pied.error.message);
    if (tip.error) throw new Error(tip.error.message);

    return {
      materiales: mat.data as Material[],
      piedras: pied.data as Piedra[],
      tipos: tip.data as TipoJoya[]
    };
  },

  // NUEVO: Método para Actualizar
  update: async (id: number, product: CreateProductDTO): Promise<void> => {
    const { error } = await supabase
      .from('producto')
      .update({
        SKU: product.sku,
        nombre: product.nombre,
        stock: product.stock,
        id_material: product.id_material,
        id_piedra: product.id_piedra,
        id_tipo: product.id_tipo
      })
      .eq('id_producto', id); // <--- IMPORTANTE: Solo actualiza este ID

    if (error) throw new Error(error.message);
  }
};