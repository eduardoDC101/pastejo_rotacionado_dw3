const express = require("express");
const routerApp = express.Router();

const appPastos = require("../apps/pastos/controller/ctlPastos");
const appPiquetes = require("../apps/piquetes/controller/ctlPiquetes");
const appAnimais = require("../apps/animais/controller/ctlAnimais");
const appAlocados = require("../apps/alocados/controller/ctlAlocados");
const appLogin = require("../apps/login/controller/ctlLogin");

routerApp.use((req, res, next) => {
  next();
});

routerApp.get("/", (req, res) => {
  res.send("API de Pastejo Rotacionado");
});

//Rotas de Pastos
routerApp.get("/getAllPastos", appLogin.AutenticaJWT, appPastos.GetAllPastos);
routerApp.get("/getPastoByID/:pastoid", appLogin.AutenticaJWT, appPastos.GetPastoByID);
routerApp.post("/insertPasto", appLogin.AutenticaJWT, appPastos.InsertPasto);
routerApp.put("/updatePasto/:pastoid", appLogin.AutenticaJWT, appPastos.UpdatePasto);
routerApp.delete("/deletePasto/:pastoid", appLogin.AutenticaJWT, appPastos.DeletePasto);

//Rotas de Piquetes
routerApp.get("/getAllPiquetes", appLogin.AutenticaJWT, appPiquetes.GetAllPiquetes);
routerApp.get("/getPiqueteByID/:piqueteid", appLogin.AutenticaJWT, appPiquetes.GetPiqueteByID);
routerApp.post("/insertPiquete", appLogin.AutenticaJWT, appPiquetes.InsertPiquete);
routerApp.put("/updatePiquete/:piqueteid", appLogin.AutenticaJWT, appPiquetes.UpdatePiquete);
routerApp.delete("/deletePiquete/:piqueteid", appLogin.AutenticaJWT, appPiquetes.DeletePiquete);

//Rotas de Animais
routerApp.get("/getAllAnimais", appLogin.AutenticaJWT, appAnimais.GetAllAnimais);
routerApp.get("/getAnimalByID/:animalid", appLogin.AutenticaJWT, appAnimais.GetAnimalByID);
routerApp.post("/insertAnimal", appLogin.AutenticaJWT, appAnimais.InsertAnimal);
routerApp.put("/updateAnimal/:animalid", appLogin.AutenticaJWT, appAnimais.UpdateAnimal);
routerApp.delete("/deleteAnimal/:animalid", appLogin.AutenticaJWT, appAnimais.DeleteAnimal);

//Rotas de Alocados
routerApp.get("/getAllAlocados", appLogin.AutenticaJWT, appAlocados.GetAllAlocados);
routerApp.get("/getAlocadoByID/:alocadoid", appLogin.AutenticaJWT, appAlocados.GetAlocadoByID);
routerApp.post("/insertAlocado", appLogin.AutenticaJWT, appAlocados.InsertAlocado);
routerApp.put("/updateAlocado/:alocadoid", appLogin.AutenticaJWT, appAlocados.UpdateAlocado);
routerApp.delete("/deleteAlocado/:alocadoid", appLogin.AutenticaJWT, appAlocados.DeleteAlocado);

// Rota Login
routerApp.post("/Login", appLogin.Login);
routerApp.post("/Logout", appLogin.Logout);

module.exports = routerApp;
