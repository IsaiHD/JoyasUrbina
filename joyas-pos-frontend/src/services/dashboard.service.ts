const API_URL = import.meta.env.VITE_API_URL || 'https://pos-backend-1036638430233.southamerica-west1.run.app';

// Helper para extraer el token JWT de la sesión activa de Supabase en el navegador
const getAuthHeaders = () => {
  const sessionString = localStorage.getItem('sb-zrvilghkjblxpjdikfrp-auth-token');
  const session = sessionString ? JSON.parse(sessionString) : null;
  const token = session?.access_token || '';

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const dashboardService = {
  async getStats() {
    // Petición a tu API en Go (Cloud Run)
    const response = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener las estadísticas del dashboard desde el backend');
    }

    const data = await response.json();

    // Devolvemos exactamente lo que la API de Go procesó y estructuró
    return {
      revenueToday: data.revenueToday || 0,
      salesCount: data.salesCount || 0,
      salesLast7Days: data.salesLast7Days || [],
      productNamesList: data.productNamesList || []
    };
  }
};