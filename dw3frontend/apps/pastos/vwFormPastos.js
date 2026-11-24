document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirPasto');
  var btnAtualizar = document.getElementById('btnAtualizarPasto');
  var btnRemover = document.getElementById('btnRemoverPasto');
  var titulo = document.getElementById('tituloFormulario');

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar pasto';
    btnInserir.classList.remove('d-none');
    btnInserir.addEventListener('click', function() {
      vwInsertPasto();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar pasto';
    definirSomenteLeitura(true);
    await vwGetPastoByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar pasto';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetPastoByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdatePasto();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover pasto';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetPastoByID());
    btnRemover.addEventListener('click', function() {
      vwDeletePasto();
    });
  }
});

function definirSomenteLeitura(ativo) {
  ['descricao', 'areatotal'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
}

function montarPastoDoFormulario() {
  return {
    descricao: document.getElementById('descricao').value.trim(),
    areatotal: document.getElementById('areatotal').value
  };
}

function lerIdDaUrl() {
  var pastoId = new URLSearchParams(window.location.search).get('pastoId');

  if (!pastoId || !/^\d+$/.test(pastoId) || Number(pastoId) <= 0) {
    throw new Error('ID do pasto inválido.');
  }

  return pastoId;
}

async function vwInsertPasto() {
  var form = document.getElementById('frmPastos');
  var btnInserir = document.getElementById('btnInserirPasto');

  try {
    if (!form.reportValidity()) {
      return;
    }

    btnInserir.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/insertPasto', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPastoDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir o pasto.');
    }

    alert('Pasto cadastrado com sucesso.');
    window.location.href = '/pastos';
  } catch (error) {
    alert(error.message || 'Erro ao inserir pasto.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetPastoByID() {
  var form = document.getElementById('frmPastos');

  try {
    var pastoId = lerIdDaUrl();

    var response = await fetch(form.dataset.servidorDw3 + '/getPastoByID/' + encodeURIComponent(pastoId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    var pasto = data.registro[0];

    if (!pasto) {
      throw new Error('Pasto não encontrado.');
    }

    document.getElementById('grupoId').classList.remove('d-none');
    document.getElementById('pastoid').value = pasto.pastoid;
    document.getElementById('idVisivel').value = pasto.pastoid;
    document.getElementById('descricao').value = pasto.descricao ?? '';
    document.getElementById('areatotal').value = pasto.areatotal ?? '';
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar pasto.');
    return false;
  }
}

async function vwUpdatePasto() {
  var form = document.getElementById('frmPastos');
  var btnAtualizar = document.getElementById('btnAtualizarPasto');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var pastoId = lerIdDaUrl();

    btnAtualizar.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/updatePasto/' + encodeURIComponent(pastoId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarPastoDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar o pasto.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum pasto foi atualizado.');
    }

    alert('Pasto atualizado com sucesso.');
    window.location.href = '/pastos';
  } catch (error) {
    alert(error.message || 'Erro ao atualizar pasto.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeletePasto() {
  var form = document.getElementById('frmPastos');
  var btnRemover = document.getElementById('btnRemoverPasto');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste pasto?')) {
    return;
  }

  try {
    var pastoId = document.getElementById('pastoid').value;

    btnRemover.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/deletePasto/' + encodeURIComponent(pastoId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover o pasto.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum pasto foi removido.');
    }

    alert('Pasto removido com sucesso.');
    window.location.href = '/pastos';
  } catch (error) {
    alert(error.message || 'Erro ao remover pasto.');
    btnRemover.disabled = false;
  }
}
