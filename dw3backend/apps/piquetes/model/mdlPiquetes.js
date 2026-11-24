const db = require("../../../database/databaseconfig");

const GetAllPiquetes = async () => {
  return (
    await db.query(
      "SELECT piquete.*, " +
        "(SELECT descricao FROM pasto WHERE pasto.pastoid = piquete.pastoidfk) AS descricaopasto " +
        "FROM piquete WHERE piquete.removido = false " +
        "ORDER BY piquete.descricao ASC"
    )
  ).rows;
};

const GetPiqueteByID = async (piqueteIDPar) => {
  return (
    await db.query(
      "SELECT piquete.*, " +
        "(SELECT descricao FROM pasto WHERE pasto.pastoid = piquete.pastoidfk) AS descricaopasto " +
        "FROM piquete WHERE piquete.piqueteid = $1 AND piquete.removido = false",
      [piqueteIDPar]
    )
  ).rows;
};

async function pastoAtivo(pastoIDPar) {
  const consulta = await db.query(
    "SELECT pastoid FROM pasto WHERE pastoid = $1 AND removido = false",
    [pastoIDPar]
  );
  return consulta.rowCount > 0;
}

const InsertPiquete = async (piqueteREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    if (!(await pastoAtivo(piqueteREGPar.pastoidfk))) {
      return { msg: "Pasto inexistente ou removido.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "INSERT INTO piquete (descricao, latitude, longitude, pastoidfk, removido) " +
          "VALUES ($1, $2, $3, $4, false)",
        [
          piqueteREGPar.descricao,
          piqueteREGPar.latitude,
          piqueteREGPar.longitude,
          piqueteREGPar.pastoidfk,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPiquetes|InsertPiquete]", error.detail || error.message);
    msg = "Não foi possível inserir o piquete.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdatePiquete = async (piqueteIDPar, piqueteREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    if (!(await pastoAtivo(piqueteREGPar.pastoidfk))) {
      return { msg: "Pasto inexistente ou removido.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE piquete SET descricao = $2, latitude = $3, longitude = $4, pastoidfk = $5 " +
          "WHERE piqueteid = $1 AND removido = false",
        [
          piqueteIDPar,
          piqueteREGPar.descricao,
          piqueteREGPar.latitude,
          piqueteREGPar.longitude,
          piqueteREGPar.pastoidfk,
        ]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPiquetes|UpdatePiquete]", error.detail || error.message);
    msg = "Não foi possível atualizar o piquete.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

async function possuiAlocacoesAtivas(piqueteIDPar) {
  const consulta = await db.query(
    "SELECT alocadoid FROM alocado WHERE piqueteidfk = $1 AND removido = false LIMIT 1",
    [piqueteIDPar]
  );
  return consulta.rowCount > 0;
}

const DeletePiquete = async (piqueteIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    if (await possuiAlocacoesAtivas(piqueteIDPar)) {
      return { msg: "Piquete possui alocações ativas.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE piquete SET removido = true WHERE piqueteid = $1 AND removido = false",
        [piqueteIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPiquetes|DeletePiquete]", error.detail || error.message);
    msg = "Não foi possível remover o piquete.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllPiquetes,
  GetPiqueteByID,
  InsertPiquete,
  UpdatePiquete,
  DeletePiquete,
};
