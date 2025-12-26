// =====================================================
// CONFIGURAÇÕES
// =====================================================
const SHEET_NAME_REGISTROS = 'Registros';
const SHEET_NAME_USUARIOS = 'Usuarios';

// =====================================================
// ENDPOINTS PRINCIPAIS
// =====================================================

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const data = request.data;

    switch(action) {
      case 'login':
        return jsonResponse(login(data.username, data.password));

      case 'createRegistration':
        return jsonResponse(createRegistration(data));

      case 'deleteRegistration':
        return jsonResponse(deleteRegistration(data.id));

      default:
        return jsonResponse({ error: 'Ação inválida' }, 400);
    }
  } catch (error) {
    Logger.log('Erro em doPost: ' + error.toString());
    return jsonResponse({ error: error.toString() }, 500);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    switch(action) {
      case 'getRegistrations':
        return jsonResponse(getRegistrations());

      case 'getStats':
        return jsonResponse(getStats());

      case 'checkPassport':
        const passport = e.parameter.passport;
        if (!passport) {
          return jsonResponse({ error: 'Passaporte não fornecido' }, 400);
        }
        return jsonResponse(checkPassportExists(passport));

      default:
        return jsonResponse({ error: 'Ação inválida' }, 400);
    }
  } catch (error) {
    Logger.log('Erro em doGet: ' + error.toString());
    return jsonResponse({ error: error.toString() }, 500);
  }
}

// =====================================================
// HELPER: CRIAR RESPOSTA JSON
// =====================================================
function jsonResponse(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
    const passaporte = data[i][1];
    const nome = data[i][2];
    const qru = data[i][3];
    const pasta = data[i][4];
    const dataReg = data[i][5];
    const imagemUrl = data[i][6];
    const dataCadastro = data[i][7];

    if (!id) continue;

    registros.push({
      id: id.toString(),
      passaporte: passaporte.toString(),
      nome: nome,
      qru: qru,
      pasta: pasta,
      data: dataReg,
      imagem_url: imagemUrl || '',
      data_cadastro: dataCadastro
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
  Logger.log('=== Teste de Login ===');
  const resultLogin = login('admin', 'admin123');
  Logger.log(JSON.stringify(resultLogin));

  Logger.log('=== Teste de Registros ===');
  const registros = getRegistrations();
  Logger.log('Total de registros: ' + registros.length);

  Logger.log('=== Teste de Stats ===');
  const stats = getStats();
  Logger.log(JSON.stringify(stats));
}
