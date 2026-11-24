const db = require("../../../database/databaseconfig");

const GetAllAlocados = async () => {
  return (
    await db.query(
      "SELECT alocado.*, " +
        "(SELECT nome FROM animal WHERE animal.animalid = alocado.animalidfk) AS nomeanimal, " +
        "(SELECT descricao FROM piquete WHERE piquete.piqueteid = alocado.piqueteidfk) AS descricaopiquete " +
        "FROM alocado WHERE alocado.removido = false " +
        "ORDER BY alocado.datainicio DESC, alocado.alocadoid DESC"
    )
  ).rows;
};

const GetAlocadoByID = async (alocadoIDPar) => {
  return (
    await db.query(
      "SELECT alocado.*, " +
        "(SELECT nome FROM animal WHERE animal.animalid = alocado.animalidfk) AS nomeanimal, " +
        "(SELECT descricao FROM piquete WHERE piquete.piqueteid = alocado.piqueteidfk) AS descricaopiquete " +
        "FROM alocado WHERE alocado.alocadoid = $1 AND alocado.removido = false",
      [alocadoIDPar]
    )
  ).rows;
};

async function validarVinculos(alocadoREGPar) {
  const animal = await db.query(
    "SELECT animalid FROM animal WHERE animalid = $1 AND removido = false",
    [alocadoREGPar.animalidfk]
  );
  if (animal.rowCount === 0) {
    return "Animal inexistente ou removido.";
  }

  const piquete = await db.query(
    "SELECT piqueteid FROM piquete WHERE piqueteid = $1 AND removido = false",
    [alocadoREGPar.piqueteidfk]
  );
  if (piquete.rowCount === 0) {
    return "Piquete inexistente ou removido.";
  }

  return "";
}

const InsertAlocado = async (alocadoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    const erroVinculo = await validarVinculos(alocadoREGPar);
    if (erroVinculo) {
      return { msg: erroVinculo, linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "INSERT INTO alocado (animalidfk, piqueteidfk, datainicio, datafinal, removido) " +
          "VALUES ($1, $2, $3, $4, false)",
        [
          alocadoREGPar.animalidfk,
          alocadoREGPar.piqueteidfk,
          alocadoREGPar.datainicio,
          alocadoREGPar.datafinal,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAlocados|InsertAlocado]", error.detail || error.message);
    msg = "Não foi possível inserir a alocação.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdateAlocado = async (alocadoIDPar, alocadoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    const erroVinculo = await validarVinculos(alocadoREGPar);
    if (erroVinculo) {
      return { msg: erroVinculo, linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE alocado SET animalidfk = $2, piqueteidfk = $3, datainicio = $4, datafinal = $5 " +
          "WHERE alocadoid = $1 AND removido = false",
        [
          alocadoIDPar,
          alocadoREGPar.animalidfk,
          alocadoREGPar.piqueteidfk,
          alocadoREGPar.datainicio,
          alocadoREGPar.datafinal,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAlocados|UpdateAlocado]", error.detail || error.message);
    msg = "Não foi possível atualizar a alocação.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const DeleteAlocado = async (alocadoIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE alocado SET removido = true WHERE alocadoid = $1 AND removido = false",
        [alocadoIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAlocados|DeleteAlocado]", error.detail || error.message);
    msg = "Não foi possível remover a alocação.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllAlocados,
  GetAlocadoByID,
  InsertAlocado,
  UpdateAlocado,
  DeleteAlocado,
};
