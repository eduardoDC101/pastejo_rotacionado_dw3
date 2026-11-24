const mdlAnimais = require("../model/mdlAnimais");

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

function validarAnimal(registro) {
  registro.nome = String(registro.nome || "").trim();

  if (!registro.nome || registro.nome.length > 60) {
    return "Informe o nome do animal com até 60 caracteres.";
  }

  const data = validarData(registro.datanasc);
  if (!data) {
    return "Informe uma data de nascimento válida.";
  }

  registro.datanasc = data;
  return "";
}

function concluirEscrita(res, resultado, mensagemVazia) {
  let msg = resultado.msg;
  if (msg === "ok" && resultado.linhasAfetadas === 0) {
    msg = mensagemVazia;
  }

  res.json({ status: msg, linhasAfetadas: resultado.linhasAfetadas });
}

const GetAllAnimais = (req, res) =>
  (async () => {
    try {
      let registro = await mdlAnimais.GetAllAnimais();
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlAnimais|GetAllAnimais]", error.message);
      res.json({ status: "Não foi possível consultar os animais.", registro: [] });
    }
  })();

const GetAnimalByID = (req, res) =>
  (async () => {
    try {
      const animalID = lerID(req.params.animalid);
      if (!animalID) {
        return res.json({ status: "ID inválido.", registro: [] });
      }

      let registro = await mdlAnimais.GetAnimalByID(animalID);
      res.json({ status: "ok", registro: registro });
    } catch (error) {
      console.error("[ctlAnimais|GetAnimalByID]", error.message);
      res.json({ status: "Não foi possível consultar o animal.", registro: [] });
    }
  })();

const InsertAnimal = (request, res) =>
  (async () => {
    try {
      const animalREG = request.body || {};
      const erro = validarAnimal(animalREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlAnimais.InsertAnimal(animalREG);
      res.json({ status: resultado.msg, linhasAfetadas: resultado.linhasAfetadas });
    } catch (error) {
      console.error("[ctlAnimais|InsertAnimal]", error.message);
      res.json({ status: "Não foi possível inserir o animal.", linhasAfetadas: -1 });
    }
  })();

const UpdateAnimal = (request, res) =>
  (async () => {
    try {
      const animalID = lerID(request.params.animalid);
      if (!animalID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      const animalREG = request.body || {};
      const erro = validarAnimal(animalREG);
      if (erro) {
        return res.json({ status: erro, linhasAfetadas: 0 });
      }

      let resultado = await mdlAnimais.UpdateAnimal(animalID, animalREG);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlAnimais|UpdateAnimal]", error.message);
      res.json({ status: "Não foi possível atualizar o animal.", linhasAfetadas: -1 });
    }
  })();

const DeleteAnimal = (request, res) =>
  (async () => {
    try {
      const animalID = lerID(request.params.animalid);
      if (!animalID) {
        return res.json({ status: "ID inválido.", linhasAfetadas: 0 });
      }

      let resultado = await mdlAnimais.DeleteAnimal(animalID);
      concluirEscrita(res, resultado, "Registro não encontrado ou já removido.");
    } catch (error) {
      console.error("[ctlAnimais|DeleteAnimal]", error.message);
      res.json({ status: "Não foi possível remover o animal.", linhasAfetadas: -1 });
    }
  })();

module.exports = {
  GetAllAnimais,
  GetAnimalByID,
  InsertAnimal,
  UpdateAnimal,
  DeleteAnimal,
};
