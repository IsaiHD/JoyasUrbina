// src/services/sku.service.ts
import type { TipoJoya, Material } from '../types/inventario.types';

export const generarSKU = (
  tipo: TipoJoya | undefined,
  material: Material | undefined
): string => {
  if (!tipo || !material) return 'GEN-GEN-000';
  
  const prefijoTipo = tipo.nombre_tipo.substring(0, 3).toUpperCase();
  const prefijoMat = material.nombre_material.substring(0, 4).toUpperCase();
  const random = Math.floor(Math.random() * 900) + 100;
  
  return `${prefijoTipo}-${prefijoMat}-${random}`;
};