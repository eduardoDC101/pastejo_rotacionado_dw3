document.addEventListener('DOMContentLoaded', async function() {
  if (!dw3IsLogged()) {
    return;
  }

  var oper = new URLSearchParams(window.location.search).get('oper');
  var btnInserir = document.getElementById('btnInserirAnimal');
  var btnAtualizar = document.getElementById('btnAtualizarAnimal');
  var btnRemover = document.getElementById('btnRemoverAnimal');
  var titulo = document.getElementById('tituloFormulario');

  if (oper === 'Cr') {
    titulo.textContent = 'Cadastrar animal';
    btnInserir.classList.remove('d-none');
    btnInserir.addEventListener('click', function() {
      vwInsertAnimal();
    });
  }

  if (oper === 'Re') {
    titulo.textContent = 'Consultar animal';
    definirSomenteLeitura(true);
    await vwGetAnimalByID();
  }

  if (oper === 'Up') {
    titulo.textContent = 'Atualizar animal';
    btnAtualizar.classList.remove('d-none');
    btnAtualizar.disabled = !(await vwGetAnimalByID());
    btnAtualizar.addEventListener('click', function() {
      vwUpdateAnimal();
    });
  }

  if (oper === 'De') {
    titulo.textContent = 'Remover animal';
    btnRemover.classList.remove('d-none');
    definirSomenteLeitura(true);
    btnRemover.disabled = !(await vwGetAnimalByID());
    btnRemover.addEventListener('click', function() {
      vwDeleteAnimal();
    });
  }
});

function definirSomenteLeitura(ativo) {
  ['nome', 'datanasc'].forEach(function(campoId) {
    document.getElementById(campoId).disabled = ativo;
  });
}

function montarAnimalDoFormulario() {
  return {
    nome: document.getElementById('nome').value.trim(),
    datanasc: document.getElementById('datanasc').value
  };
}

function lerIdDaUrl() {
  var animalId = new URLSearchParams(window.location.search).get('animalId');

  if (!animalId || !/^\d+$/.test(animalId) || Number(animalId) <= 0) {
    throw new Error('ID do animal inválido.');
  }

  return animalId;
}

async function vwInsertAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnInserir = document.getElementById('btnInserirAnimal');

  try {
    if (!form.reportValidity()) {
      return;
    }

    btnInserir.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/insertAnimal', {
      method: 'POST',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAnimalDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível inserir o animal.');
    }

    alert('Animal cadastrado com sucesso.');
    window.location.href = '/animais';
  } catch (error) {
    alert(error.message || 'Erro ao inserir animal.');
  } finally {
    btnInserir.disabled = false;
  }
}

async function vwGetAnimalByID() {
  var form = document.getElementById('frmAnimais');

  try {
    var animalId = lerIdDaUrl();

    var response = await fetch(form.dataset.servidorDw3 + '/getAnimalByID/' + encodeURIComponent(animalId), {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return false;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    var animal = data.registro[0];

    if (!animal) {
      throw new Error('Animal não encontrado.');
    }

    document.getElementById('grupoId').classList.remove('d-none');
    document.getElementById('animalid').value = animal.animalid;
    document.getElementById('idVisivel').value = animal.animalid;
    document.getElementById('nome').value = animal.nome ?? '';
    document.getElementById('datanasc').value = animal.datanasc ?? '';
    return true;
  } catch (error) {
    alert(error.message || 'Erro ao carregar animal.');
    return false;
  }
}

async function vwUpdateAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnAtualizar = document.getElementById('btnAtualizarAnimal');

  if (btnAtualizar.disabled || !form.reportValidity()) {
    return;
  }

  try {
    var animalId = lerIdDaUrl();

    btnAtualizar.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/updateAnimal/' + encodeURIComponent(animalId), {
      method: 'PUT',
      headers: dw3MontarHeadersAutenticacao({
        'content-type': 'application/json'
      }),
      body: JSON.stringify(montarAnimalDoFormulario())
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível atualizar o animal.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum animal foi atualizado.');
    }

    alert('Animal atualizado com sucesso.');
    window.location.href = '/animais';
  } catch (error) {
    alert(error.message || 'Erro ao atualizar animal.');
  } finally {
    btnAtualizar.disabled = false;
  }
}

async function vwDeleteAnimal() {
  var form = document.getElementById('frmAnimais');
  var btnRemover = document.getElementById('btnRemoverAnimal');

  if (btnRemover.disabled) {
    return;
  }

  if (!window.confirm('Confirma a remoção deste animal?')) {
    return;
  }

  try {
    var animalId = document.getElementById('animalid').value;

    btnRemover.disabled = true;

    var response = await fetch(form.dataset.servidorDw3 + '/deleteAnimal/' + encodeURIComponent(animalId), {
      method: 'DELETE',
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok') {
      throw new Error(data.status || 'Não foi possível remover o animal.');
    }

    if (data.linhasAfetadas !== 1) {
      throw new Error('Nenhum animal foi removido.');
    }

    alert('Animal removido com sucesso.');
    window.location.href = '/animais';
  } catch (error) {
    alert(error.message || 'Erro ao remover animal.');
    btnRemover.disabled = false;
  }
}
