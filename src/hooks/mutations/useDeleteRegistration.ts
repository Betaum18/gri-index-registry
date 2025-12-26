/**
 * Hook useDeleteRegistration - Deletar registro
 *
 * Usa React Query mutation para deletar registro e invalidar cache
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import type { DeleteResponse } from '@/services/types';

export function useDeleteRegistration() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, string>({
    mutationFn: api.deleteRegistration,
    onSuccess: () => {
      // Invalidar cache de registros e estatísticas para forçar re-fetch
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
