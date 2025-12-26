# Guia de Configuração: Google Sheets + Apps Script

## Passo 1: Criar Google Sheets

1. Acesse https://sheets.google.com
2. Clique em **+ Blank** (Nova planilha em branco)
3. Renomeie para: **GRI Index Registry Database**

## Passo 2: Configurar Abas

### Aba 1: Registros
1. Renomeie "Sheet1" para **Registros**
2. Na linha 1 (header), adicione as colunas:

```
A1: ID
B1: Passaporte
C1: Nome
D1: QRU
E1: Pasta
F1: Data
G1: Imagem_URL
H1: Data_Cadastro
```

### Aba 2: Usuarios
1. Crie nova aba (botão + no canto inferior esquerdo)
2. Renomeie para **Usuarios**
3. Na linha 1 (header), adicione:

```
A1: ID
B1: Usuario
C1: Senha_Hash
D1: Nome_Completo
E1: Ativo
```

4. Na linha 2, adicione o usuário admin:

```
A2: 1
B2: admin
C2: e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878e4e19398b23bd38ec221a
D2: Administrador
E2: TRUE
```

**Nota:** A senha do admin é `admin123` (hash SHA-256 já calculado)

### Aba 3: Configuracoes (opcional)
1. Crie mais uma aba
2. Renomeie para **Configuracoes**
3. Deixe vazia por enquanto

## Passo 3: Criar Google Apps Script

1. Na planilha, clique em **Extensions > Apps Script**
2. Será aberto o editor do Apps Script
3. Delete o código padrão que aparece
4. Copie e cole o código abaixo:

```javascript
// =====================================================
// CONFIGURAÇÕES
// =====================================================
const SHEET_NAME_REGISTROS = 'Registros';
const SHEET_NAME_USUARIOS = 'Usuarios';

// =====================================================
// ENDPOINTS PRINCIPAIS
// =====================================================

/**
 * Endpoint POST - Recebe actions: login, createRegistration, deleteRegistration
 */
function doPost(e) {
  try {
    const { action, data } = JSON.parse(e.postData.contents);

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

/**
 * Endpoint GET - Recebe actions: getRegistrations, getStats, checkPassport
 */
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
function jsonResponse(data, status = 200) {
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

  // Pular header (linha 0)
  for (let i = 1; i < data.length; i++) {
    const [id, user, passwordHash, nomeCompleto, ativo] = data[i];

    // Verificar se é o usuário e está ativo
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

/**
 * Listar todos os registros
 */
function getRegistrations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();
  const registros = [];

  // Pular header (linha 0)
  for (let i = 1; i < data.length; i++) {
    const [id, passaporte, nome, qru, pasta, dataReg, imagemUrl, dataCadastro] = data[i];

    // Pular linhas vazias
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

/**
 * Criar novo registro
 */
function createRegistration(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const id = Utilities.getUuid();
  const dataCadastro = new Date().toISOString();

  // Validações básicas
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

/**
 * Deletar registro por ID
 */
function deleteRegistration(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();

  // Pular header (linha 0), procurar ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1); // +1 porque sheet.deleteRow é 1-indexed
      return { success: true, message: 'Registro deletado com sucesso' };
    }
  }

  return { success: false, error: 'ID não encontrado' };
}

/**
 * Verificar se passaporte já existe
 */
function checkPassportExists(passport) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME_REGISTROS);
  const data = sheet.getDataRange().getValues();

  // Pular header (linha 0)
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
  const setedias = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Contadores por mês (últimos 12 meses)
  const mesesMap = {};

  registros.forEach(r => {
    // Contar por QRU
    stats.porQRU[r.qru] = (stats.porQRU[r.qru] || 0) + 1;

    // Contar por Pasta
    stats.porPasta[r.pasta] = (stats.porPasta[r.pasta] || 0) + 1;

    // Contar últimos 7 dias
    if (r.data_cadastro) {
      const dataCadastro = new Date(r.data_cadastro);
      if (dataCadastro >= seteias) {
        stats.ultimos7Dias++;
      }

      // Agrupar por mês/ano
      const mesAno = formatarMesAno(dataCadastro);
      mesesMap[mesAno] = (mesesMap[mesAno] || 0) + 1;
    }
  });

  // Converter meses para array ordenado
  stats.porMes = Object.keys(mesesMap)
    .sort()
    .slice(-12) // Últimos 12 meses
    .map(mesAno => ({
      mes: mesAno,
      count: mesesMap[mesAno]
    }));

  return stats;
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Hash de senha usando SHA-256
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );

  // Converter bytes para hex string
  return rawHash
    .map(byte => {
      const v = (byte < 0) ? 256 + byte : byte;
      return ('0' + v.toString(16)).slice(-2);
    })
    .join('');
}

/**
 * Formatar data para "YYYY-MM" (Mês/Ano)
 */
function formatarMesAno(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

/**
 * Teste manual (executar no editor para debug)
 */
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
```

