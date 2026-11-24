const mdlPiquetes = require("../model/mdlPiquetes");

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

function lerCoordenada(valor, limite) {
  const texto = String(valor === undefined || valor === null ? "" : valor)
    .trim()
    .replace(",", ".");

  if (!/^-?\d{1,3}(\.\d{1,6})?$/.test(texto) || Math.abs(Number(texto)) > limite) {
    return null;
  }

  return texto;
}

function validarPiquete(registro) {
  registro.descricao = String(registro.descricao || "").trim();
  registro.pastoidfk = lerID(registro.pastoidfk);

  if (!registro.pastoidfk) {
    return "Selecione um pasto.";
  }

  if (!registro.descricao || registro.descricao.length > 60) {
    return "Informe a descrição do piquete com até 60 caracteres.";
  }

  registro.latitude = lerCoordenada(registro.latitude, 90);
  if (registro.latitude === null) {
    return "Informe uma latitude entre -90 e 90, com até seis casas decimais.";
  }

  registro.longitude = lerCoordenada(registro.longitude, 180);
  if (registro.longitude === null) {
    return "Informe uma longitude entre -180 e 180, com até seis casas decimais.";
  }

  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllPiquetes = (req, res) =>
  (async () => {
    try {
      let registro = await mdlPiquetes.GetAllPiquetes();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPiquetes|GetAllPiquetes]", error.message);
      res.json({ status: "Não foi possível consultar os piquetes.", registro: [] });
    }
  })();

const GetPiqueteByID = (req, res) =>
  (async () => {
    try {
      const piqueteID = lerID(req.params.piqueteid);
      if (!piqueteID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlPiquetes.GetPiqueteByID(piqueteID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlPiquetes|GetPiqueteByID]", error.message);
      res.json({ status: "Não foi possível consultar o piquete.", registro: [] });
    }
  })();

const InsertPiquete = (request, res) =>
  (async () => {
    try {
      const piqueteREG = request.body || {};
      const erro = validarPiquete(piqueteREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPiquetes.InsertPiquete(piqueteREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlPiquetes|InsertPiquete]", error.message);
      res.json({ status: "Não foi possível inserir o piquete.", linhasAfetadas: -1 });
    }
  })();

const UpdatePiquete = (request, res) =>
  (async () => {
    try {
      const piqueteID = lerID(request.params.piqueteid);
      if (!piqueteID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const piqueteREG = request.body || {};
      const erro = validarPiquete(piqueteREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlPiquetes.UpdatePiquete(piqueteID, piqueteREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPiquetes|UpdatePiquete]", error.message);
      res.json({ status: "Não foi possível atualizar o piquete.", linhasAfetadas: -1 });
    }
  })();

const DeletePiquete = (request, res) =>
  (async () => {
    try {
      const piqueteID = lerID(request.params.piqueteid);
      if (!piqueteID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlPiquetes.DeletePiquete(piqueteID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlPiquetes|DeletePiquete]", error.message);
      res.json({ status: "Não foi possível remover o piquete.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllPiquetes,
  GetPiqueteByID,
  InsertPiquete,
  UpdatePiquete,
  DeletePiquete,
};
