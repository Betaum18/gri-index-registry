// =====================================================
// ADICIONAR updateUser NO APPS SCRIPT
// =====================================================

// 1. ADICIONAR ESTE CASE NO SWITCH DO doGet() (depois de 'createUser'):

      case 'updateUser':
        result = updateUser(dataParam ? JSON.parse(dataParam) : {});
        break;

// 2. ADICIONAR ESTA FUNÇÃO (depois da função createUser):

/**
 * Atualizar usuario
 */
function updateUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  // Procurar a linha com o ID
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      // Atualizar apenas os campos fornecidos
      if (data.usuario !== undefined) sheet.getRange(i + 1, 2).setValue(data.usuario);
      if (data.nome_completo !== undefined) sheet.getRange(i + 1, 4).setValue(data.nome_completo);

      // Se forneceu senha, atualizar o hash
      if (data.senha !== undefined && data.senha !== '') {
        const senhaHash = hashPassword(data.senha);
        sheet.getRange(i + 1, 3).setValue(senhaHash);
      }

      return { success: true, message: 'Usuario atualizado com sucesso' };
    }
  }

  return { success: false, error: 'Usuario nao encontrado' };
}