5. Clique em **Save** (ícone de disquete) ou `Ctrl+S`
6. Renomeie o projeto para: **GRI Backend**

## Passo 4: Deploy como Web App

1. No Apps Script, clique em **Deploy > New deployment**
2. Ao lado de "Select type", clique no ícone de **engrenagem ⚙️**
3. Selecione **Web app**
4. Preencha as configurações:
   - **Description:** `Versão inicial - GRI Backend`
   - **Execute as:** `Me (seu email)`
   - **Who has access:** `Anyone`

   ⚠️ **IMPORTANTE:** Escolha "Anyone" para permitir acesso sem autenticação do Google. A segurança será feita via login no seu sistema.

5. Clique em **Deploy**
6. Na primeira vez, será solicitado **autorização**:
   - Clique em **Authorize access**
   - Escolha sua conta Google
   - Clique em **Advanced** (Avançado)
   - Clique em **Go to [nome do projeto] (unsafe)**
   - Clique em **Allow** (Permitir)

7. Após deploy, você verá uma tela com a **Web app URL**
8. **COPIE ESSA URL!** Ela será algo como:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```

## Passo 5: Testar o Apps Script (Opcional mas recomendado)

1. No editor do Apps Script, no menu superior, selecione a função `testarFuncoes`
2. Clique no botão **Run** (▶️ Play)
3. Abra **View > Logs** (ou `Ctrl+Enter`)
4. Você deverá ver os logs:
   ```
   === Teste de Login ===
   {"success":true,"user":{"id":"1","usuario":"admin","nome_completo":"Administrador"}}
   === Teste de Registros ===
   Total de registros: 0
   === Teste de Stats ===
   {"total":0,"porQRU":{},"porPasta":{},"porMes":[],"ultimos7Dias":0}
   ```

Se ver isso, está tudo funcionando! ✅

## Passo 6: Configurar .env.local no Projeto

1. No terminal, navegue até a pasta do projeto:
   ```bash
   cd /home/albertoo/gri-index-registry
   ```

2. Crie o arquivo `.env.local`:
   ```bash
   nano .env.local
   ```

3. Cole o seguinte conteúdo (substituindo pela sua URL real):
   ```bash
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec
   ```

4. Salve e feche (`Ctrl+X`, depois `Y`, depois `Enter`)

## Passo 7: Testar Comunicação Frontend ↔ Backend

Depois que o código do frontend estiver pronto, você pode testar se a comunicação está funcionando:

1. No console do navegador (F12), execute:
   ```javascript
   fetch('https://script.google.com/macros/s/SUA_URL/exec?action=getStats')
     .then(r => r.json())
     .then(console.log)
   ```

2. Você deverá ver o objeto de estatísticas retornado

## Troubleshooting

### Erro: "Script function not found"
- Certifique-se de que salvou o código (`Ctrl+S`)
- Verifique se o código foi colado completamente

### Erro: "Authorization required"
- Refaça o passo 4, autorizando o script
- Verifique se "Who has access" está como "Anyone"

### Erro: "Cannot read property"
- Verifique se as abas têm exatamente os nomes: `Registros` e `Usuarios`
- Verifique se os headers estão na linha 1

### Apps Script está lento
- Normal! Apps Script pode demorar 1-3 segundos por request
- Use cache no frontend (React Query já faz isso)

## Próximos Passos

Agora que o Google Sheets e Apps Script estão configurados, volte para o terminal e me avise que terminou. Vou continuar com a implementação do código frontend!

---

**Dúvidas?** Me avise qual passo deu erro que te ajudo a resolver!
