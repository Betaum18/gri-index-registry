/**
 * GRI INDEX REGISTRY - APPS SCRIPT BACKEND
 * Backend completo para o sistema de registro GRI
 *
 * ESTRUTURA DA SHEET USUARIOS:
 * A: id | B: usuario | C: senhaHash | D: nomeCompleto | E: ativo
 * F: is_admin | G: pode_criar | H: pode_editar | I: pode_deletar
 * J: pode_gerenciar_usuarios | K: pastas_acesso (IDs separados por virgula)
 */

// CONFIGURACOES
const SHEET_NAME_REGISTROS = 'Registros';
const SHEET_NAME_USUARIOS = 'Usuarios';
const SHEET_NAME_QRUS = 'QRUs';
const SHEET_NAME_PASTAS = 'Pastas';
const SHEET_NAME_VEICULOS = 'Veiculos';

// ENDPOINT PRINCIPAL
function doGet(e) {
  try {
    const action = e.parameter.action;
    const dataParam = e.parameter.data;
    let result;

    switch(action) {
      case 'login':
        result = login(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'getRegistrations':
        result = getRegistrations();
        break;

      case 'createRegistration':
        result = createRegistration(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'updateRegistration':
        result = updateRegistration(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deleteRegistration':
        result = deleteRegistration(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'checkPassport':
        result = checkPassportExists(e.parameter.passport);
        break;

      case 'getStats':
        result = getStats();
        break;

      case 'getQRUs':
        result = getQRUs();
        break;

      case 'createQRU':
        result = createQRU(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deleteQRU':
        result = deleteQRU(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'toggleQRU':
        result = toggleQRU(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'getPastas':
        result = getPastas();
        break;

      case 'createPasta':
        result = createPasta(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deletePasta':
        result = deletePasta(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'togglePasta':
        result = togglePasta(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'getUsers':
        result = getUsers();
        break;

      case 'createUser':
        result = createUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'updateUser':
        result = updateUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deleteUser':
        result = deleteUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'toggleUser':
        result = toggleUser(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'getUserById':
        result = getUserById(e.parameter.id);
        break;

      case 'getVehicles':
        result = getVehicles();
        break;

      case 'createVehicle':
        result = createVehicle(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'deleteVehicle':
        result = deleteVehicle(dataParam ? JSON.parse(dataParam) : {});
        break;

      case 'updateVehicle':
        result = updateVehicle(dataParam ? JSON.parse(dataParam) : {});
        break;

      default:
        result = { error: 'Acao invalida: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// FUNCOES AUXILIARES DE PERMISSAO
function parseBoolean(value) {
  return value === true || value === 'TRUE' || value === 'true' || value === '1' || value === 1;
}

function parsePastasAcesso(value) {
  if (!value || value === '') return [];
  return value.toString().split(',').map(function(id) { return id.trim(); }).filter(function(id) { return id !== ''; });
}

// FUNCOES DE AUTENTICACAO
function login(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.username || !data.password) {
    return { success: false, error: 'Usuario e senha sao obrigatorios' };
  }

  for (let i = 1; i < allData.length; i++) {
    const [id, usuario, senhaHash, nomeCompleto, ativo, isAdmin, podeCriar, podeEditar, podeDeletar, podeGerenciarUsuarios, pastasAcesso] = allData[i];

    if (usuario === data.username && parseBoolean(ativo)) {
      if (senhaHash === hashPassword(data.password)) {
        return {
          success: true,
          user: {
            id: id.toString(),
            usuario: usuario,
            nome_completo: nomeCompleto,
            is_admin: parseBoolean(isAdmin),
            pode_criar: parseBoolean(podeCriar),
            pode_editar: parseBoolean(podeEditar),
            pode_deletar: parseBoolean(podeDeletar),
            pode_gerenciar_usuarios: parseBoolean(podeGerenciarUsuarios),
            pastas_acesso: parsePastasAcesso(pastasAcesso)
          }
        };
      }
    }
  }

  return { success: false, error: 'Credenciais invalidas' };
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    })
    .join('');
}

// FUNCOES DE REGISTROS
function getRegistrations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();
  const registros = [];

  for (let i = 1; i < data.length; i++) {
    const [id, passaporte, nome, qru, pasta, dataReg, imagemUrl, dataCadastro, registradoPor] = data[i];

    registros.push({
      id: id.toString(),
      passaporte: passaporte,
      nome: nome,
      qru: qru,
      pasta: pasta,
      data: dataReg,
      imagem_url: imagemUrl || '',
      data_cadastro: dataCadastro,
      registrado_por: registradoPor || ''
    });
  }

  return registros;
}

function createRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);

  if (!data.passaporte || !data.nome || !data.qru || !data.pasta || !data.data) {
    return { success: false, error: 'Campos obrigatorios faltando' };
  }

  const id = Utilities.getUuid();
  const dataCadastro = new Date().toISOString();

  sheet.appendRow([
    id,
    data.passaporte,
    data.nome,
    data.qru,
    data.pasta,
    data.data,
    data.imagem_url || '',
    dataCadastro,
    data.registrado_por || ''
  ]);

  return { success: true, id: id };
}

function updateRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      if (data.passaporte !== undefined) sheet.getRange(i + 1, 2).setValue(data.passaporte);
      if (data.nome !== undefined) sheet.getRange(i + 1, 3).setValue(data.nome);
      if (data.qru !== undefined) sheet.getRange(i + 1, 4).setValue(data.qru);
      if (data.pasta !== undefined) sheet.getRange(i + 1, 5).setValue(data.pasta);
      if (data.data !== undefined) sheet.getRange(i + 1, 6).setValue(data.data);
      if (data.imagem_url !== undefined) sheet.getRange(i + 1, 7).setValue(data.imagem_url);

      return { success: true, message: 'Registro atualizado com sucesso' };
    }
  }

  return { success: false, error: 'Registro nao encontrado' };
}

function deleteRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Registro deletado com sucesso' };
    }
  }

  return { success: false, error: 'Registro nao encontrado' };
}

function checkPassportExists(passport) {
  if (!passport || passport.trim() === '') {
    return { exists: false };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === passport.trim()) {
      return { exists: true };
    }
  }

  return { exists: false };
}

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
  const seteDiasAtras = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));

  registros.forEach(function(r) {
    stats.porQRU[r.qru] = (stats.porQRU[r.qru] || 0) + 1;
    stats.porPasta[r.pasta] = (stats.porPasta[r.pasta] || 0) + 1;

    const dataCadastro = new Date(r.data_cadastro);
    if (dataCadastro >= seteDiasAtras) {
      stats.ultimos7Dias++;
    }
  });

  return stats;
}

