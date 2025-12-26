/**
 * Hook React Query para buscar QRUs
 */

import { useQuery } from '@tanstack/react-query';
import { getQRUs } from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';

export function useQRUs() {
  return useQuery({
    queryKey: ['qrus'],
    queryFn: getQRUs,
    staleTime: CACHE_TIMES.QRUS,
    retry: 2,
  });
}
