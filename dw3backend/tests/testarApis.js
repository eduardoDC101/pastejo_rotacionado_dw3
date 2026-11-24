const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const base = "http://localhost:40000";
let falhas = 0;

function assert(condicao, nome, extra) {
  if (condicao) {
    console.log("PASS " + nome);
    return;
  }

  falhas += 1;
  console.log("FAIL " + nome + (extra ? " | " + JSON.stringify(extra) : ""));
}

async function req(method, caminho, opcoes) {
  const headers = {};
  const token = opcoes && opcoes.token;
  const body = opcoes && opcoes.body;

  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  const response = await fetch(base + caminho, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = { parseError: true };
  }

  return { http: response.status, data };
}

async function main() {
  const sufixo = String(Date.now()).slice(-8);

  const loginRuim = await req("POST", "/Login", { body: { username: "admin", password: "errada" } });
  assert(!loginRuim.data.token, "login com senha errada não devolve token", loginRuim.data);

  const login = await req("POST", "/Login", { body: { username: "admin", password: "admin" } });
  const token = login.data && login.data.token;
  assert(login.data.auth === true && !!token && login.data.username === "admin", "login admin devolve JWT e username", login.data);

  const rotasProtegidas = [
    ["GET", "/getAllPastos"], ["GET", "/getPastoByID/1"], ["POST", "/insertPasto"], ["PUT", "/updatePasto/1"], ["DELETE", "/deletePasto/1"],
    ["GET", "/getAllPiquetes"], ["GET", "/getPiqueteByID/1"], ["POST", "/insertPiquete"], ["PUT", "/updatePiquete/1"], ["DELETE", "/deletePiquete/1"],
    ["GET", "/getAllAnimais"], ["GET", "/getAnimalByID/1"], ["POST", "/insertAnimal"], ["PUT", "/updateAnimal/1"], ["DELETE", "/deleteAnimal/1"],
    ["GET", "/getAllAlocados"], ["GET", "/getAlocadoByID/1"], ["POST", "/insertAlocado"], ["PUT", "/updateAlocado/1"], ["DELETE", "/deleteAlocado/1"],
  ];

  for (const [metodo, rota] of rotasProtegidas) {
    const corpo = metodo === "GET" ? undefined : {};
    const semToken = await req(metodo, rota, { body: corpo });
    const tokenRuim = await req(metodo, rota, { token: "token-invalido", body: corpo });
    assert(
      semToken.data.auth === false && tokenRuim.data.auth === false,
      metodo + " " + rota + " recusa sem token e com token inválido",
      { semToken: semToken.data, tokenRuim: tokenRuim.data }
    );
  }

  const tokenExpirado = jwt.sign({ username: "admin" }, process.env.SECRET_API, { expiresIn: -10 });
  const comTokenExpirado = await req("GET", "/getAllPastos", { token: tokenExpirado });
  assert(
    comTokenExpirado.data.auth === false && comTokenExpirado.data.message === "JWT inválido ou expirado",
    "GetAllPastos recusa token expirado",
    comTokenExpirado.data
  );

  // ---------- Pasto ----------
  const pastoInvalido = await req("POST", "/insertPasto", { token, body: { descricao: "", areatotal: -1 } });
  assert(pastoInvalido.data.status !== "ok" && pastoInvalido.data.linhasAfetadas === 0, "InsertPasto rejeita dados inválidos", pastoInvalido.data);

  const descPasto = "Pasto Teste " + sufixo;
  const insPasto = await req("POST", "/insertPasto", { token, body: { descricao: descPasto, areatotal: "20,50" } });
  assert(insPasto.data.status === "ok" && insPasto.data.linhasAfetadas === 1, "InsertPasto", insPasto.data);

  const pastos = await req("GET", "/getAllPastos", { token });
  const pasto = pastos.data.registro.find((item) => item.descricao === descPasto);
  assert(!!pasto && String(pasto.areatotal) === "20.50", "GetAllPastos traz o pasto inserido com decimal", pasto);
  assert(pastos.data.registro.every((item) => item.removido === false), "GetAllPastos só traz removido = false");

  const pastoPorId = await req("GET", "/getPastoByID/" + pasto.pastoid, { token });
  assert(pastoPorId.data.registro.length === 1 && pastoPorId.data.registro[0].pastoid === pasto.pastoid, "GetPastoByID", pastoPorId.data);

  const pastoIdRuim = await req("GET", "/getPastoByID/abc", { token });
  assert(pastoIdRuim.data.status === "ID inválido.", "GetPastoByID com ID inválido", pastoIdRuim.data);

  const updPasto = await req("PUT", "/updatePasto/" + pasto.pastoid, { token, body: { descricao: descPasto + " A", areatotal: 21 } });
  assert(updPasto.data.status === "ok" && updPasto.data.linhasAfetadas === 1, "UpdatePasto", updPasto.data);

  const pastoAlterado = await req("GET", "/getPastoByID/" + pasto.pastoid, { token });
  assert(pastoAlterado.data.registro[0].descricao === descPasto + " A", "UpdatePasto alterou o registro correto", pastoAlterado.data);

  // ---------- Piquete ----------
  const piqueteSemPasto = await req("POST", "/insertPiquete", {
    token,
    body: { descricao: "Sem pasto", latitude: -20.4, longitude: -49.9, pastoidfk: 999999 },
  });
  assert(piqueteSemPasto.data.status === "Pasto inexistente ou removido.", "InsertPiquete rejeita pasto inexistente", piqueteSemPasto.data);

  const piqueteCoordRuim = await req("POST", "/insertPiquete", {
    token,
    body: { descricao: "Coord ruim", latitude: 95, longitude: -49.9, pastoidfk: pasto.pastoid },
  });
  assert(piqueteCoordRuim.data.status !== "ok", "InsertPiquete rejeita latitude fora da faixa", piqueteCoordRuim.data);

  const descPiquete = "Piquete Teste " + sufixo;
  const insPiquete = await req("POST", "/insertPiquete", {
    token,
    body: { descricao: descPiquete, latitude: "-20.425001", longitude: "-49.975002", pastoidfk: pasto.pastoid },
  });
  assert(insPiquete.data.status === "ok" && insPiquete.data.linhasAfetadas === 1, "InsertPiquete", insPiquete.data);

  const piquetes = await req("GET", "/getAllPiquetes", { token });
  const piquete = piquetes.data.registro.find((item) => item.descricao === descPiquete);
  assert(
    !!piquete && piquete.pastoidfk === pasto.pastoid && piquete.descricaopasto === descPasto + " A" && String(piquete.latitude) === "-20.425001",
    "GetAllPiquetes traz pasto relacionado e coordenadas",
    piquete
  );

  const piquetePorId = await req("GET", "/getPiqueteByID/" + piquete.piqueteid, { token });
  assert(piquetePorId.data.registro.length === 1, "GetPiqueteByID", piquetePorId.data);

  const updPiquete = await req("PUT", "/updatePiquete/" + piquete.piqueteid, {
    token,
    body: { descricao: descPiquete, latitude: -20.5, longitude: -50.1, pastoidfk: pasto.pastoid },
  });
  assert(updPiquete.data.status === "ok" && updPiquete.data.linhasAfetadas === 1, "UpdatePiquete", updPiquete.data);

  const pastoComPiquete = await req("DELETE", "/deletePasto/" + pasto.pastoid, { token });
  assert(pastoComPiquete.data.status === "Pasto possui piquetes ativos.", "DeletePasto recusa pasto com piquetes ativos", pastoComPiquete.data);

  // ---------- Animal ----------
  const animalInvalido = await req("POST", "/insertAnimal", { token, body: { nome: "", datanasc: "2023-02-31" } });
  assert(animalInvalido.data.status !== "ok", "InsertAnimal rejeita dados inválidos", animalInvalido.data);

  const nomeAnimal = "Animal Teste " + sufixo;
  const insAnimal = await req("POST", "/insertAnimal", { token, body: { nome: nomeAnimal, datanasc: "2023-05-10" } });
  assert(insAnimal.data.status === "ok" && insAnimal.data.linhasAfetadas === 1, "InsertAnimal", insAnimal.data);

  const animais = await req("GET", "/getAllAnimais", { token });
  const animal = animais.data.registro.find((item) => item.nome === nomeAnimal);
  assert(!!animal && animal.datanasc === "2023-05-10", "GetAllAnimais traz a data preservada", animal);

  const animalPorId = await req("GET", "/getAnimalByID/" + animal.animalid, { token });
  assert(animalPorId.data.registro.length === 1, "GetAnimalByID", animalPorId.data);

  const updAnimal = await req("PUT", "/updateAnimal/" + animal.animalid, { token, body: { nome: nomeAnimal, datanasc: "2023-05-11" } });
  assert(updAnimal.data.status === "ok" && updAnimal.data.linhasAfetadas === 1, "UpdateAnimal", updAnimal.data);

  // ---------- Alocado ----------
  const alocDatas = await req("POST", "/insertAlocado", {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: piquete.piqueteid, datainicio: "2026-11-20", datafinal: "2026-11-10" },
  });
  assert(alocDatas.data.status === "A data final não pode ser anterior à data de início.", "InsertAlocado rejeita datas invertidas", alocDatas.data);

  const alocSemAnimal = await req("POST", "/insertAlocado", {
    token,
    body: { animalidfk: 999999, piqueteidfk: piquete.piqueteid, datainicio: "2026-11-20", datafinal: "" },
  });
  assert(alocSemAnimal.data.status === "Animal inexistente ou removido.", "InsertAlocado rejeita animal inexistente", alocSemAnimal.data);

  const alocSemPiquete = await req("POST", "/insertAlocado", {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: 999999, datainicio: "2026-11-20", datafinal: "" },
  });
  assert(alocSemPiquete.data.status === "Piquete inexistente ou removido.", "InsertAlocado rejeita piquete inexistente", alocSemPiquete.data);

  const insAloc = await req("POST", "/insertAlocado", {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: piquete.piqueteid, datainicio: "2026-11-20", datafinal: "" },
  });
  assert(insAloc.data.status === "ok" && insAloc.data.linhasAfetadas === 1, "InsertAlocado sem data final", insAloc.data);

  const alocados = await req("GET", "/getAllAlocados", { token });
  const alocado = alocados.data.registro.find((item) => item.animalidfk === animal.animalid);
  assert(
    !!alocado && alocado.nomeanimal === nomeAnimal && alocado.descricaopiquete === descPiquete && alocado.datafinal === null,
    "GetAllAlocados traz animal e piquete relacionados",
    alocado
  );

  const alocPorId = await req("GET", "/getAlocadoByID/" + alocado.alocadoid, { token });
  assert(alocPorId.data.registro.length === 1 && alocPorId.data.registro[0].datainicio === "2026-11-20", "GetAlocadoByID", alocPorId.data);

  const updAloc = await req("PUT", "/updateAlocado/" + alocado.alocadoid, {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: piquete.piqueteid, datainicio: "2026-11-20", datafinal: "2026-11-30" },
  });
  assert(updAloc.data.status === "ok" && updAloc.data.linhasAfetadas === 1, "UpdateAlocado", updAloc.data);

  const animalComAloc = await req("DELETE", "/deleteAnimal/" + animal.animalid, { token });
  assert(animalComAloc.data.status === "Animal possui alocações ativas.", "DeleteAnimal recusa animal com alocações ativas", animalComAloc.data);

  const piqueteComAloc = await req("DELETE", "/deletePiquete/" + piquete.piqueteid, { token });
  assert(piqueteComAloc.data.status === "Piquete possui alocações ativas.", "DeletePiquete recusa piquete com alocações ativas", piqueteComAloc.data);

  // ---------- Exclusões lógicas ----------
  const delAloc = await req("DELETE", "/deleteAlocado/" + alocado.alocadoid, { token });
  assert(delAloc.data.status === "ok" && delAloc.data.linhasAfetadas === 1, "DeleteAlocado", delAloc.data);

  const alocRemovido = await req("GET", "/getAlocadoByID/" + alocado.alocadoid, { token });
  assert(alocRemovido.data.registro.length === 0, "GetAlocadoByID não retorna removido", alocRemovido.data);

  const listaAloc = await req("GET", "/getAllAlocados", { token });
  assert(!listaAloc.data.registro.some((item) => item.alocadoid === alocado.alocadoid), "GetAllAlocados não lista removido");

  const updAlocRemovido = await req("PUT", "/updateAlocado/" + alocado.alocadoid, {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: piquete.piqueteid, datainicio: "2026-11-20", datafinal: "" },
  });
  assert(updAlocRemovido.data.status === "Registro não encontrado ou já removido.", "UpdateAlocado recusa registro removido", updAlocRemovido.data);

  const delAlocDeNovo = await req("DELETE", "/deleteAlocado/" + alocado.alocadoid, { token });
  assert(delAlocDeNovo.data.linhasAfetadas === 0, "DeleteAlocado repetido não altera linhas", delAlocDeNovo.data);

  const delAnimal = await req("DELETE", "/deleteAnimal/" + animal.animalid, { token });
  assert(delAnimal.data.status === "ok" && delAnimal.data.linhasAfetadas === 1, "DeleteAnimal", delAnimal.data);

  const animalRemovido = await req("GET", "/getAnimalByID/" + animal.animalid, { token });
  assert(animalRemovido.data.registro.length === 0, "GetAnimalByID não retorna removido", animalRemovido.data);

  const alocAnimalRemovido = await req("POST", "/insertAlocado", {
    token,
    body: { animalidfk: animal.animalid, piqueteidfk: piquete.piqueteid, datainicio: "2026-12-01", datafinal: "" },
  });
  assert(alocAnimalRemovido.data.status === "Animal inexistente ou removido.", "InsertAlocado rejeita animal removido", alocAnimalRemovido.data);

  const delPiquete = await req("DELETE", "/deletePiquete/" + piquete.piqueteid, { token });
  assert(delPiquete.data.status === "ok" && delPiquete.data.linhasAfetadas === 1, "DeletePiquete", delPiquete.data);

  const listaPiquetes = await req("GET", "/getAllPiquetes", { token });
  assert(!listaPiquetes.data.registro.some((item) => item.piqueteid === piquete.piqueteid), "GetAllPiquetes não lista removido");

  const delPasto = await req("DELETE", "/deletePasto/" + pasto.pastoid, { token });
  assert(delPasto.data.status === "ok" && delPasto.data.linhasAfetadas === 1, "DeletePasto", delPasto.data);

  const pastoRemovido = await req("GET", "/getPastoByID/" + pasto.pastoid, { token });
  assert(pastoRemovido.data.registro.length === 0, "GetPastoByID não retorna removido", pastoRemovido.data);

  const piqueteNoPastoRemovido = await req("POST", "/insertPiquete", {
    token,
    body: { descricao: "Depois da remoção", latitude: -20.4, longitude: -49.9, pastoidfk: pasto.pastoid },
  });
  assert(piqueteNoPastoRemovido.data.status === "Pasto inexistente ou removido.", "InsertPiquete rejeita pasto removido", piqueteNoPastoRemovido.data);

  // ---------- Conferência direta no PostgreSQL ----------
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });

  const linhaPasto = await pool.query("SELECT removido FROM pasto WHERE pastoid = $1", [pasto.pastoid]);
  const linhaPiquete = await pool.query("SELECT removido FROM piquete WHERE piqueteid = $1", [piquete.piqueteid]);
  const linhaAnimal = await pool.query("SELECT removido FROM animal WHERE animalid = $1", [animal.animalid]);
  const linhaAloc = await pool.query("SELECT removido, datafinal FROM alocado WHERE alocadoid = $1", [alocado.alocadoid]);
  const senha = await pool.query("SELECT password FROM usuarios WHERE username = $1", ["admin"]);

  assert(linhaPasto.rowCount === 1 && linhaPasto.rows[0].removido === true, "pasto removido continua no PostgreSQL");
  assert(linhaPiquete.rowCount === 1 && linhaPiquete.rows[0].removido === true, "piquete removido continua no PostgreSQL");
  assert(linhaAnimal.rowCount === 1 && linhaAnimal.rows[0].removido === true, "animal removido continua no PostgreSQL");
  assert(linhaAloc.rowCount === 1 && linhaAloc.rows[0].removido === true, "alocação removida continua no PostgreSQL");
  assert(senha.rows[0].password !== "admin" && senha.rows[0].password.startsWith("$2"), "senha do admin não está em texto puro");

  await pool.end();

  if (falhas > 0) {
    console.log("RESULTADO " + falhas + " falha(s)");
    process.exit(1);
  }

  console.log("RESULTADO todos os testes passaram");
}

main().catch((error) => {
  console.error("ERRO", error);
  process.exit(1);
});
