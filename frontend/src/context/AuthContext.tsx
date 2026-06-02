import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export type Role = 'Administrador' | 'Auditor' | 'Analista' | 'Inversionista';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  groups: string[]; // Grupos devueltos por Django
  avatar?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await apiClient.get('/accounts/me/');
        const data = response.data;
        
        // Asignamos el rol basándonos en el primer grupo de Django
        //const userGroups: string[] = data.groups || [];
        //const mappedRole: Role = (userGroups.length > 0 ? userGroups[0] : 'Inversionista') as Role;
        const userGroups: string[] = data.group_names || [];

        const mappedRole: Role =
          (userGroups.length > 0
            ? userGroups[0]
            : 'Inversionista') as Role;

        const loggedUser: User = {
          //id: data.id?.toString(),
          id: data.id_usuario?.toString(),
          name: data.nombre || data.first_name || data.username || data.email,
          email: data.email,
          role: mappedRole,
          groups: userGroups,
          first_name: data.nombre || data.first_name,
          last_name: data.apellido_paterno || data.last_name,
        };

        setUser(loggedUser);
      } catch (error) {
        console.error("Error fetching user profile", error);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const loginWithTokens = async (access: string, refresh: string) => {
    setIsLoading(true);
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    await fetchMe();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    // Opcional: Podrías llamar al endpoint de logout del backend si existe para invalidar el refresh token
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      loginWithTokens,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
