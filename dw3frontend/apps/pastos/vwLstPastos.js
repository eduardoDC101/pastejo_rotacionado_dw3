document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('pastosListagem');
  var alertBox = document.getElementById('pastosAlert');

  if (!listagem) {
    return;
  }

  vwGetAllPastos(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesPastos();
});

async function vwGetAllPastos(servidorDw3, alertBox) {
  var carregando = document.getElementById('pastosCarregando');
  var listagem = document.getElementById('pastosListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllPastos', {
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
    inicializarTabelaPastos(data.registro);
  } catch (error) {
    carregando.classList.add('d-none');
    exibirErro(alertBox, error.message || 'Erro ao carregar pastos.');
  }
}

function inicializarTabelaPastos(pastos) {
  new DataTable('#tblPastos', {
    data: pastos,
    columns: [
      { data: 'pastoid', defaultContent: '' },
      { data: 'descricao', defaultContent: '' },
      {
        data: 'areatotal',
        defaultContent: '',
        render: function(data, type) {
          if (type !== 'display' || data === null || data === undefined || data === '') {
            return data;
          }

          return Number(data).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: function(data, type, row) {
          if (type !== 'display') {
            return '';
          }

          var pastoId = escaparHtml(row.pastoid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações do pasto">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-pastoid="' + pastoId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-pastoid="' + pastoId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-pastoid="' + pastoId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhum pasto cadastrado.',
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

function configurarOperacoesPastos() {
  var tabela = document.getElementById('tblPastos');

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-pastoid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var pastoId = encodeURIComponent(botao.dataset.pastoid);

    if (action === 'visualizar') {
      window.location.href = '/pastos/form?oper=Re&pastoId=' + pastoId;
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/pastos/form?oper=Up&pastoId=' + pastoId;
      return;
    }

    if (action === 'remover') {
      window.location.href = '/pastos/form?oper=De&pastoId=' + pastoId;
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
