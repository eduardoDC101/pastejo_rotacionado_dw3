document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('piquetesListagem');
  var alertBox = document.getElementById('piquetesAlert');

  if (!listagem) {
    return;
  }

  vwGetAllPiquetes(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesPiquetes();
});

async function vwGetAllPiquetes(servidorDw3, alertBox) {
  var carregando = document.getElementById('piquetesCarregando');
  var listagem = document.getElementById('piquetesListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllPiquetes', {
      headers: dw3MontarHeadersAutenticacao()
    });
    var data = await response.json();

    if (!dw3TratarRespostaAutenticacao(data)) {
      return;
    }

    if (data.status !== 'ok' || !Array.isArray(data.registro)) {
      throw new Error(data.status || 'Resposta inválida do servidor.');
    }

    carregando.classList.add('d-none');
    listagem.classList.remove('d-none');
    inicializarTabelaPiquetes(data.registro);
  } catch (error) {
    carregando.classList.add('d-none');
    exibirErro(alertBox, error.message || 'Erro ao carregar piquetes.');
  }
}

function formatarCoordenada(data, type) {
  if (type !== 'display' || data === null || data === undefined || data === '') {
    return data;
  }

  return Number(data).toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

function inicializarTabelaPiquetes(piquetes) {
  new DataTable('#tblPiquetes', {
    data: piquetes,
    columns: [
      { data: 'piqueteid', defaultContent: '' },
      { data: 'descricao', defaultContent: '' },
      { data: 'descricaopasto', defaultContent: '' },
      { data: 'latitude', defaultContent: '', render: formatarCoordenada },
      { data: 'longitude', defaultContent: '', render: formatarCoordenada },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var piqueteId = escaparHtml(row.piqueteid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do piquete">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-piqueteid="' + piqueteId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-piqueteid="' + piqueteId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-piqueteid="' + piqueteId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum piquete cadastrado.',
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

function configurarOperacoesPiquetes() {
  var tabela = document.getElementById('tblPiquetes');

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-piqueteid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var piqueteId = encodeURIComponent(botao.dataset.piqueteid);

    if (action === 'visualizar') {
      window.location.href = '/piquetes/form?oper=Re&piqueteId=' + piqueteId;
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/piquetes/form?oper=Up&piqueteId=' + piqueteId;
      return;
    }

    if (action === 'remover') {
      window.location.href = '/piquetes/form?oper=De&piqueteId=' + piqueteId;
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
