export interface Material { id_material: number; nombre_material: string; }
export interface TipoJoya { id_tipo: number; nombre_tipo: string; }
export interface Piedra { id_piedra: number; nombre_piedra: string; }
export interface MetodoPago { id_pago: number; tipo_pago: string; }

export interface Material { 
  id_material: number; 
  nombre_material: string; 
}

export interface TipoJoya { 
  id_tipo: number; 
  nombre_tipo: string; 
}

export interface Piedra { 
  id_piedra: number; 
  nombre_piedra: string; 
}

export interface MetodoPago { 
  id_pago: number; 
  tipo_pago: string; 
}

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
  id_piedra: number | null;
  id_piedra_secundaria?: number | null;
  id_usuario: string;
  payment_id?: string;
  cuotas?: number;
  
  // Relaciones que vienen de Supabase
  tipo_joyas?: TipoJoya;
  material?: Material;
  piedra?: Piedra;
  piedra_principal?: Piedra; 
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
  id_piedra: number | null;
  id_piedra_secundaria?: number | null;
  id_usuario: string;
}

export interface PagoTransaccion {
  id_transaccion: number;
  payment_id: string;
  monto: number;
  cuotas: number;
  monto_cuota: number;
  monto_liquido: number;
  metodo_pago: string;
  tipo_tarjeta: string;
  estado_vinculacion: 'PENDIENTE' | 'VINCULADO';
  creado_en: string;
}

export interface VentaPayload {
  nombre_producto: string;
  sku_joya?: string;
  precio_venta: number;
  cantidad: number;
  id_metodo_pago: number;
  id_tipo?: number;
  id_material?: number;
  id_piedra?: number;
  id_piedra_secundaria?: number;
  payment_id: string;
  cuotas: number;
}

// ============================================================================
// TIPOS NUEVOS PARA VINCULACIÓN MULTI-PRODUCTO (BATCH)
// ============================================================================

export interface ItemVentaBatch {
  nombre_producto: string;
  sku_joya?: string;
  precio_venta: number;
  cantidad: number;
  es_reversible?: boolean;
  id_tipo?: number;
  id_material?: number;
  id_piedra?: number | null;
  id_piedra_secundaria?: number | null;
}

export interface VincularPagoBatchDTO {
  payment_id: string;
  id_metodo_pago: number;
  cuotas: number;
  items: ItemVentaBatch[];
}