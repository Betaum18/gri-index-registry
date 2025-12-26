/**
 * Hook React Query para ativar/desativar usuário
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleUser } from '@/services/api.service';

export function useToggleUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleUser(id),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
