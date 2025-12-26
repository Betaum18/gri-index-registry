/**
 * Hook useStats - Buscar estatísticas para o dashboard
 *
 * Usa React Query para buscar e cachear estatísticas
 */

import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';
import type { Stats } from '@/services/types';

export function useStats() {
  return useQuery<Stats, Error>({
    queryKey: ['stats'],
    queryFn: api.getStats,
    staleTime: CACHE_TIMES.STATS,
    retry: 2,
  });
}
