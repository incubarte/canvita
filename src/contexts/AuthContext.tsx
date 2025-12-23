import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Crear usuario admin por defecto si no existe
    const usersJson = localStorage.getItem('users') || '[]';
    const users = JSON.parse(usersJson);

    const adminExists = users.some((u: any) => u.email === 'admin@canvita.com');

    if (!adminExists) {
      const adminUser = {
        id: 'admin-default-id',
        email: 'admin@canvita.com',
        name: 'Administrador',
        role: 'admin',
        createdAt: new Date().toISOString(),
        password: 'admin123',
      };

      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log('✅ Usuario admin creado: admin@canvita.com / admin123');
    }

    // Cargar usuario desde localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Obtener usuarios existentes
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);

      // Verificar si el email ya existe
      if (users.some((u: any) => u.email === email)) {
        alert('Este email ya está registrado');
        return false;
      }

      // Crear nuevo usuario (por defecto es cliente)
      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        name,
        role: 'client', // Por defecto los nuevos usuarios son clientes
        createdAt: new Date().toISOString(),
      };

      // Guardar credenciales (en producción esto debería ser en backend con hash)
      users.push({ ...newUser, password });
      localStorage.setItem('users', JSON.stringify(users));

      // Establecer como usuario actual
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      return true;
    } catch (error) {
      console.error('Error al registrar:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);

      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      );

      if (!foundUser) {
        alert('Email o contraseña incorrectos');
        return false;
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Actualizar también en la lista de usuarios
    const usersJson = localStorage.getItem('users') || '[]';
    const users = JSON.parse(usersJson);
    const userIndex = users.findIndex((u: any) => u.id === user.id);

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem('users', JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
