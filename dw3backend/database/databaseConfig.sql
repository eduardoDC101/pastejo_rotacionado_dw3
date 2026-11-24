CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    usuarioid bigserial CONSTRAINT pk_usuarios PRIMARY KEY,
    username varchar(30) UNIQUE NOT NULL,
    password text NOT NULL,
    removido boolean DEFAULT false NOT NULL
);

INSERT INTO usuarios (username, password)
VALUES ('admin', crypt('admin', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS pasto (
    pastoid bigserial CONSTRAINT pk_pasto PRIMARY KEY,
    descricao varchar(60) NOT NULL,
    areatotal numeric(10, 2) NOT NULL CONSTRAINT ck_pasto_areatotal CHECK (areatotal > 0),
    removido boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS piquete (
    piqueteid bigserial CONSTRAINT pk_piquete PRIMARY KEY,
    descricao varchar(60) NOT NULL,
    latitude numeric(9, 6) NOT NULL CONSTRAINT ck_piquete_latitude CHECK (latitude BETWEEN -90 AND 90),
    longitude numeric(9, 6) NOT NULL CONSTRAINT ck_piquete_longitude CHECK (longitude BETWEEN -180 AND 180),
    pastoidfk bigint NOT NULL CONSTRAINT fk_piquete_pasto REFERENCES pasto (pastoid),
    removido boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS animal (
    animalid bigserial CONSTRAINT pk_animal PRIMARY KEY,
    nome varchar(60) NOT NULL,
    datanasc date NOT NULL,
    removido boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS alocado (
    alocadoid bigserial CONSTRAINT pk_alocado PRIMARY KEY,
    animalidfk bigint NOT NULL CONSTRAINT fk_alocado_animal REFERENCES animal (animalid),
    piqueteidfk bigint NOT NULL CONSTRAINT fk_alocado_piquete REFERENCES piquete (piqueteid),
    datainicio date NOT NULL,
    datafinal date,
    removido boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_alocado_datas CHECK (datafinal IS NULL OR datafinal >= datainicio)
);

INSERT INTO pasto (descricao, areatotal)
SELECT 'Pasto Norte', 12.50
WHERE NOT EXISTS (SELECT 1 FROM pasto WHERE descricao = 'Pasto Norte');

INSERT INTO pasto (descricao, areatotal)
SELECT 'Pasto Sul', 8.75
WHERE NOT EXISTS (SELECT 1 FROM pasto WHERE descricao = 'Pasto Sul');

INSERT INTO piquete (descricao, latitude, longitude, pastoidfk)
SELECT 'Piquete N1', -20.421530, -49.972810, pasto.pastoid
FROM pasto
WHERE pasto.descricao = 'Pasto Norte'
  AND NOT EXISTS (SELECT 1 FROM piquete WHERE descricao = 'Piquete N1');

INSERT INTO piquete (descricao, latitude, longitude, pastoidfk)
SELECT 'Piquete N2', -20.422910, -49.973640, pasto.pastoid
FROM pasto
WHERE pasto.descricao = 'Pasto Norte'
  AND NOT EXISTS (SELECT 1 FROM piquete WHERE descricao = 'Piquete N2');

INSERT INTO piquete (descricao, latitude, longitude, pastoidfk)
SELECT 'Piquete S1', -20.430120, -49.981050, pasto.pastoid
FROM pasto
WHERE pasto.descricao = 'Pasto Sul'
  AND NOT EXISTS (SELECT 1 FROM piquete WHERE descricao = 'Piquete S1');

INSERT INTO animal (nome, datanasc)
SELECT 'Mimosa', DATE '2021-03-15'
WHERE NOT EXISTS (SELECT 1 FROM animal WHERE nome = 'Mimosa');

INSERT INTO animal (nome, datanasc)
SELECT 'Estrela', DATE '2022-07-02'
WHERE NOT EXISTS (SELECT 1 FROM animal WHERE nome = 'Estrela');

INSERT INTO animal (nome, datanasc)
SELECT 'Trovão', DATE '2020-11-20'
WHERE NOT EXISTS (SELECT 1 FROM animal WHERE nome = 'Trovão');

INSERT INTO alocado (animalidfk, piqueteidfk, datainicio, datafinal)
SELECT animal.animalid, piquete.piqueteid, DATE '2026-11-01', DATE '2026-11-10'
FROM animal, piquete
WHERE animal.nome = 'Mimosa'
  AND piquete.descricao = 'Piquete N1'
  AND NOT EXISTS (SELECT 1 FROM alocado WHERE alocado.animalidfk = animal.animalid);

INSERT INTO alocado (animalidfk, piqueteidfk, datainicio, datafinal)
SELECT animal.animalid, piquete.piqueteid, DATE '2026-11-11', NULL
FROM animal, piquete
WHERE animal.nome = 'Estrela'
  AND piquete.descricao = 'Piquete N2'
  AND NOT EXISTS (SELECT 1 FROM alocado WHERE alocado.animalidfk = animal.animalid);
