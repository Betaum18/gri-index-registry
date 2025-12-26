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
 * Helper: Fazer requisição POST
 */
async function post<T>(action: string, data: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
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