// FUNCOES DE QRUs
function getQRUs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const data = sheet.getDataRange().getValues();
  const qrus = [];

  for (let i = 1; i < data.length; i++) {
    const [id, codigo, nome, ativo] = data[i];

    qrus.push({
      id: id.toString(),
      codigo: codigo,
      nome: nome,
      ativo: parseBoolean(ativo)
    });
  }

  return qrus;
}

function createQRU(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);

  if (!data.codigo || !data.nome) {
    return { success: false, error: 'Codigo e nome sao obrigatorios' };
  }

  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    data.codigo,
    data.nome,
    true
  ]);

  return { success: true, id: id };
}

function deleteQRU(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'QRU deletado com sucesso' };
    }
  }

  return { success: false, error: 'QRU nao encontrado' };
}

function toggleQRU(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_QRUS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      const ativoAtual = allData[i][3];
      const novoAtivo = !parseBoolean(ativoAtual);

      sheet.getRange(i + 1, 4).setValue(novoAtivo);

      return {
        success: true,
        ativo: novoAtivo,
        message: novoAtivo ? 'QRU ativado' : 'QRU desativado'
      };
    }
  }

  return { success: false, error: 'QRU nao encontrado' };
}

// FUNCOES DE PASTAS
function getPastas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const data = sheet.getDataRange().getValues();
  const pastas = [];

  for (let i = 1; i < data.length; i++) {
    const [id, codigo, nome, ativo] = data[i];

    pastas.push({
      id: id.toString(),
      codigo: codigo,
      nome: nome,
      ativo: parseBoolean(ativo)
    });
  }

  return pastas;
}

