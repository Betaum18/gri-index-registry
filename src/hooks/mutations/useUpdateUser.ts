/**
 * Hook React Query para atualizar usuário
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser } from '@/services/api.service';
import type { UserUpdateInput } from '@/services/types';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateInput & { id: string }) => updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
