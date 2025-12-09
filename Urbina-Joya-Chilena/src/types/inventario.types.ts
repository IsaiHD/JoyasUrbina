// Definimos las entidades auxiliares primero
export interface Material {
  id_material: number;
  nombre_material: string;
}

export interface Piedra {
  id_piedra: number;
  nombre_piedra: string;
}

export interface TipoJoya {
  id_tipo: number;
  nombre_tipo: string;
}

// La entidad principal que usará la Tabla
export interface Producto {
  id_producto: number;
  sku: string;
  nombre: string;
  stock: number;
  // Supabase nos devolverá objetos anidados (Joins)
  material: Material | null;
  piedra: Piedra | null;
  tipo_joyas: TipoJoya | null; // Ojo con el nombre exacto de la tabla en tu BD
}



// DTO: Lo que enviamos para CREAR un nuevo producto
export interface CreateProductDTO {
  sku: string;
  nombre: string;
  stock: number;
  id_material: number;
  id_tipo: number;
  id_piedra: number;
}