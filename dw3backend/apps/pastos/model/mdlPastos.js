const db = require("../../../database/databaseconfig");

const GetAllPastos = async () => {
  return (
    await db.query(
      "SELECT * FROM pasto WHERE removido = false ORDER BY descricao ASC"
    )
  ).rows;
};

const GetPastoByID = async (pastoIDPar) => {
  return (
    await db.query(
      "SELECT * FROM pasto WHERE pastoid = $1 AND removido = false",
      [pastoIDPar]
    )
  ).rows;
};

const InsertPasto = async (pastoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO pasto (descricao, areatotal, removido) " +
          "VALUES ($1, $2, false)",
        [pastoREGPar.descricao, pastoREGPar.areatotal]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPastos|InsertPasto]", error.detail || error.message);
    msg = "Não foi possível inserir o pasto.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdatePasto = async (pastoIDPar, pastoREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE pasto SET descricao = $2, areatotal = $3 " +
          "WHERE pastoid = $1 AND removido = false",
        [pastoIDPar, pastoREGPar.descricao, pastoREGPar.areatotal]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPastos|UpdatePasto]", error.detail || error.message);
    msg = "Não foi possível atualizar o pasto.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

async function possuiPiquetesAtivos(pastoIDPar) {
  const consulta = await db.query(
    "SELECT piqueteid FROM piquete WHERE pastoidfk = $1 AND removido = false LIMIT 1",
    [pastoIDPar]
  );
  return consulta.rowCount > 0;
}

const DeletePasto = async (pastoIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    if (await possuiPiquetesAtivos(pastoIDPar)) {
      return { msg: "Pasto possui piquetes ativos.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE pasto SET removido = true WHERE pastoid = $1 AND removido = false",
        [pastoIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlPastos|DeletePasto]", error.detail || error.message);
    msg = "Não foi possível remover o pasto.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllPastos,
  GetPastoByID,
  InsertPasto,
  UpdatePasto,
  DeletePasto,
};
