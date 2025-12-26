// =====================================================
// CONFIGURAÇÕES
// =====================================================
const SHEET_NAME_REGISTROS = 'Registros';
const SHEET_NAME_USUARIOS = 'Usuarios';
const SHEET_NAME_QRUS = 'QRUs';
const SHEET_NAME_PASTAS = 'Pastas';

// =====================================================
// ENDPOINTS PRINCIPAIS
// =====================================================

function doGet(e) {
  try {
    const action = e.parameter.action;
    const dataParam = e.parameter.data;

    let result;
    switch(action) {
      // Registrations
      case 'getRegistrations':
        result = getRegistrations();
        break;
      case 'createRegistration':
        result = createRegistration(dataParam ? JSON.parse(dataParam) : {});
        break;
      case 'deleteRegistration':
        result = deleteRegistration((dataParam ? JSON.parse(dataParam) : {}).id);
        break;
      case 'checkPassport':
        result = checkPassportExists(e.parameter.passport);
        break;

      // Stats
      case 'getStats':
        result = getStats();
        break;

      // Auth
      case 'login':
        const loginData = JSON.parse(dataParam);
        result = login(loginData.username, loginData.password);
        break;

      // QRUs
      case 'getQRUs':
        result = getQRUs();
        break;
      case 'createQRU':
        result = createQRU(JSON.parse(dataParam));
        break;
      case 'deleteQRU':
        result = deleteQRU((JSON.parse(dataParam)).id);
        break;
      case 'toggleQRU':
        result = toggleQRU((JSON.parse(dataParam)).id);
        break;

      // Pastas
      case 'getPastas':
        result = getPastas();
        break;
      case 'createPasta':
        result = createPasta(JSON.parse(dataParam));
        break;
      case 'deletePasta':
        result = deletePasta((JSON.parse(dataParam)).id);
        break;
      case 'togglePasta':
        result = togglePasta((JSON.parse(dataParam)).id);
        break;

      default:
        result = { error: 'Ação inválida: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Erro em doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================
// AUTENTICAÇÃO
// =====================================================
function login(username, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    const user = data[i][1];
    const passwordHash = data[i][2];
    const nomeCompleto = data[i][3];
    const ativo = data[i][4];

    if (user === username && ativo === true) {
      const inputHash = hashPassword(password);

      if (passwordHash === inputHash) {
        return {
          success: true,
          user: {
            id: id.toString(),
            usuario: user,
            nome_completo: nomeCompleto
          }
        };
      } else {
        return { success: false, error: 'Senha incorreta' };
      }
    }
  }

  return { success: false, error: 'Usuário não encontrado ou inativo' };
}

// =====================================================
// CRUD DE REGISTROS
// =====================================================

function getRegistrations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();
  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    if (!id) continue;

    registros.push({
      id: id.toString(),
      passaporte: data[i][1].toString(),
      nome: data[i][2],
      qru: data[i][3],
      pasta: data[i][4],
      data: data[i][5],
      imagem_url: data[i][6] || '',
      data_cadastro: data[i][7]
    });
  }

  return registros;
}

function createRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const id = Utilities.getUuid();
  const dataCadastro = new Date().toISOString();

  if (!data.passaporte || !data.nome || !data.qru || !data.pasta || !data.data) {
    return { success: false, error: 'Campos obrigatórios faltando' };
  }

  sheet.appendRow([
    id,
    data.passaporte,
    data.nome,
    data.qru,
    data.pasta,
    data.data,
    data.imagem_url || '',
    dataCadastro
  ]);

  return { success: true, id: id };
}

function deleteRegistration(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Registro deletado com sucesso' };
    }
  }

  return { success: false, error: 'ID não encontrado' };
}

function checkPassportExists(passport) {
  if (!passport) return { exists: false };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString() === passport.toString()) {
      return { exists: true };
    }
  }

  return { exists: false };
}

// =====================================================
// CRUD DE QRUs
// =====================================================

function getQRUs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const data = sheet.getDataRange().getValues();
  const qrus = [];

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    if (!id) continue;

    qrus.push({
      id: id.toString(),
      codigo: data[i][1],
      nome: data[i][2],
      ativo: data[i][3] === true || data[i][3] === 'TRUE'
    });
  }

  return qrus;
}

