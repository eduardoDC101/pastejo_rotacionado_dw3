document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmPiquetes');
  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirPiquete');
  var btnAtualizar = document.getElementById('btnAtualizarPiquete');
  var btnRemover = document.getElementById('btnRemoverPiquete');
  var titulo = document.getElementById('tituloFormulario');

  inicializarSelectPastos();

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar piquete';
    btnInserir.classList.remove('d-none');
    await carregarPastosToPiquetes(form.dataset.servidorDw3);
    btnInserir.addEventListener('click', function() {
      vwInsertPiquete();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar piquete';
    definirSomenteLeitura(true);
    await vwGetPiqueteByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar piquete';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetPiqueteByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdatePiquete();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover piquete';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetPiqueteByID());
    btnRemover.addEventListener('click', function() {
      vwDeletePiquete();
    });
  }
});

function inicializarSelectPastos() {
  $('#pastoidfk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um pasto',
    width: '100%'
  });
}

function definirSomenteLeitura(ativo) {
  ['descricao', 'latitude', 'longitude'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
  $('#pastoidfk').prop('disabled', ativo);
}

function montarPiqueteDoFormulario() {
  return {
    descricao: document.getElementById('descricao').value.trim(),
    latitude: document.getElementById('latitude').value,
    longitude: document.getElementById('longitude').value,
    pastoidfk: document.getElementById('pastoidfk').value
  };
}

function lerIdDaUrl() {
  var piqueteId = new URLSearchParams(window.location.search).get('piqueteId');

  if (!piqueteId || !/^\d+$/.test(piqueteId) || Number(piqueteId) <= 0) {
    throw new Error('ID do piquete inválido.');
  }

  return piqueteId;
}

async function carregarPastosToPiquetes(servidorDw3) {
  try {
    var response = await fetch(servidorDw3 + '/getAllPastos', {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor.');
    }

    var pastoSelect = document.getElementById('pastoidfk');
    pastoSelect.innerHTML = '<option value="">Selecione um pasto</option>';

    data.registro.forEach(function(pasto) {
      var option = document.createElement('option');
      option.value = pasto.pastoid;
      option.textContent = pasto.descricao;
      pastoSelect.appendChild(option);
    });

    $('#pastoidfk').trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar pastos.');
    return false;
  }
}

async function vwInsertPiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnInserir = document.getElementById('btnInserirPiquete');

  try {
    if (!form.reportValidity()) {
      return;
    }

    btnInserir.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/insertPiquete', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPiqueteDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir o piquete.');
    }

    alert('Piquete cadastrado com sucesso.');
    window.location.href = '/piquetes';
  } catch (error) {
    alert(error.message || 'Erro ao inserir piquete.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetPiqueteByID() {
  var form = document.getElementById('frmPiquetes');

  try {
    var piqueteId = lerIdDaUrl();

    var response = await fetch(form.dataset.servidorDw3 + '/getPiqueteByID/' + encodeURIComponent(piqueteId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor.');
    }

    var piquete = data.registro[0];

    if (!piquete) {
      throw new Error('Piquete não encontrado.');
    }

    if (!(await carregarPastosToPiquetes(form.dataset.servidorDw3))) {
      return false;
    }

    document.getElementById('grupoId').classList.remove('d-none');
    document.getElementById('piqueteid').value = piquete.piqueteid;
    document.getElementById('idVisivel').value = piquete.piqueteid;
    document.getElementById('descricao').value = piquete.descricao ?? '';
    document.getElementById('latitude').value = piquete.latitude ?? '';
    document.getElementById('longitude').value = piquete.longitude ?? '';
    $('#pastoidfk').val(String(piquete.pastoidfk)).trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar piquete.');
    return false;
  }
}

async function vwUpdatePiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnAtualizar = document.getElementById('btnAtualizarPiquete');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var piqueteId = lerIdDaUrl();

    btnAtualizar.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/updatePiquete/' + encodeURIComponent(piqueteId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPiqueteDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar o piquete.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum piquete foi atualizado.');
    }

    alert('Piquete atualizado com sucesso.');
    window.location.href = '/piquetes';
  } catch (error) {
    alert(error.message || 'Erro ao atualizar piquete.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeletePiquete() {
  var form = document.getElementById('frmPiquetes');
  var btnRemover = document.getElementById('btnRemoverPiquete');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste piquete?')) {
    return;
  }

  try {
    var piqueteId = document.getElementById('piqueteid').value;

    btnRemover.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/deletePiquete/' + encodeURIComponent(piqueteId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover o piquete.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum piquete foi removido.');
    }

    alert('Piquete removido com sucesso.');
    window.location.href = '/piquetes';
  } catch (error) {
    alert(error.message || 'Erro ao remover piquete.');
    btnRemover.disabled = false;
  }
}
