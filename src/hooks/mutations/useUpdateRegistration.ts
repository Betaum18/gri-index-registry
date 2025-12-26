/**
 * Hook React Query para atualizar registro
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRegistration } from '@/services/api.service';
import type { RegistrationInput } from '@/services/types';

export function useUpdateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RegistrationInput> & { id: string }) => updateRegistration(data),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
  });
}