function createQRU(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);

  if (!data.codigo || !data.nome) {
    return { success: false, error: 'Código e nome são obrigatórios' };
  }

  // Verificar se código já existe
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] === data.codigo) {
      return { success: false, error: 'Código já existe' };
    }
  }

  const id = allData.length; // Próximo ID
  sheet.appendRow([id, data.codigo, data.nome, true]);

  return { success: true, id: id.toString() };
}

function deleteQRU(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'QRU não encontrado' };
}

function toggleQRU(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      const currentStatus = data[i][3];
      const newStatus = !currentStatus;
      sheet.getRange(i + 1, 4).setValue(newStatus);
      return { success: true, ativo: newStatus };
    }
  }

  return { success: false, error: 'QRU não encontrado' };
}

// =====================================================
// CRUD DE PASTAS
// =====================================================

function getPastas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const data = sheet.getDataRange().getValues();
  const pastas = [];

  for (let i = 1; i < data.length; i++) {
    const id = data[i][0];
    if (!id) continue;

    pastas.push({
      id: id.toString(),
      codigo: data[i][1],
      nome: data[i][2],
      ativo: data[i][3] === true || data[i][3] === 'TRUE'
    });
  }

  return pastas;
}

function createPasta(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);

  if (!data.codigo || !data.nome) {
    return { success: false, error: 'Código e nome são obrigatórios' };
  }

  // Verificar se código já existe
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] === data.codigo) {
      return { success: false, error: 'Código já existe' };
    }
  }

  const id = allData.length; // Próximo ID
  sheet.appendRow([id, data.codigo, data.nome, true]);

  return { success: true, id: id.toString() };
}

function deletePasta(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Pasta não encontrada' };
}

function togglePasta(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      const currentStatus = data[i][3];
      const newStatus = !currentStatus;
      sheet.getRange(i + 1, 4).setValue(newStatus);
      return { success: true, ativo: newStatus };
    }
  }

  return { success: false, error: 'Pasta não encontrada' };
}

// =====================================================
// ESTATÍSTICAS
// =====================================================
function getStats() {
  const registros = getRegistrations();

  const stats = {
    total: registros.length,
    porQRU: {},
    porPasta: {},
    porMes: [],
    ultimos7Dias: 0
  };

  const hoje = new Date();
  const seteDias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mesesMap = {};

  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];

    stats.porQRU[r.qru] = (stats.porQRU[r.qru] || 0) + 1;
    stats.porPasta[r.pasta] = (stats.porPasta[r.pasta] || 0) + 1;

    if (r.data_cadastro) {
      const dataCadastro = new Date(r.data_cadastro);
      if (dataCadastro >= seteDias) {
        stats.ultimos7Dias++;
      }

      const mesAno = formatarMesAno(dataCadastro);
      mesesMap[mesAno] = (mesesMap[mesAno] || 0) + 1;
    }
  }

  const mesesArray = [];
  for (let mes in mesesMap) {
    mesesArray.push({ mes: mes, count: mesesMap[mes] });
  }

  mesesArray.sort(function(a, b) {
    return a.mes.localeCompare(b.mes);
  });

  stats.porMes = mesesArray.slice(-12);

  return stats;
}

// =====================================================
// HELPERS
// =====================================================

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );

  let hexString = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) {
      byte = 256 + byte;
    }
    let hexByte = byte.toString(16);
    if (hexByte.length === 1) {
      hexByte = '0' + hexByte;
    }
    hexString += hexByte;
  }

  return hexString;
}

function formatarMesAno(data) {
  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;
  const mesString = mes < 10 ? '0' + mes : mes.toString();
  return ano + '-' + mesString;
}

function testarFuncoes() {
  Logger.log('=== Teste de QRUs ===');
  const qrus = getQRUs();
  Logger.log('Total de QRUs: ' + qrus.length);
  Logger.log(JSON.stringify(qrus));

  Logger.log('=== Teste de Pastas ===');
  const pastas = getPastas();
  Logger.log('Total de Pastas: ' + pastas.length);
  Logger.log(JSON.stringify(pastas));
}
