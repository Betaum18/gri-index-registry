/**
 * Hook useCreateRegistration - Criar novo registro
 *
 * Usa React Query mutation para criar registro e invalidar cache
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import type { RegistrationInput, CreateRegistrationResponse } from '@/services/types';

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation<CreateRegistrationResponse, Error, RegistrationInput>({
    mutationFn: api.createRegistration,
    onSuccess: () => {
      // Invalidar cache de registros e estatísticas para forçar re-fetch
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
