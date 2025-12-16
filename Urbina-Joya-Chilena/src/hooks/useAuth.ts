import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { authService } from '../services/auth.service';
import type { LoginDTO } from '../types/auth.types';

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar bucles de peticiones
  const lastProcessedId = useRef<string | null>(null);

  // Función Fetch RAW corregida: Ahora pide el TOKEN DE USUARIO
  const fetchUserData = async (userId: string, token: string) => {
    // Si ya procesamos este ID, salimos
    if (lastProcessedId.current === userId) return;

    lastProcessedId.current = userId;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const url = `${supabaseUrl}/rest/v1/usuario?id_usuario=eq.${userId}&select=rol,nombre`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`, // <--- AQUÍ ESTÁ EL CAMBIO CLAVE
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const json = await response.json();
        
        if (json && json.length > 0) {
          const user = json[0];
          setRole(user.rol);
          setUserName(user.nombre);
        } else {
          setRole(null);
          setUserName(null);
        }
      } else {
        console.error("Error HTTP:", response.statusText);
        // Permitimos reintentar si falló la red
        lastProcessedId.current = null; 
      }

    } catch (rawError) {
      console.error("Error conexión RAW:", rawError);
      lastProcessedId.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user && currentSession?.access_token) {
        // Pasamos el ID y el TOKEN real
        await fetchUserData(currentSession.user.id, currentSession.access_token);
      } else {
        setRole(null);
        setUserName(null);
        lastProcessedId.current = null;
      }

      setLoading(false);
    });

    const timer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 4000); 

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async (creds: LoginDTO) => {
    setLoading(true);
    lastProcessedId.current = null;
    try {
      await authService.login(creds);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    lastProcessedId.current = null;
    await authService.logout();
  };

  return { session, role, userName, loading, error, login, logout };
}