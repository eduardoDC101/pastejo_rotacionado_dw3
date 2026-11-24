document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  var listagem = document.getElementById('alocadosListagem');
  var alertBox = document.getElementById('alocadosAlert');

  if (!listagem) {
    return;
  }

  vwGetAllAlocados(listagem.dataset.servidorDw3, alertBox);
  configurarOperacoesAlocados();
});

async function vwGetAllAlocados(servidorDw3, alertBox) {
  var carregando = document.getElementById('alocadosCarregando');
  var listagem = document.getElementById('alocadosListagem');

  try {
    if (!servidorDw3) {
      throw new Error('Endereço do servidor backend não configurado.');
    }

    var response = await fetch(servidorDw3 + '/getAllAlocados', {
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
    inicializarTabelaAlocados(data.registro);
  } catch (error) {
    carregando.classList.add('d-none');
    exibirErro(alertBox, error.message || 'Erro ao carregar alocações.');
  }
}

function formatarData(data, type) {
  if (type !== 'display' || !data) {
    return data;
  }

  var partes = String(data).split('-');
  return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : data;
}

function inicializarTabelaAlocados(alocados) {
  new DataTable('#tblAlocados', {
    data: alocados,
    order: [],
    columns: [
      { data: 'alocadoid', defaultContent: '' },
      { data: 'nomeanimal', defaultContent: '' },
      { data: 'descricaopiquete', defaultContent: '' },
      { data: 'datainicio', defaultContent: '', render: formatarData },
      {
        data: 'datafinal',
        defaultContent: '',
        render: function(data, type) {
          if (!data) {
            return type === 'display' ? 'Em aberto' : '';
          }

          return formatarData(data, type);
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

          var alocadoId = escaparHtml(row.alocadoid || '');

          return [
            '<div class="btn-group btn-group-sm" role="group" aria-label="Operações da alocação">',
            '<button class="btn btn-outline-primary" type="button" data-action="visualizar" data-alocadoid="' + alocadoId + '" title="Visualizar" aria-label="Visualizar"><i class="bi bi-eye"></i></button>',
            '<button class="btn btn-outline-secondary" type="button" data-action="atualizar" data-alocadoid="' + alocadoId + '" title="Atualizar" aria-label="Atualizar"><i class="bi bi-pencil-square"></i></button>',
            '<button class="btn btn-outline-danger" type="button" data-action="remover" data-alocadoid="' + alocadoId + '" title="Remover" aria-label="Remover"><i class="bi bi-trash"></i></button>',
            '</div>'
          ].join('');
        }
      }
    ],
    language: {
      emptyTable: 'Nenhuma alocação cadastrada.',
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

function configurarOperacoesAlocados() {
  var tabela = document.getElementById('tblAlocados');

  tabela.addEventListener('click', function(event) {
    var botao = event.target.closest('button[data-action][data-alocadoid]');

    if (!botao) {
      return;
    }

    var action = botao.dataset.action;
    var alocadoId = encodeURIComponent(botao.dataset.alocadoid);

    if (action === 'visualizar') {
      window.location.href = '/alocados/form?oper=Re&alocadoId=' + alocadoId;
      return;
    }

    if (action === 'atualizar') {
      window.location.href = '/alocados/form?oper=Up&alocadoId=' + alocadoId;
      return;
    }

    if (action === 'remover') {
      window.location.href = '/alocados/form?oper=De&alocadoId=' + alocadoId;
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
