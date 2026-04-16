import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import type { ZonaVermelhaInput, ZonaVermelhaUpdateInput, CreateResponse, DeleteResponse } from '@/services/types';

export function useCreateZonaVermelha() {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse & { data_cadastro?: string }, Error, ZonaVermelhaInput>({
    mutationFn: api.createZonaVermelha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas-vermelhas'] });
    },
  });
}

export function useUpdateZonaVermelha() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, ZonaVermelhaUpdateInput>({
    mutationFn: api.updateZonaVermelha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas-vermelhas'] });
    },
  });
}

export function useDeleteZonaVermelha() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, string>({
    mutationFn: api.deleteZonaVermelha,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas-vermelhas'] });
    },
  });
}
