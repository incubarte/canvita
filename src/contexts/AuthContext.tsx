import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { AuthService } from '../services/authService';
import { supabase } from '../lib/supabase';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: 'admin' | 'client') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Variable global para evitar inicialización múltiple
let authInitialized = false;
let authInitPromise: Promise<void> | null = null;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Verificar sesión inicial
    const initAuth = async () => {
      try {
        // Si ya hay una inicialización en progreso, esperar a que termine
        if (authInitPromise) {
          console.log('⏳ Waiting for existing auth initialization...');
          await authInitPromise;
          console.log('✅ Existing initialization complete');

          // Después de esperar, cargar el usuario actual
          if (mounted) {
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
            setIsLoading(false);
          }
          return;
        }

        // Si ya se inicializó, solo cargar el usuario actual
        if (authInitialized) {
          console.log('♻️ Auth already initialized, loading current user...');
          const userData = await AuthService.getCurrentUser();
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
          }
          return;
        }
      } catch (error) {
        console.error('Error in secondary init:', error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Primera inicialización
      authInitPromise = (async () => {
        try {
          console.log('🔍 Checking for existing session...');

          // Crear un timeout de 5 segundos
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout after 5s')), 5000)
          );

          const sessionPromise = supabase.auth.getSession();

          console.log('⏱️ Waiting for session response...');
          const { data: { session }, error: sessionError } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;

          console.log('📥 Session response received');

          if (sessionError) {
            console.error('❌ Error getting session:', sessionError);
            throw sessionError;
          }

          if (session?.user) {
            console.log('👤 Session found for:', session.user.email);
            console.log('🔄 Loading user data from database...');

            const userDataPromise = AuthService.getCurrentUser();
            const userTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('User data timeout after 5s')), 5000)
            );

            const userData = await Promise.race([
              userDataPromise,
              userTimeoutPromise
            ]) as any;

            if (!userData) {
              console.error('❌ User data not found in database');
              return;
            }

            console.log('✅ User loaded:', { id: userData.id, role: userData.role, name: userData.name });
            if (mounted) {
              setUser(userData);
            }
          } else {
            console.log('❌ No session found');
          }
        } catch (error: any) {
          console.error('💥 Error in initAuth:', error);

          // Si hay timeout en la inicialización (no en login/register)
          if (error.message?.includes('timeout') && !user) {
            console.warn('⚠️ Session timeout detected, clearing Supabase storage...');
            try {
              // Limpiar solo las claves de Supabase
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-')) {
                  localStorage.removeItem(key);
                  console.log('🧹 Removed:', key);
                }
              });
              console.log('✅ Storage cleared');
            } catch (cleanupError) {
              console.error('Error cleaning storage:', cleanupError);
            }
          }
        } finally {
          authInitialized = true;
          authInitPromise = null;
          if (mounted) {
            console.log('✅ Auth initialization complete, setting isLoading = false');
            setIsLoading(false);
          }
        }
      })();

      await authInitPromise;
    };

    initAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      // Ignorar el evento inicial para evitar doble carga
      if (event === 'INITIAL_SESSION') {
        console.log('⏭️ Skipping INITIAL_SESSION event');
        return;
      }

      // Ignorar SIGNED_IN si ya cargamos este email
      if (event === 'SIGNED_IN' && session?.user && lastLoadedEmailRef.current === session.user.email) {
        console.log('⏭️ Skipping SIGNED_IN - user already loaded for', session.user.email);
        return;
      }

      if (session?.user) {
        console.log('👤 User signed in via event:', session.user.email);

        // Marcar que estamos cargando este email
        lastLoadedEmailRef.current = session.user.email;
        try {
          // Timeout de 3 segundos para getCurrentUser
          const userPromise = AuthService.getCurrentUser();
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
              console.warn('⚠️ getCurrentUser timeout, creating temporary user');
              resolve(null);
            }, 3000)
          );

          const userData = await Promise.race([userPromise, timeoutPromise]);

          if (userData && mounted) {
            console.log('✅ User data loaded via event:', userData.role);
            setUser(userData);
            setIsLoading(false); // ← AGREGué ESTO
          } else if (mounted) {
            // Si hay timeout, crear un usuario temporal con datos básicos
            console.warn('⚠️ Creating fallback user from session metadata');
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || 'Usuario',
              role: (session.user.user_metadata?.role || 'client') as 'admin' | 'client',
              createdAt: session.user.created_at || new Date().toISOString(),
            };
            console.log('✅ Fallback user created:', fallbackUser);
            setUser(fallbackUser);
          }
        } catch (error) {
          console.error('💥 Error loading user from event:', error);
          if (mounted) {
            // Aún con error, intentar crear usuario fallback
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || 'Usuario',
              role: (session.user.user_metadata?.role || 'client') as 'admin' | 'client',
              createdAt: session.user.created_at || new Date().toISOString(),
            };
            setUser(fallbackUser);
            setIsLoading(false);
          }
        }
      } else {
        console.log('👋 User signed out via event');
        lastLoadedEmailRef.current = null; // Reset ref
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up AuthProvider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const register = async (
    email: string,
    password: string,
    name: string,
    role: 'admin' | 'client' = 'client'
  ): Promise<boolean> => {
    try {
      console.log('📝 Starting registration for:', email, 'as', role);
      setIsLoading(true);
      const newUser = await AuthService.signUp(email, password, name, role);
      console.log('✅ Registration successful:', newUser);
      setUser(newUser);
      console.log('✅ User state updated, setting isLoading = false');
      return true;
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      alert(error.message || 'Error al registrarse');
      return false;
    } finally {
      console.log('🔄 Register finally block, setting isLoading = false');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Starting login for:', email);
      setIsLoading(true);

      // Si ya estamos logueados con ese email, solo confirmar
      if (user && user.email === email) {
        console.log('✅ Already logged in as', email);
        setIsLoading(false);
        return true;
      }

      // Intentar login
      console.log('🔐 Calling signInWithPassword...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setIsLoading(false);
        alert(error.message || 'Email o contraseña incorrectos');
        return false;
      }

      console.log('✅ signInWithPassword completed successfully');
      console.log('⏳ Waiting 2 seconds for onAuthStateChange to set user...');

      // Esperar 2 segundos para que onAuthStateChange procese el evento
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Login process complete, onAuthStateChange will handle user state');
      // NO setear isLoading aquí - lo hará onAuthStateChange o el check del usuario
      return true;

    } catch (error: any) {
      console.error('❌ Error en login:', error);
      setIsLoading(false);
      alert(error.message || 'Error al iniciar sesión');
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await AuthService.updateUser(user.id, updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
