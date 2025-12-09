import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authService } from '../services/auth.service';
import type { LoginDTO } from '../types/auth.types';

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // <--- NUEVO ESTADO
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para buscar el rol en la tabla 'usuario'
  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('usuario')
      .select('rol')
      .eq('id_usuario', userId)
      .single();
    
    if (data) setRole(data.rol);
  };

  useEffect(() => {
    // 1. Carga inicial
    authService.getSession().then((currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) fetchRole(currentSession.user.id); // <--- Buscamos rol
      setLoading(false);
    });

    // 2. Listener de cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (creds: LoginDTO) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(creds);
      if (data.user) await fetchRole(data.user.id); // <--- Buscamos rol al loguear
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setRole(null);
  };

  // Exportamos 'role' para que la App lo use
  return { session, role, loading, error, login, logout };
}