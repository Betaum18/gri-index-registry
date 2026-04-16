/**
 * Hooks React Query para mutations de Pastas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPasta, updatePasta, deletePasta, togglePasta } from '@/services/api.service';
import type { PastaInput } from '@/services/types';

/**
 * Hook para criar nova Pasta
 */
export function useCreatePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PastaInput) => createPasta(data),
    onSuccess: () => {
      // Invalidar cache para forçar refresh
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook para atualizar Pasta
 */
export function useUpdatePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; nome: string }) => updatePasta(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
  });
}

/**
 * Hook para deletar Pasta
 */
export function useDeletePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePasta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
  });
}

/**
 * Hook para ativar/desativar Pasta
 */
export function useTogglePasta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePasta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastas'] });
    },
  });
}
