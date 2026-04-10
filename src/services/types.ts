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
 * Permissões do usuário
 */
export interface UserPermissions {
  is_admin: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
  pode_gerenciar_usuarios: boolean;
  pastas_acesso: string[]; // array de IDs de pastas
}

/**
 * Usuário do sistema (para login/contexto)
 */
export interface User extends UserPermissions {
  id: string;
  usuario: string;
  nome_completo: string;
}

/**
 * Usuário completo (para administração)
 */
export interface UserAdmin extends User {
  ativo: boolean;
}

/**
 * Input para criar novo usuário
 */
export interface UserInput {
  usuario: string;
  senha: string;
  nome_completo: string;
  is_admin?: boolean;
  pode_criar?: boolean;
  pode_editar?: boolean;
  pode_deletar?: boolean;
  pode_gerenciar_usuarios?: boolean;
  pastas_acesso?: string[];
}

/**
 * Input para atualizar usuário
 */
export interface UserUpdateInput {
  id: string;
  usuario?: string;
  senha?: string;
  nome_completo?: string;
  is_admin?: boolean;
  pode_criar?: boolean;
  pode_editar?: boolean;
  pode_deletar?: boolean;
  pode_gerenciar_usuarios?: boolean;
  pastas_acesso?: string[];
}

/**
 * QRU (Quadrante de Responsabilidade Urbana)
 */
export interface QRU {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

/**
 * Input para criar novo QRU
 */
export interface QRUInput {
  codigo: string;
  nome: string;
}

/**
 * Veículo vinculado a um passaporte
 */
export interface Vehicle {
  id: string;
  passaporte: string;
  placa: string;
  modelo: string;
  cor: string;
  pasta: string;
  data: string;
  imagem_url: string;
  imagem_porta_malas: string;
  imagem_emplacamento: string;
  data_cadastro: string;
}

/**
 * Input para criar novo veículo
 */
export interface VehicleInput {
  passaporte: string;
  placa: string;
  modelo: string;
  cor: string;
  pasta?: string;
  data?: string;
  imagem_url?: string;
  imagem_porta_malas?: string;
  imagem_emplacamento?: string;
}

/**
 * Input para atualizar veículo
 */
export interface VehicleUpdateInput {
  id: string;
  placa?: string;
  modelo?: string;
  cor?: string;
  pasta?: string;
  data?: string;
  imagem_url?: string;
  imagem_porta_malas?: string;
  imagem_emplacamento?: string;
}

/**
 * Pasta
 */
export interface Pasta {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

/**
 * Input para criar nova Pasta
 */
export interface PastaInput {
  codigo: string;
  nome: string;
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
 * Resposta de criação de QRU/Pasta
 */
export interface CreateResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Resposta de toggle (ativar/desativar)
 */
export interface ToggleResponse {
  success: boolean;
  ativo?: boolean;
  error?: string;
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
