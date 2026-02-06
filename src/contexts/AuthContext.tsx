/**
 * Contexto de Autenticação
 *
 * Gerencia o estado global de autenticação do usuário e permissões
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as api from '@/services/api.service';
import type { User, UserPermissions, Pasta } from '@/services/types';

type PermissionKey = keyof Omit<UserPermissions, 'pastas_acesso'>;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  // Helpers de permissão
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessPasta: (pastaId: string) => boolean;
  getAllowedPastas: (allPastas: Pasta[]) => Pasta[];
  isAdmin: () => boolean;
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

  /**
   * Verifica se o usuário tem os campos de permissão definidos
   * Usuários antigos (sem esses campos) são tratados como tendo acesso total
   */
  const hasPermissionFields = useCallback((): boolean => {
    if (!user) return false;
    return 'is_admin' in user;
  }, [user]);

  /**
   * Verificar se usuário é admin
   * Usuários antigos (sem campos de permissão) são tratados como admin
   */
  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    // Usuário antigo sem campos de permissão = acesso total
    if (!hasPermissionFields()) return true;
    return user.is_admin === true;
  }, [user, hasPermissionFields]);

  /**
   * Verificar se usuário tem uma permissão específica
   * Admin sempre tem todas as permissões
   * Usuários antigos (sem campos de permissão) têm todas as permissões
   */
  const hasPermission = useCallback((permission: PermissionKey): boolean => {
    if (!user) return false;
    // Usuário antigo sem campos de permissão = acesso total
    if (!hasPermissionFields()) return true;
    if (user.is_admin) return true;
    return user[permission] === true;
  }, [user, hasPermissionFields]);

  /**
   * Verificar se usuário pode acessar uma pasta específica
   * Admin pode acessar todas as pastas
   * Usuários antigos (sem campos de permissão) podem acessar todas
   */
  const canAccessPasta = useCallback((pastaId: string): boolean => {
    if (!user) return false;
    // Usuário antigo sem campos de permissão = acesso total
    if (!hasPermissionFields()) return true;
    if (user.is_admin) return true;
    if (!user.pastas_acesso || !Array.isArray(user.pastas_acesso)) return false;
    return user.pastas_acesso.includes(pastaId);
  }, [user, hasPermissionFields]);

  /**
   * Filtrar lista de pastas para retornar apenas as que o usuário tem acesso
   * Admin vê todas as pastas
   * Usuários antigos (sem campos de permissão) veem todas
   */
  const getAllowedPastas = useCallback((allPastas: Pasta[]): Pasta[] => {
    if (!user) return [];
    // Usuário antigo sem campos de permissão = acesso total
    if (!hasPermissionFields()) return allPastas;
    if (user.is_admin) return allPastas;
    if (!user.pastas_acesso || !Array.isArray(user.pastas_acesso)) return [];
    return allPastas.filter(p => user.pastas_acesso.includes(p.id));
  }, [user, hasPermissionFields]);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    hasPermission,
    canAccessPasta,
    getAllowedPastas,
    isAdmin,
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
