import { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventario.service';
import { generarSKU } from '../services/sku.service';
import type { Producto, Material, Piedra, TipoJoya, CreateProductDTO } from '../types/inventario.types';

export function useInventory() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [catalogs, setCatalogs] = useState<{
    materiales: Material[];
    piedras: Piedra[];
    tipos: TipoJoya[];
  }>({ materiales: [], piedras: [], tipos: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skuPrevisualizado, setSkuPrevisualizado] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => { loadData(); }, []);

  // Lógica dinámica para previsualizar el SKU
  const previewSKU = (idTipo: number, idMaterial: number) => {
    const tipo = catalogs.tipos.find((t) => t.id_tipo === Number(idTipo));
    const material = catalogs.materiales.find((m) => m.id_material === Number(idMaterial));
    const nuevoSku = generarSKU(tipo , material);
    setSkuPrevisualizado(generarSKU(tipo, material));
    console.log("SKU generado:", nuevoSku); // <--- MIRA TU CONSOLA (F12)
  };

  const addProduct = async (nuevo: CreateProductDTO) => {
    try {
      await inventoryService.create(nuevo);
      await loadData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateProduct = async (id: number, data: CreateProductDTO) => {
    try {
      await inventoryService.update(id, data);
      await loadData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { 
    products, catalogs, loading, error, addProduct, updateProduct, 
    skuPrevisualizado, previewSKU, refresh: loadData 
  };
}