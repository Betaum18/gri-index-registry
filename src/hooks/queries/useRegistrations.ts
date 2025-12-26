/**
 * Hook useRegistrations - Buscar todos os registros
 *
 * Usa React Query para buscar e cachear registros
 */

import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';
import type { Registration } from '@/services/types';

export function useRegistrations() {
  return useQuery<Registration[], Error>({
    queryKey: ['registrations'],
    queryFn: api.getRegistrations,
    staleTime: CACHE_TIMES.REGISTRATIONS,
    retry: 2,
  });
}
