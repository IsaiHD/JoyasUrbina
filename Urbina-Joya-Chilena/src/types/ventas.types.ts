export interface Material { id_material: number; nombre_material: string; }
export interface TipoJoya { id_tipo: number; nombre_tipo: string; }
export interface Piedra { id_piedra: number; nombre_piedra: string; }
export interface MetodoPago { id_pago: number; tipo_pago: string; }

export interface Venta {
  id_venta: number;
  fecha_venta: string;
  nombre_producto: string;
  sku_joya?: string;
  precio_venta: number;
  cantidad: number;
  es_reversible: boolean;
  id_metodo_pago: number;
  id_tipo: number;
  id_material: number;
  id_piedra: number;
  id_piedra_secundaria?: number;
  id_usuario: string;
  
  // Relaciones que traeremos de Supabase para mostrar los nombres en la tabla
  tipo_joyas?: TipoJoya;
  material?: Material;
  piedra?: Piedra;
  piedra_secundaria?: Piedra;
  metodo_pago?: MetodoPago;
}

export interface CreateVentaDTO {
  nombre_producto: string;
  sku_joya?: string;
  precio_venta: number;
  cantidad: number;
  es_reversible: boolean;
  id_metodo_pago: number;
  id_tipo: number;
  id_material: number;
  id_piedra: number;
  id_piedra_secundaria?: number;
  id_usuario: string;
}