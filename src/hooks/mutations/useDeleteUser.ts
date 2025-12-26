/**
 * Hook React Query para deletar usuário
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteUser } from '@/services/api.service';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
