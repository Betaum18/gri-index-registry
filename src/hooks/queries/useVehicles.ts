/**
 * Hook useVehicles - Buscar todos os veículos
 */

import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';
import type { Vehicle } from '@/services/types';

export function useVehicles() {
  return useQuery<Vehicle[], Error>({
    queryKey: ['vehicles'],
    queryFn: api.getVehicles,
    staleTime: CACHE_TIMES.VEHICLES,
    retry: 2,
  });
}
