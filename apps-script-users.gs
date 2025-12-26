// =====================================================
// FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS
// =====================================================
// Adicionar estas funções ao Apps Script e os cases no doGet()

// =====================================================
// 1. ADICIONAR ESTES CASES NO SWITCH DO doGet()
// =====================================================

/*
      case 'getUsers':
        result = getUsers();
        break;

      case 'createUser':
        result = createUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deleteUser':
        result = deleteUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'toggleUser':
        result = toggleUser(dataParam ? JSON.parse(dataParam) : {});
        break;
*/

// =====================================================
// 2. ADICIONAR ESTAS FUNÇÕES
// =====================================================

/**
 * Buscar todos os usuários
 */
function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const data = sheet.getDataRange().getValues();
  const users = [];

  // Pular header (linha 0)
  for (let i = 1; i < data.length; i++) {
    const [id, usuario, senha_hash, nome_completo, ativo] = data[i];

    // Não retornar o hash da senha
    users.push({
      id: id.toString(),
      usuario: usuario,
      nome_completo: nome_completo,
      ativo: ativo === true || ativo === 'TRUE' || ativo === 'true'
    });
  }

  return users;
}

/**
 * Criar novo usuário
 */
function createUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);

  if (!data.usuario || !data.senha || !data.nome_completo) {
    return { success: false, error: 'Campos obrigatórios faltando' };
  }

  // Verificar se usuário já existe
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] === data.usuario) {
      return { success: false, error: 'Usuário já existe' };
    }
  }

  // Gerar ID único
  const id = Utilities.getUuid();

  // Hash da senha (SHA-256)
  const senhaHash = hashPassword(data.senha);

  // Adicionar nova linha
  sheet.appendRow([
    id,
    data.usuario,
    senhaHash,
    data.nome_completo,
    true  // Ativo por padrão
  ]);

  return { success: true, id: id };
}

/**
 * Deletar usuário
 */
function deleteUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID não fornecido' };
  }

  // Procurar a linha com o ID
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Usuário deletado com sucesso' };
    }
  }

  return { success: false, error: 'Usuário não encontrado' };
}

/**
 * Ativar/desativar usuário
 */
function toggleUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID não fornecido' };
  }

  // Procurar a linha com o ID
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      const ativoAtual = allData[i][4];
      const novoAtivo = !ativoAtual;

      // Atualizar status (coluna 5 = index 4)
      sheet.getRange(i + 1, 5).setValue(novoAtivo);

      return {
        success: true,
        ativo: novoAtivo,
        message: novoAtivo ? 'Usuário ativado' : 'Usuário desativado'
      };
    }
  }

  return { success: false, error: 'Usuário não encontrado' };
}

/**
 * Helper: hash de senha usando SHA-256
 * NOTA: Esta função provavelmente já existe no seu código de login
 * Se já existir, não precisa duplicar
 */
function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    })
    .join('');
}
