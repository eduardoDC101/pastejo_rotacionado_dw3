document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var form = document.getElementById('frmAlocados');
  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirAlocado');
  var btnAtualizar = document.getElementById('btnAtualizarAlocado');
  var btnRemover = document.getElementById('btnRemoverAlocado');
  var titulo = document.getElementById('tituloFormulario');

  inicializarSelects();

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar alocação';
    btnInserir.classList.remove('d-none');
    await carregarOpcoesAlocados(form.dataset.servidorDw3);
    btnInserir.addEventListener('click', function() {
      vwInsertAlocado();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar alocação';
    definirSomenteLeitura(true);
    await vwGetAlocadoByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar alocação';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetAlocadoByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdateAlocado();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover alocação';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetAlocadoByID());
    btnRemover.addEventListener('click', function() {
      vwDeleteAlocado();
    });
  }
});

function inicializarSelects() {
  $('#animalidfk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um animal',
    width: '100%'
  });

  $('#piqueteidfk').select2({
    theme: 'bootstrap-5',
    placeholder: 'Selecione um piquete',
    width: '100%'
  });
}

function definirSomenteLeitura(ativo) {
  ['datainicio', 'datafinal'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
  $('#animalidfk').prop('disabled', ativo);
  $('#piqueteidfk').prop('disabled', ativo);
}

function montarAlocadoDoFormulario() {
  return {
    animalidfk: document.getElementById('animalidfk').value,
    piqueteidfk: document.getElementById('piqueteidfk').value,
    datainicio: document.getElementById('datainicio').value,
    datafinal: document.getElementById('datafinal').value
  };
}

function lerIdDaUrl() {
  var alocadoId = new URLSearchParams(window.location.search).get('alocadoId');

  if (!alocadoId || !/^\d+$/.test(alocadoId) || Number(alocadoId) <= 0) {
    throw new Error('ID da alocação inválido.');
  }

  return alocadoId;
}

function validarPeriodo() {
  var dataInicio = document.getElementById('datainicio').value;
  var dataFinal = document.getElementById('datafinal').value;

  if (dataFinal && dataFinal < dataInicio) {
    alert('A data final não pode ser anterior à data de início.');
    return false;
  }

  return true;
}

async function buscarRegistros(servidorDw3, rota) {
  var response = await fetch(servidorDw3 + rota, {
    headers: dw3MontarHeadersAutenticacao()
  });
  var data = await response.json();

  if (!dw3TratarRespostaAutenticacao(data)) {
    return null;
  }

  if (data.status !== 'ok' || !Array.isArray(data.registro)) {
    throw new Error(data.status || 'Resposta inválida do servidor.');
  }

  return data.registro;
}

function preencherSelect(selectId, textoVazio, registros, campoValor, montarTexto) {
  var select = document.getElementById(selectId);
  select.innerHTML = '<option value="">' + textoVazio + '</option>';

  registros.forEach(function(registro) {
    var option = document.createElement('option');
    option.value = registro[campoValor];
    option.textContent = montarTexto(registro);
    select.appendChild(option);
  });

  $('#' + selectId).trigger('change');
}

async function carregarOpcoesAlocados(servidorDw3) {
  try {
    var animais = await buscarRegistros(servidorDw3, '/getAllAnimais');
    if (!animais) {
      return false;
    }

    var piquetes = await buscarRegistros(servidorDw3, '/getAllPiquetes');
    if (!piquetes) {
      return false;
    }

    preencherSelect('animalidfk', 'Selecione um animal', animais, 'animalid', function(animal) {
      return animal.nome;
    });

    preencherSelect('piqueteidfk', 'Selecione um piquete', piquetes, 'piqueteid', function(piquete) {
      return piquete.descricao + ' (' + piquete.descricaopasto + ')';
    });

    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar animais e piquetes.');
    return false;
  }
}

async function vwInsertAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnInserir = document.getElementById('btnInserirAlocado');

  try {
    if (!form.reportValidity() || !validarPeriodo()) {
      return;
    }

    btnInserir.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/insertAlocado', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAlocadoDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir a alocação.');
    }

    alert('Alocação cadastrada com sucesso.');
    window.location.href = '/alocados';
  } catch (error) {
    alert(error.message || 'Erro ao inserir alocação.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetAlocadoByID() {
  var form = document.getElementById('frmAlocados');

  try {
    var alocadoId = lerIdDaUrl();

    var response = await fetch(form.dataset.servidorDw3 + '/getAlocadoByID/' + encodeURIComponent(alocadoId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor.');
    }

    var alocado = data.registro[0];

    if (!alocado) {
      throw new Error('Alocação não encontrada.');
    }

    if (!(await carregarOpcoesAlocados(form.dataset.servidorDw3))) {
      return false;
    }

    document.getElementById('grupoId').classList.remove('d-none');
    document.getElementById('alocadoid').value = alocado.alocadoid;
    document.getElementById('idVisivel').value = alocado.alocadoid;
    document.getElementById('datainicio').value = alocado.datainicio ?? '';
    document.getElementById('datafinal').value = alocado.datafinal ?? '';
    $('#animalidfk').val(String(alocado.animalidfk)).trigger('change');
    $('#piqueteidfk').val(String(alocado.piqueteidfk)).trigger('change');
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar alocação.');
    return false;
  }
}

async function vwUpdateAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnAtualizar = document.getElementById('btnAtualizarAlocado');

  if (btnAtualizar.disabled || !form.reportValidity() || !validarPeriodo()) {
    return;
  }

  try {
    var alocadoId = lerIdDaUrl();

    btnAtualizar.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/updateAlocado/' + encodeURIComponent(alocadoId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAlocadoDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar a alocação.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma alocação foi atualizada.');
    }

    alert('Alocação atualizada com sucesso.');
    window.location.href = '/alocados';
  } catch (error) {
    alert(error.message || 'Erro ao atualizar alocação.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeleteAlocado() {
  var form = document.getElementById('frmAlocados');
  var btnRemover = document.getElementById('btnRemoverAlocado');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção desta alocação?')) {
    return;
  }

  try {
    var alocadoId = document.getElementById('alocadoid').value;

    btnRemover.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/deleteAlocado/' + encodeURIComponent(alocadoId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover a alocação.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhuma alocação foi removida.');
    }

    alert('Alocação removida com sucesso.');
    window.location.href = '/alocados';
  } catch (error) {
    alert(error.message || 'Erro ao remover alocação.');
    btnRemover.disabled = false;
  }
}
