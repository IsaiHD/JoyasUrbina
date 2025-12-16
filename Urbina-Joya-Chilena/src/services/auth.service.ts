import { supabase } from '../supabaseClient';
import type { LoginDTO } from '../types/auth.types';

export const authService = {
  // Tus métodos existentes...
  login: async (creds: LoginDTO) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },

  // --- VERSIÓN MEJORADA CON TIMEOUT ---
  updatePassword: async (newPassword: string) => {
    console.log("📡 [AuthService] Intentando cambiar contraseña...");
    
    // 1. Creamos una promesa que falla a los 5 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("⏳ Tiempo de espera agotado (Timeout). Supabase no respondió.")), 5000)
    );

    // 2. La llamada real a Supabase
    const updatePromise = supabase.auth.updateUser({ 
      password: newPassword 
    });

    // 3. Promise.race hace competir a las dos. Gana la que termine primero.
    const result: any = await Promise.race([updatePromise, timeoutPromise]);

    console.log("📡 [AuthService] Respuesta recibida:", result);

    if (result.error) throw new Error(result.error.message);
    return true;
  }
};