function createPasta(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);

  if (!data.codigo || !data.nome) {
    return { success: false, error: 'Codigo e nome sao obrigatorios' };
  }

  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    data.codigo,
    data.nome,
    true
  ]);

  // Adicionar acesso à nova pasta para todos os usuários não-admin
  const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const usersData = usersSheet.getDataRange().getValues();
  for (let i = 1; i < usersData.length; i++) {
    const isAdmin = parseBoolean(usersData[i][5]); // coluna F = is_admin
    if (isAdmin) continue;
    const current = usersData[i][10] ? usersData[i][10].toString() : ''; // coluna K = pastas_acesso
    const ids = current ? current.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
    if (!ids.includes(id)) {
      ids.push(id);
      usersSheet.getRange(i + 1, 11).setValue(ids.join(','));
    }
  }

  return { success: true, id: id };
}

function deletePasta(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);

      // Remover o ID da pasta das permissões de todos os usuários
      const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
      const usersData = usersSheet.getDataRange().getValues();
      for (let j = 1; j < usersData.length; j++) {
        const current = usersData[j][10] ? usersData[j][10].toString() : '';
        const ids = current ? current.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
        const updated = ids.filter(function(id) { return id !== data.id.toString(); });
        if (updated.length !== ids.length) {
          usersSheet.getRange(j + 1, 11).setValue(updated.join(','));
        }
      }

      return { success: true, message: 'Pasta deletada com sucesso' };
    }
  }

  return { success: false, error: 'Pasta nao encontrada' };
}

function togglePasta(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_PASTAS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      const ativoAtual = allData[i][3];
      const novoAtivo = !parseBoolean(ativoAtual);

      sheet.getRange(i + 1, 4).setValue(novoAtivo);

      return {
        success: true,
        ativo: novoAtivo,
        message: novoAtivo ? 'Pasta ativada' : 'Pasta desativada'
      };
    }
  }

  return { success: false, error: 'Pasta nao encontrada' };
}

// FUNCOES DE USUARIOS
function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const [id, usuario, senhaHash, nomeCompleto, ativo, isAdmin, podeCriar, podeEditar, podeDeletar, podeGerenciarUsuarios, pastasAcesso] = data[i];

    users.push({
      id: id.toString(),
      usuario: usuario,
      nome_completo: nomeCompleto,
      ativo: parseBoolean(ativo),
      is_admin: parseBoolean(isAdmin),
      pode_criar: parseBoolean(podeCriar),
      pode_editar: parseBoolean(podeEditar),
      pode_deletar: parseBoolean(podeDeletar),
      pode_gerenciar_usuarios: parseBoolean(podeGerenciarUsuarios),
      pastas_acesso: parsePastasAcesso(pastasAcesso)
    });
  }

  return users;
}

function getUserById(id) {
  if (!id) return { error: 'ID nao fornecido' };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const [rowId, usuario, , nomeCompleto, ativo, isAdmin, podeCriar, podeEditar, podeDeletar, podeGerenciarUsuarios, pastasAcesso] = data[i];

    if (rowId.toString() === id.toString()) {
      if (!parseBoolean(ativo)) return { error: 'Usuario inativo' };
      return {
        id: rowId.toString(),
        usuario: usuario,
        nome_completo: nomeCompleto,
        is_admin: parseBoolean(isAdmin),
        pode_criar: parseBoolean(podeCriar),
        pode_editar: parseBoolean(podeEditar),
        pode_deletar: parseBoolean(podeDeletar),
        pode_gerenciar_usuarios: parseBoolean(podeGerenciarUsuarios),
        pastas_acesso: parsePastasAcesso(pastasAcesso)
      };
    }
  }

  return { error: 'Usuario nao encontrado' };
}

function createUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);

  if (!data.usuario || !data.senha || !data.nome_completo) {
    return { success: false, error: 'Usuario, senha e nome completo sao obrigatorios' };
  }

  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] === data.usuario) {
      return { success: false, error: 'Usuario ja existe' };
    }
  }

  const id = Utilities.getUuid();
  const senhaHash = hashPassword(data.senha);

  // Converter array de pastas para string separada por virgula
  const pastasAcessoStr = Array.isArray(data.pastas_acesso) ? data.pastas_acesso.join(',') : (data.pastas_acesso || '');

  sheet.appendRow([
    id,
    data.usuario,
    senhaHash,
    data.nome_completo,
    true, // ativo
    data.is_admin === true, // is_admin
    data.pode_criar === true, // pode_criar
    data.pode_editar === true, // pode_editar
    data.pode_deletar === true, // pode_deletar
    data.pode_gerenciar_usuarios === true, // pode_gerenciar_usuarios
    pastasAcessoStr // pastas_acesso
  ]);

  return { success: true, id: id };
}

function updateUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      // Atualizar campos basicos
      if (data.usuario !== undefined) sheet.getRange(i + 1, 2).setValue(data.usuario);
      if (data.senha !== undefined && data.senha !== '') {
        sheet.getRange(i + 1, 3).setValue(hashPassword(data.senha));
      }
      if (data.nome_completo !== undefined) sheet.getRange(i + 1, 4).setValue(data.nome_completo);

      // Atualizar permissoes
      if (data.is_admin !== undefined) sheet.getRange(i + 1, 6).setValue(data.is_admin === true);
      if (data.pode_criar !== undefined) sheet.getRange(i + 1, 7).setValue(data.pode_criar === true);
      if (data.pode_editar !== undefined) sheet.getRange(i + 1, 8).setValue(data.pode_editar === true);
      if (data.pode_deletar !== undefined) sheet.getRange(i + 1, 9).setValue(data.pode_deletar === true);
      if (data.pode_gerenciar_usuarios !== undefined) sheet.getRange(i + 1, 10).setValue(data.pode_gerenciar_usuarios === true);

      // Atualizar pastas de acesso
      if (data.pastas_acesso !== undefined) {
        const pastasAcessoStr = Array.isArray(data.pastas_acesso) ? data.pastas_acesso.join(',') : (data.pastas_acesso || '');
        sheet.getRange(i + 1, 11).setValue(pastasAcessoStr);
      }

      return { success: true, message: 'Usuario atualizado com sucesso' };
    }
  }

  return { success: false, error: 'Usuario nao encontrado' };
}

function deleteUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Usuario deletado com sucesso' };
    }
  }

  return { success: false, error: 'Usuario nao encontrado' };
}

function toggleUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_USUARIOS);
  const allData = sheet.getDataRange().getValues();

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      const ativoAtual = allData[i][4];
      const novoAtivo = !parseBoolean(ativoAtual);

      sheet.getRange(i + 1, 5).setValue(novoAtivo);

      return {
        success: true,
        ativo: novoAtivo,
        message: novoAtivo ? 'Usuario ativado' : 'Usuario desativado'
      };
    }
  }

  return { success: false, error: 'Usuario nao encontrado' };
}

