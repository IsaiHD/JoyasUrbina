import { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventario.service';
import type { Producto, Material, Piedra, TipoJoya, CreateProductDTO } from '../types/inventario.types';

export function useInventory() {
  const [products, setProducts] = useState<Producto[]>([]);
  
  // Estados para los catálogos (Dropdowns)
  const [catalogs, setCatalogs] = useState<{
    materiales: Material[];
    piedras: Piedra[];
    tipos: TipoJoya[];
  }>({ materiales: [], piedras: [], tipos: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar TODO (Productos + Catálogos)
  const loadData = async () => {
    try {
      setLoading(true);
      // Ejecutamos ambas cargas en paralelo
      const [listaProductos, listaCatalogos] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getCatalogs()
      ]);

      setProducts(listaProductos);
      setCatalogs(listaCatalogos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función para agregar producto
  const addProduct = async (nuevo: CreateProductDTO) => {
    try {
      setLoading(true);
      await inventoryService.create(nuevo);
      await loadData(); // Recargamos la lista para ver el nuevo producto
      return true; // Retornamos true si salió bien
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // NUEVO: Función para editar
  const updateProduct = async (id: number, data: CreateProductDTO) => {
    try {
      setLoading(true);
      await inventoryService.update(id, data);
      await loadData(); // Recargamos la lista para ver el cambio
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    products, 
    catalogs, 
    loading, 
    error, 
    addProduct, 
    updateProduct, // <--- EXPORTAMOS LA NUEVA FUNCIÓN
    refresh: loadData 
  };
}