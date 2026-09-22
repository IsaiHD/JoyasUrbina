import { useState, useEffect, useCallback } from 'react';
import { ventasService } from '../services/ventas.service';
import type { Venta, CreateVentaDTO } from '../types/ventas.types';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [catalogs, setCatalogs] = useState<{ tipos: any[]; materiales: any[]; piedras: any[] }>({
    tipos: [],
    materiales: [],
    piedras: []
  });
  const [metodosPago, setMetodosPago] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ventasData, catalogsData, metodosData] = await Promise.all([
        ventasService.getVentas(),
        ventasService.getCatalogs(),
        ventasService.getMetodosPago()
      ]);

      setVentas(ventasData);
      setCatalogs(catalogsData);
      setMetodosPago(metodosData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addVenta = async (venta: CreateVentaDTO) => {
    try {
      await ventasService.createVenta(venta);
      await fetchData(); // Recargar la lista tras registrar
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    ventas,
    catalogs,
    metodosPago,
    loading,
    error,
    addVenta,
    refetch: fetchData
  };
}