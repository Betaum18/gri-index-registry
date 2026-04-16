/**
 * Hooks React Query para mutations de QRUs
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQRU, deleteQRU, toggleQRU } from '@/services/api.service';
import type { QRUInput } from '@/services/types';

/**
 * Hook para criar novo QRU
 */
export function useCreateQRU() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QRUInput) => createQRU(data),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['qrus'] });
    },
  });
}

/**
 * Hook para deletar QRU
 */
export function useDeleteQRU() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQRU(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrus'] });
    },
  });
}

/**
 * Hook para ativar/desativar QRU
 */
export function useToggleQRU() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleQRU(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrus'] });
    },
  });
}
