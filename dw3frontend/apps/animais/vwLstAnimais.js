document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('animaisListagem');
  var alertBox = document.getElementById('animaisAlert');

  if (!listagem) {
    return;
  }

  vwGetAllAnimais(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesAnimais();
});

async function vwGetAllAnimais(servidorDw3, alertBox) {
  var carregando = document.getElementById('animaisCarregando');
  var listagem = document.getElementById('animaisListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllAnimais', {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor backend.');
    }

    carregando.classList.add('d-none');
    listagem.classList.remove('d-none');
    inicializarTabelaAnimais(data.registro);
  } catch (error) {
    carregando.classList.add('d-none');
    exibirErro(alertBox, error.message || 'Erro ao carregar animais.');
  }
}

function formatarData(data, type) {
  if (type !== 'display' || !data) {
    return data;
  }

  var partes = String(data).split('-');
  return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : data;
}

function inicializarTabelaAnimais(animais) {
  new DataTable('#tblAnimais', {
    data: animais,
    columns: [
      { data: 'animalid', defaultContent: '' },
      { data: 'nome', defaultContent: '' },
      { data: 'datanasc', defaultContent: '', render: formatarData },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var animalId = escaparHtml(row.animalid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do animal">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-animalid="' + animalId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-animalid="' + animalId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-animalid="' + animalId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum animal cadastrado.',
      info: 'Mostrando _START_ até _END_ de _TOTAL_ registros',
      infoEmpty: 'Mostrando 0 até 0 de 0 registros',
      infoFiltered: '(filtrado de _MAX_ registros no total)',
      lengthMenu: 'Mostrar _MENU_ registros',
      loadingRecords: 'Carregando...',
      processing: 'Processando...',
      search: 'Pesquisar:',
      zeroRecords: 'Nenhum registro encontrado',
      paginate: {
        first: 'Primeiro',
        last: 'Último',
        next: 'Próximo',
        previous: 'Anterior'
      }
    }
  });
}

function configurarOperacoesAnimais() {
  var tabela = document.getElementById('tblAnimais');

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-animalid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var animalId = encodeURIComponent(botao.dataset.animalid);

    if (action === 'visualizar') {
      window.location.href = '/animais/form?oper=Re&animalId=' + animalId;
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/animais/form?oper=Up&animalId=' + animalId;
      return;
    }

    if (action === 'remover') {
      window.location.href = '/animais/form?oper=De&animalId=' + animalId;
    }
  });
}

function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function exibirErro(alertBox, mensagem) {
  alertBox.textContent = mensagem;
  alertBox.classList.add('alert-danger');
  alertBox.classList.remove('d-none');
}
