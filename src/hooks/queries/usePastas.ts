/**
 * Hook React Query para buscar Pastas
 */

import { useQuery } from '@tanstack/react-query';
import { getPastas } from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';

export function usePastas() {
  return useQuery({
    queryKey: ['pastas'],
    queryFn: getPastas,
    staleTime: CACHE_TIMES.PASTAS,
    retry: 2,
  });
}
