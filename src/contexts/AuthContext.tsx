/**
 * Contexto de Autenticação
 *
 * Gerencia o estado global de autenticação do usuário
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '@/services/api.service';
import type { User } from '@/services/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Chave para armazenar dados no localStorage
const AUTH_STORAGE_KEY = 'gri_auth_user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fazer login
   */
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await api.login(username, password);

      if (!response.success || !response.user) {
        throw new Error(response.error || 'Credenciais inválidas');
      }

      // Salvar usuário no estado e localStorage
      setUser(response.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
    } catch (error) {
      // Re-lançar erro para o componente tratar
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer logout
   */
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
