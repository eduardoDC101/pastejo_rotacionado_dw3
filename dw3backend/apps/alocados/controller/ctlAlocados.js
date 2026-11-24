const mdlAlocados = require("../model/mdlAlocados");

function lerID(valor) {
  if (!/^\d+$/.test(String(valor || ""))) {
    return null;
  }

  const id = parseInt(valor, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function validarData(valor) {
  const data = String(valor || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return null;
  }

  const partes = data.split("-").map((parte) => parseInt(parte, 10));
  const conferida = new Date(partes[0], partes[1] - 1, partes[2]);
  if (
    conferida.getFullYear() !== partes[0] ||
    conferida.getMonth() !== partes[1] - 1 ||
    conferida.getDate() !== partes[2]
  ) {
    return null;
  }

  return data;
}

function validarAlocado(registro) {
  registro.animalidfk = lerID(registro.animalidfk);
  registro.piqueteidfk = lerID(registro.piqueteidfk);

  if (!registro.animalidfk) {
    return "Selecione um animal.";
  }

  if (!registro.piqueteidfk) {
    return "Selecione um piquete.";
  }

  const dataInicio = validarData(registro.datainicio);
  if (!dataInicio) {
    return "Informe uma data de início válida.";
  }

  registro.datainicio = dataInicio;

  // datafinal vazia indica alocação em aberto
  if (registro.datafinal === undefined || registro.datafinal === null || String(registro.datafinal).trim() === "") {
    registro.datafinal = null;
    return "";
  }

  const dataFinal = validarData(registro.datafinal);
  if (!dataFinal) {
    return "Informe uma data final válida ou deixe o campo vazio.";
  }

  if (dataFinal < dataInicio) {
    return "A data final não pode ser anterior à data de início.";
  }

  registro.datafinal = dataFinal;
  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllAlocados = (req, res) =>
  (async () => {
    try {
      let registro = await mdlAlocados.GetAllAlocados();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlAlocados|GetAllAlocados]", error.message);
      res.json({ status: "Não foi possível consultar as alocações.", registro: [] });
    }
  })();

const GetAlocadoByID = (req, res) =>
  (async () => {
    try {
      const alocadoID = lerID(req.params.alocadoid);
      if (!alocadoID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlAlocados.GetAlocadoByID(alocadoID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlAlocados|GetAlocadoByID]", error.message);
      res.json({ status: "Não foi possível consultar a alocação.", registro: [] });
    }
  })();

const InsertAlocado = (request, res) =>
  (async () => {
    try {
      const alocadoREG = request.body || {};
      const erro = validarAlocado(alocadoREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlAlocados.InsertAlocado(alocadoREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlAlocados|InsertAlocado]", error.message);
      res.json({ status: "Não foi possível inserir a alocação.", linhasAfetadas: -1 });
    }
  })();

const UpdateAlocado = (request, res) =>
  (async () => {
    try {
      const alocadoID = lerID(request.params.alocadoid);
      if (!alocadoID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const alocadoREG = request.body || {};
      const erro = validarAlocado(alocadoREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlAlocados.UpdateAlocado(alocadoID, alocadoREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlAlocados|UpdateAlocado]", error.message);
      res.json({ status: "Não foi possível atualizar a alocação.", linhasAfetadas: -1 });
    }
  })();

const DeleteAlocado = (request, res) =>
  (async () => {
    try {
      const alocadoID = lerID(request.params.alocadoid);
      if (!alocadoID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlAlocados.DeleteAlocado(alocadoID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlAlocados|DeleteAlocado]", error.message);
      res.json({ status: "Não foi possível remover a alocação.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllAlocados,
  GetAlocadoByID,
  InsertAlocado,
  UpdateAlocado,
  DeleteAlocado,
};
