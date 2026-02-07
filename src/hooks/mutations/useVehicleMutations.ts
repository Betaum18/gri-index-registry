/**
 * Hooks de mutations para Veículos
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/services/api.service';
import type { VehicleInput, CreateResponse, DeleteResponse } from '@/services/types';

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse, Error, VehicleInput>({
    mutationFn: api.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation<DeleteResponse, Error, string>({
    mutationFn: api.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
