import { supabase } from '../supabaseClient';
import type { LoginDTO } from '../types/auth.types';

export const authService = {
  login: async ({ email, password }: LoginDTO) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw new Error(error.message);
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
};