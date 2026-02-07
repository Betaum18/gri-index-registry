/**
 * Serviço de API - Comunicação com Google Apps Script
 *
 * Centraliza todas as chamadas HTTP ao backend
 */

import { APPS_SCRIPT_URL, API_ACTIONS, API_TIMEOUT } from '@/config/api.config';
import type {
  Registration,
  RegistrationInput,
  Stats,
  LoginResponse,
  CreateRegistrationResponse,
  DeleteResponse,
  PassportCheckResponse,
  ApiError,
  QRU,
  QRUInput,
  Pasta,
  PastaInput,
  CreateResponse,
  ToggleResponse,
  UserAdmin,
  UserInput,
  UserUpdateInput,
  Vehicle,
  VehicleInput,
} from './types';

/**
 * Erro customizado para API
 */
export class ApiException extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Helper: Fazer requisição GET
 */
async function get<T>(action: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  // Adicionar parâmetros extras
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiException(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Verificar se há erro na resposta
    if (data.error) {
      throw new ApiException(data.error, data);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiException) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiException('Requisição expirou. Tente novamente.');
      }
      throw new ApiException(error.message, error);
    }

    throw new ApiException('Erro desconhecido ao fazer requisição');
  }
}

/**
 * Helper: Fazer requisição POST (usando GET por causa do CORS do Apps Script)
 */
async function post<T>(action: string, data: unknown): Promise<T> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('data', JSON.stringify(data));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiException(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    // Verificar se há erro na resposta
    if (responseData.error) {
      throw new ApiException(responseData.error, responseData);
    }

    return responseData as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiException) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiException('Requisição expirou. Tente novamente.');
      }
      throw new ApiException(error.message, error);
    }

    throw new ApiException('Erro desconhecido ao fazer requisição');
  }
}

// ===== ENDPOINTS DE AUTENTICAÇÃO =====

/**
 * Fazer login
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>(API_ACTIONS.LOGIN, { username, password });
}

// ===== ENDPOINTS DE REGISTROS =====

/**
 * Buscar todos os registros
 */
export async function getRegistrations(): Promise<Registration[]> {
  return get<Registration[]>(API_ACTIONS.GET_REGISTRATIONS);
}

/**
 * Criar novo registro
 */
export async function createRegistration(
  input: RegistrationInput
): Promise<CreateRegistrationResponse> {
  return post<CreateRegistrationResponse>(API_ACTIONS.CREATE_REGISTRATION, input);
}

/**
 * Atualizar registro
 */
export async function updateRegistration(data: Partial<RegistrationInput> & { id: string }): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.UPDATE_REGISTRATION, data);
}

/**
 * Deletar registro
 */
export async function deleteRegistration(id: string): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.DELETE_REGISTRATION, { id });
}

/**
 * Verificar se passaporte já existe
 */
export async function checkPassportExists(passport: string): Promise<boolean> {
  if (!passport || passport.trim() === '') {
    return false;
  }

  const response = await get<PassportCheckResponse>(API_ACTIONS.CHECK_PASSPORT, {
    passport: passport.trim(),
  });

  return response.exists;
}

// ===== ENDPOINTS DE ESTATÍSTICAS =====

/**
 * Buscar estatísticas para o dashboard
 */
export async function getStats(): Promise<Stats> {
  return get<Stats>(API_ACTIONS.GET_STATS);
}

// ===== ENDPOINTS DE QRUs =====

/**
 * Buscar todos os QRUs
 */
export async function getQRUs(): Promise<QRU[]> {
  return get<QRU[]>(API_ACTIONS.GET_QRUS);
}

/**
 * Criar novo QRU
 */
export async function createQRU(input: QRUInput): Promise<CreateResponse> {
  return post<CreateResponse>(API_ACTIONS.CREATE_QRU, input);
}

/**
 * Deletar QRU
 */
export async function deleteQRU(id: string): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.DELETE_QRU, { id });
}

/**
 * Ativar/desativar QRU
 */
export async function toggleQRU(id: string): Promise<ToggleResponse> {
  return post<ToggleResponse>(API_ACTIONS.TOGGLE_QRU, { id });
}

// ===== ENDPOINTS DE PASTAS =====

/**
 * Buscar todas as Pastas
 */
export async function getPastas(): Promise<Pasta[]> {
  return get<Pasta[]>(API_ACTIONS.GET_PASTAS);
}

/**
 * Criar nova Pasta
 */
export async function createPasta(input: PastaInput): Promise<CreateResponse> {
  return post<CreateResponse>(API_ACTIONS.CREATE_PASTA, input);
}

/**
 * Deletar Pasta
 */
export async function deletePasta(id: string): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.DELETE_PASTA, { id });
}

/**
 * Ativar/desativar Pasta
 */
export async function togglePasta(id: string): Promise<ToggleResponse> {
  return post<ToggleResponse>(API_ACTIONS.TOGGLE_PASTA, { id });
}

// ===== ENDPOINTS DE USUÁRIOS =====

/**
 * Buscar todos os Usuários
 */
export async function getUsers(): Promise<UserAdmin[]> {
  return get<UserAdmin[]>(API_ACTIONS.GET_USERS);
}

/**
 * Criar novo Usuário
 */
export async function createUser(input: UserInput): Promise<CreateResponse> {
  return post<CreateResponse>(API_ACTIONS.CREATE_USER, input);
}

/**
 * Atualizar Usuário
 */
export async function updateUser(data: UserUpdateInput & { id: string }): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.UPDATE_USER, data);
}

/**
 * Deletar Usuário
 */
export async function deleteUser(id: string): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.DELETE_USER, { id });
}

/**
 * Ativar/desativar Usuário
 */
export async function toggleUser(id: string): Promise<ToggleResponse> {
  return post<ToggleResponse>(API_ACTIONS.TOGGLE_USER, { id });
}

// ===== ENDPOINTS DE VEÍCULOS =====

/**
 * Buscar todos os Veículos
 */
export async function getVehicles(): Promise<Vehicle[]> {
  return get<Vehicle[]>(API_ACTIONS.GET_VEHICLES);
}

/**
 * Criar novo Veículo
 */
export async function createVehicle(input: VehicleInput): Promise<CreateResponse> {
  return post<CreateResponse>(API_ACTIONS.CREATE_VEHICLE, input);
}

/**
 * Deletar Veículo
 */
export async function deleteVehicle(id: string): Promise<DeleteResponse> {
  return post<DeleteResponse>(API_ACTIONS.DELETE_VEHICLE, { id });
}

// ===== HELPERS =====

/**
 * Verificar se a API está configurada
 */
export function isApiConfigured(): boolean {
  return APPS_SCRIPT_URL !== '';
}

/**
 * Obter mensagem de erro amigável
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido. Tente novamente.';
}
