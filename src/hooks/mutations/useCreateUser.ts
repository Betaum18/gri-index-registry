/**
 * Hook React Query para criar usuário
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '@/services/api.service';
import type { UserInput } from '@/services/types';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserInput) => createUser(data),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
