/**
 * Hook usePassportCheck - Verificar se passaporte já existe
 *
 * Usa React Query para verificar duplicação de passaporte
 * Debounced para evitar muitas requisições
 */

import { useQuery } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import { CACHE_TIMES } from '@/config/api.config';

export function usePassportCheck(passport: string) {
  return useQuery<boolean, Error>({
    queryKey: ['passport-check', passport],
    queryFn: () => api.checkPassportExists(passport),
    staleTime: CACHE_TIMES.PASSPORT_CHECK,
    enabled: passport.length >= 3, // Só verificar se tiver pelo menos 3 caracteres
    retry: 1,
  });
}
