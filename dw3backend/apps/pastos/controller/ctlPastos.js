const mdlPastos = require("../model/mdlPastos");

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

function validarPasto(registro) {
  registro.descricao = String(registro.descricao || "").trim();

  if (!registro.descricao || registro.descricao.length > 60) {
    return "Informe a descrição do pasto com até 60 caracteres.";
  }

  const areaTexto = String(registro.areatotal === undefined || registro.areatotal === null ? "" : registro.areatotal)
    .trim()
    .replace(",", ".");

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(areaTexto) || Number(areaTexto) <= 0) {
    return "Informe uma área total maior que zero, com até duas casas decimais.";
  }

  registro.areatotal = areaTexto;
  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllPastos = (req, res) =>
  (async () => {
    try {
      let registro = await mdlPastos.GetAllPastos();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPastos|GetAllPastos]", error.message);
      res.json({ status: "Não foi possível consultar os pastos.", registro: [] });
    }
  })();

const GetPastoByID = (req, res) =>
  (async () => {
    try {
      const pastoID = lerID(req.params.pastoid);
      if (!pastoID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlPastos.GetPastoByID(pastoID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPastos|GetPastoByID]", error.message);
      res.json({ status: "Não foi possível consultar o pasto.", registro: [] });
    }
  })();

const InsertPasto = (request, res) =>
  (async () => {
    try {
      const pastoREG = request.body || {};
      const erro = validarPasto(pastoREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPastos.InsertPasto(pastoREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlPastos|InsertPasto]", error.message);
      res.json({ status: "Não foi possível inserir o pasto.", linhasAfetadas: -1 });
    }
  })();

const UpdatePasto = (request, res) =>
  (async () => {
    try {
      const pastoID = lerID(request.params.pastoid);
      if (!pastoID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const pastoREG = request.body || {};
      const erro = validarPasto(pastoREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPastos.UpdatePasto(pastoID, pastoREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPastos|UpdatePasto]", error.message);
      res.json({ status: "Não foi possível atualizar o pasto.", linhasAfetadas: -1 });
    }
  })();

const DeletePasto = (request, res) =>
  (async () => {
    try {
      const pastoID = lerID(request.params.pastoid);
      if (!pastoID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlPastos.DeletePasto(pastoID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPastos|DeletePasto]", error.message);
      res.json({ status: "Não foi possível remover o pasto.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllPastos,
  GetPastoByID,
  InsertPasto,
  UpdatePasto,
  DeletePasto,
};
