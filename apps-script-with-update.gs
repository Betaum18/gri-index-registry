// =====================================================
// ADICIONAR ESTE CASE NO SWITCH DO doGet (após deleteRegistration)
// =====================================================

/*
      case 'updateRegistration':
        result = updateRegistration(dataParam ? JSON.parse(dataParam) : {});
        break;
*/

// =====================================================
// ADICIONAR ESTA FUNÇÃO (após deleteRegistration)
// =====================================================

function updateRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID não fornecido' };
  }

  // Procurar a linha com o ID
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      // Atualizar apenas os campos fornecidos
      if (data.passaporte !== undefined) sheet.getRange(i + 1, 2).setValue(data.passaporte);
      if (data.nome !== undefined) sheet.getRange(i + 1, 3).setValue(data.nome);
      if (data.qru !== undefined) sheet.getRange(i + 1, 4).setValue(data.qru);
      if (data.pasta !== undefined) sheet.getRange(i + 1, 5).setValue(data.pasta);
      if (data.data !== undefined) sheet.getRange(i + 1, 6).setValue(data.data);
      if (data.imagem_url !== undefined) sheet.getRange(i + 1, 7).setValue(data.imagem_url);

      return { success: true, message: 'Registro atualizado com sucesso' };
    }
  }

  return { success: false, error: 'ID não encontrado' };
}