// FUNCOES DE VEICULOS
// ESTRUTURA DA SHEET VEICULOS:
// A: id | B: passaporte | C: placa | D: modelo | E: cor | F: pasta | G: data
// H: imagem_url | I: imagem_porta_malas | J: imagem_emplacamento | K: data_cadastro
function getVehicles() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_VEICULOS);

  // Criar aba se nao existir
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_VEICULOS);
    sheet.appendRow(['id', 'passaporte', 'placa', 'modelo', 'cor', 'pasta', 'data', 'imagem_url', 'imagem_porta_malas', 'imagem_emplacamento', 'data_cadastro']);
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var veiculos = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    veiculos.push({
      id: row[0].toString(),
      passaporte: row[1].toString(),
      placa: row[2].toString(),
      modelo: row[3].toString(),
      cor: row[4].toString(),
      pasta: row[5] ? row[5].toString() : '',
      data: row[6] instanceof Date ? Utilities.formatDate(row[6], Session.getScriptTimeZone(), 'yyyy-MM-dd') : (row[6] ? row[6].toString() : ''),
      imagem_url: row[7] || '',
      imagem_porta_malas: row[8] || '',
      imagem_emplacamento: row[9] || '',
      data_cadastro: row[10] ? row[10].toString() : (row[6] instanceof Date ? Utilities.formatDate(row[6], Session.getScriptTimeZone(), 'yyyy-MM-dd') : (row[6] ? row[6].toString() : ''))
    });
  }

  return veiculos;
}

function createVehicle(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME_VEICULOS);

  // Criar aba se nao existir
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_VEICULOS);
    sheet.appendRow(['id', 'passaporte', 'placa', 'modelo', 'cor', 'pasta', 'data', 'imagem_url', 'imagem_porta_malas', 'imagem_emplacamento', 'data_cadastro']);
  }

  if (!data.passaporte || !data.cor) {
    return { success: false, error: 'Passaporte e cor sao obrigatorios' };
  }

  var id = Utilities.getUuid();
  var dataCadastro = new Date().toISOString();

  sheet.appendRow([
    id,
    data.passaporte,
    data.placa,
    data.modelo,
    data.cor,
    data.pasta || '',
    data.data || '',
    data.imagem_url || '',
    data.imagem_porta_malas || '',
    data.imagem_emplacamento || '',
    dataCadastro
  ]);

  return { success: true, id: id };
}

function updateVehicle(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_VEICULOS);

  if (!sheet) {
    return { success: false, error: 'Aba de veiculos nao encontrada' };
  }

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  var allData = sheet.getDataRange().getValues();

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      if (data.placa !== undefined) sheet.getRange(i + 1, 3).setValue(data.placa);
      if (data.modelo !== undefined) sheet.getRange(i + 1, 4).setValue(data.modelo);
      if (data.cor !== undefined) sheet.getRange(i + 1, 5).setValue(data.cor);
      if (data.pasta !== undefined) sheet.getRange(i + 1, 6).setValue(data.pasta);
      if (data.data !== undefined) sheet.getRange(i + 1, 7).setValue(data.data);
      if (data.imagem_url !== undefined) sheet.getRange(i + 1, 8).setValue(data.imagem_url);
      if (data.imagem_porta_malas !== undefined) sheet.getRange(i + 1, 9).setValue(data.imagem_porta_malas);
      if (data.imagem_emplacamento !== undefined) sheet.getRange(i + 1, 10).setValue(data.imagem_emplacamento);
      return { success: true, message: 'Veiculo atualizado com sucesso' };
    }
  }

  return { success: false, error: 'Veiculo nao encontrado' };
}

function deleteVehicle(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_VEICULOS);

  if (!sheet) {
    return { success: false, error: 'Aba de veiculos nao encontrada' };
  }

  if (!data.id) {
    return { success: false, error: 'ID nao fornecido' };
  }

  var allData = sheet.getDataRange().getValues();

  for (var i = 1; i < allData.length; i++) {
    if (allData[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Veiculo deletado com sucesso' };
    }
  }

  return { success: false, error: 'Veiculo nao encontrado' };
}
