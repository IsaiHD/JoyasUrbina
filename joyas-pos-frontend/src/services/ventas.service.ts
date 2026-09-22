import type { CreateVentaDTO, Venta, VentaPayload } from '../types/ventas.types';

const API_URL = import.meta.env.VITE_API_URL || 'https://pos-backend-1036638430233.southamerica-west1.run.app';

// Helper para extraer el token JWT de la sesión activa de Supabase
const getAuthHeaders = () => {
  const sessionString = localStorage.getItem('sb-zrvilghkjblxpjdikfrp-auth-token');
  const session = sessionString ? JSON.parse(sessionString) : null;
  const token = session?.access_token || '';

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const vincularPagoConVenta = async (venta: VentaPayload, transaccionId: number) => {
  // Enviamos tanto la venta como el ID de transacción al endpoint unificado en Go
  const response = await fetch(`${API_URL}/api/v1/ventas/vincular`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      venta,
      transaccion_id: transaccionId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al vincular el pago con la venta');
  }

  return response.json();
};

export const ventasService = {
  // 1. Obtener todas las ventas desde Cloud Run
  async getVentas(): Promise<Venta[]> {
    const response = await fetch(`${API_URL}/api/v1/ventas`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener las ventas desde el backend');
    }

    const data = await response.json();
    return data || [];
  },

// 2. Registrar nueva venta directa (manual)
  async createVenta(venta: CreateVentaDTO): Promise<boolean> {
    const payload = {
      nombre_producto: venta.nombre_producto,
      sku_joya: venta.sku_joya || null,
      precio_venta: Number(venta.precio_venta),
      cantidad: Number(venta.cantidad || 1),
      es_reversible: Boolean(venta.es_reversible),
      id_metodo_pago: Number(venta.id_metodo_pago),
      id_tipo: Number(venta.id_tipo),
      id_material: Number(venta.id_material),
      id_piedra: venta.id_piedra && Number(venta.id_piedra) !== 0 ? Number(venta.id_piedra) : null,
      // Si no es reversible o es 0, enviamos null para evitar el error de foreign key
      id_piedra_secundaria: venta.es_reversible && venta.id_piedra_secundaria && Number(venta.id_piedra_secundaria) !== 0 
        ? Number(venta.id_piedra_secundaria) 
        : null,
      id_usuario: venta.id_usuario
    };

    const response = await fetch(`${API_URL}/api/v1/ventas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Error al registrar la venta');
    }

    return true;
  },

  // 3. Vincular pago Point
  vincularPagoConVenta,

// 4. Obtener catálogos para los selects del formulario adaptados al JSON de Go
  async getCatalogs() {
    const response = await fetch(`${API_URL}/api/v1/catalogos`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los catálogos');
    }

    const data = await response.json();

    return {
      tipos: (data.tipos || []).map((t: any) => ({
        id_tipo: t.id,
        nombre_tipo: t.nombre
      })),
      materiales: (data.materiales || []).map((m: any) => ({
        id_material: m.id,
        nombre_material: m.nombre
      })),
      piedras: (data.piedras || []).map((p: any) => ({
        id_piedra: p.id,
        nombre_piedra: p.nombre
      }))
    };
  },

  // 5. Obtener métodos de pago
  async getMetodosPago() {
    const response = await fetch(`${API_URL}/api/v1/metodos-pago`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener los métodos de pago');
    }

    const data = await response.json();
    return data || [];
  }
};