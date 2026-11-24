const db = require("../../../database/databaseconfig");

const GetAllAnimais = async () => {
  return (
    await db.query(
      "SELECT * FROM animal WHERE removido = false ORDER BY nome ASC"
    )
  ).rows;
};

const GetAnimalByID = async (animalIDPar) => {
  return (
    await db.query(
      "SELECT * FROM animal WHERE animalid = $1 AND removido = false",
      [animalIDPar]
    )
  ).rows;
};

const InsertAnimal = async (animalREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "INSERT INTO animal (nome, datanasc, removido) " +
          "VALUES ($1, $2, false)",
        [animalREGPar.nome, animalREGPar.datanasc]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAnimais|InsertAnimal]", error.detail || error.message);
    msg = "Não foi possível inserir o animal.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

const UpdateAnimal = async (animalIDPar, animalREGPar) => {
  let linhasAfetadas;
  let msg = "ok";
  try {
    linhasAfetadas = (
      await db.query(
        "UPDATE animal SET nome = $2, datanasc = $3 " +
          "WHERE animalid = $1 AND removido = false",
        [animalIDPar, animalREGPar.nome, animalREGPar.datanasc]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAnimais|UpdateAnimal]", error.detail || error.message);
    msg = "Não foi possível atualizar o animal.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

async function possuiAlocacoesAtivas(animalIDPar) {
  const consulta = await db.query(
    "SELECT alocadoid FROM alocado WHERE animalidfk = $1 AND removido = false LIMIT 1",
    [animalIDPar]
  );
  return consulta.rowCount > 0;
}

const DeleteAnimal = async (animalIDPar) => {
  let linhasAfetadas;
  let msg = "ok";

  try {
    if (await possuiAlocacoesAtivas(animalIDPar)) {
      return { msg: "Animal possui alocações ativas.", linhasAfetadas: 0 };
    }

    linhasAfetadas = (
      await db.query(
        "UPDATE animal SET removido = true WHERE animalid = $1 AND removido = false",
        [animalIDPar]
      )
    ).rowCount;
  } catch (error) {
    console.error("[mdlAnimais|DeleteAnimal]", error.detail || error.message);
    msg = "Não foi possível remover o animal.";
    linhasAfetadas = -1;
  }

  return { msg, linhasAfetadas };
};

module.exports = {
  GetAllAnimais,
  GetAnimalByID,
  InsertAnimal,
  UpdateAnimal,
  DeleteAnimal,
};
