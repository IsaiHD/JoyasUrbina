import { useState, useEffect } from 'react';
import { ventasService } from '../services/ventas.service';
import type { Venta, CreateVentaDTO, Material, Piedra, TipoJoya, MetodoPago } from '../types/ventas.types';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [catalogs, setCatalogs] = useState<{ materiales: Material[]; piedras: Piedra[]; tipos: TipoJoya[] }>({
    materiales: [], piedras: [], tipos: []
  });
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ventasData, catalogsData, metodosData] = await Promise.all([
        ventasService.getVentas(),
        ventasService.getCatalogs(),
        ventasService.getMetodosPago()
      ]);
      setVentas(ventasData);
      setCatalogs(catalogsData);
      setMetodosPago(metodosData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar todo al inicio
  useEffect(() => {
    fetchData();
  }, []);

  const addVenta = async (data: CreateVentaDTO) => {
    try {
      await ventasService.createVenta(data);
      await fetchData(); // Recargamos la lista automáticamente
      return true;
    } catch (err: any) {
      alert("Error: " + err.message);
      return false;
    }
  };

  return { 
    ventas, 
    catalogs, 
    metodosPago, 
    loading, 
    error, 
    addVenta, 
    refreshVentas: fetchData 
  };
}