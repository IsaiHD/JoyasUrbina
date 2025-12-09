import { createClient } from '@supabase/supabase-js';

// 1. Leemos las variables de entorno inyectadas por Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validación de Ingeniería (Fail Fast)
// Si por alguna razón el archivo .env no carga, detenemos la app aquí mismo.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '⚠️ Error Crítico: Faltan las variables de entorno de Supabase. \n' +
    'Revisa que tu archivo .env.local tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  );
}

// 3. Exportamos la instancia única (Singleton)
export const supabase = createClient(supabaseUrl, supabaseKey);