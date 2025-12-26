/**
 * Configuração da API
 *
 * Centraliza URLs e constantes relacionadas ao backend (Google Apps Script)
 */

// URL do Google Apps Script Web App
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Verificar se a URL está configurada
if (!APPS_SCRIPT_URL) {
  console.error(
    '❌ VITE_APPS_SCRIPT_URL não está configurado!\n' +
    'Crie o arquivo .env.local com a URL do seu Google Apps Script.\n' +
    'Veja instruções em SETUP_GOOGLE.md'
  );
}

// Timeout padrão para requisições (em ms)
export const API_TIMEOUT = 30000; // 30 segundos

// Actions disponíveis no Apps Script
export const API_ACTIONS = {
  // GET actions
  GET_REGISTRATIONS: 'getRegistrations',
  GET_STATS: 'getStats',
  CHECK_PASSPORT: 'checkPassport',
  GET_QRUS: 'getQRUs',
  GET_PASTAS: 'getPastas',
  GET_USERS: 'getUsers',

  // POST actions
  LOGIN: 'login',
  CREATE_REGISTRATION: 'createRegistration',
  UPDATE_REGISTRATION: 'updateRegistration',
  DELETE_REGISTRATION: 'deleteRegistration',
  CREATE_QRU: 'createQRU',
  DELETE_QRU: 'deleteQRU',
  TOGGLE_QRU: 'toggleQRU',
  CREATE_PASTA: 'createPasta',
  DELETE_PASTA: 'deletePasta',
  TOGGLE_PASTA: 'togglePasta',
  CREATE_USER: 'createUser',
  UPDATE_USER: 'updateUser',
  DELETE_USER: 'deleteUser',
  TOGGLE_USER: 'toggleUser',
} as const;

// Configurações de cache do React Query (em ms)
export const CACHE_TIMES = {
  REGISTRATIONS: 2 * 60 * 1000,  // 2 minutos
  STATS: 5 * 60 * 1000,           // 5 minutos
  PASSPORT_CHECK: 30 * 1000,      // 30 segundos
  QRUS: 10 * 60 * 1000,           // 10 minutos (raramente mudam)
  PASTAS: 10 * 60 * 1000,         // 10 minutos (raramente mudam)
  USERS: 10 * 60 * 1000,          // 10 minutos (raramente mudam)
} as const;
