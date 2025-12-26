/**
 * Hook React Query para buscar usuários
 */

import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: CACHE_TIMES.USERS,
  });
}
