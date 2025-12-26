/**
 * Tipos TypeScript para a aplicação GRI
 */

// ===== TYPES DE DOMÍNIO =====

/**
 * Registro no índice GRI
 */
export interface Registration {
  id: string;
  passaporte: string;
  nome: string;
  qru: string;
  pasta: string;
  data: string;                 // ISO date string (YYYY-MM-DD)
  imagem_url: string;
  data_cadastro: string;        // ISO datetime string
}

/**
 * Input para criar novo registro
 */
export interface RegistrationInput {
  passaporte: string;
  nome: string;
  qru: string;
  pasta: string;
  data: string;
  imagem_url?: string;
}

/**
 * Usuário do sistema
 */
export interface User {
  id: string;
  usuario: string;
  nome_completo: string;
}

/**
 * Estatísticas do dashboard
 */
export interface Stats {
  total: number;
  porQRU: Record<string, number>;      // { "qru1": 10, "qru2": 5, ... }
  porPasta: Record<string, number>;    // { "pasta1": 8, "pasta2": 7, ... }
  porMes: MonthStats[];
  ultimos7Dias: number;
}

/**
 * Estatísticas mensais
 */
export interface MonthStats {
  mes: string;       // "YYYY-MM"
  count: number;
}

// ===== TYPES DE API =====

/**
 * Resposta de login
 */
export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Resposta de criação de registro
 */
export interface CreateRegistrationResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Resposta de deleção
 */
export interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Resposta de verificação de passaporte
 */
export interface PassportCheckResponse {
  exists: boolean;
}

/**
 * Erro da API
 */
export interface ApiError {
  error: string;
  details?: unknown;
}

// ===== TYPES DE FORMULÁRIO =====

/**
 * Dados do formulário de cadastro
 */
export interface FormData {
  passaporte: string;
  nome: string;
  qru: string;
  pasta: string;
  data: string;
  imagem: File | null;
}

/**
 * Erros de validação do formulário
 */
export interface FormErrors {
  passaporte?: string;
  nome?: string;
  qru?: string;
  pasta?: string;
  imagem?: string;
}

// ===== TYPES DE UI =====

/**
 * Opção para Select dropdown
 */
export interface SelectOption {
  value: string;
  label: string;
}
