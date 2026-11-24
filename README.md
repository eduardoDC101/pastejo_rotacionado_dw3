# ERP de Pastejo Rotacionado

Sistema de pastos, piquetes, animais e alocações, feito para o Trabalho 3 da disciplina Desenvolvimento Web III.

## O que o sistema guarda

- `pasto`: `pastoid`, `descricao`, `areatotal numeric(10,2)`, `removido`.
- `piquete`: `piqueteid`, `descricao`, `latitude numeric(9,6)`, `longitude numeric(9,6)`, `pastoidfk`, `removido`.
- `animal`: `animalid`, `nome`, `datanasc date`, `removido`.
- `alocado`: `alocadoid`, `animalidfk`, `piqueteidfk`, `datainicio date`, `datafinal date`, `removido`.
- Um pasto tem vários piquetes. Animal e piquete se relacionam pela tabela `alocado`.
- `usuarios` serve só para o login, não é uma das quatro tabelas do crud.

A exclusão muda `removido` para `true`, a linha continua no banco. As consultas só retornam registros com `removido = false`. Um pasto só pode ser removido depois que seus piquetes forem removidos, e um piquete ou animal só pode ser removido depois que suas alocações forem removidas.

Em `alocado`, a `datafinal` é opcional: sem ela, a alocação está em andamento. Quando informada, não pode ser anterior à `datainicio`.

## Arquitetura

São duas aplicações independentes:

- Backend em Node.js e Express, na porta **40000**.
- Frontend em Node.js e Express, na porta **40100**.
- PostgreSQL 16 instalado e em execução no Windows, fora do Docker.

A imagem usada nos Dockerfiles é `node:24-bookworm-slim`.

O navegador acessa o frontend em http://localhost:40100. O frontend nunca acessa o banco. O container do backend alcança o PostgreSQL do Windows pelo nome `host.docker.internal`.

As chamadas à API são feitas pelo JavaScript que roda no navegador, não pelo servidor do frontend: o container do frontend só entrega as páginas e repassa `SERVIDOR_DW3` para elas. Por isso `SERVIDOR_DW3` precisa ser um endereço que o navegador alcance, ou seja, `http://localhost:40000`, a porta publicada do backend. Um nome de serviço Docker como `http://backend:40000` não funcionaria, porque o navegador roda no Windows e não resolve nomes da rede interna do Docker.

## Pré-requisitos

Para executar com Docker:

- Docker Desktop, com o backend WSL2 funcionando.
- PostgreSQL 16 em execução no Windows.

Para executar sem Docker: Node.js 18 ou superior e o PostgreSQL em execução.

## Configuração

No PowerShell, a partir da pasta do projeto, crie o banco e aplique o script:

```powershell
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$env:PGCLIENTENCODING = "UTF8"
& $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE pastejo;"
& $psql -h localhost -U postgres -d pastejo -f ".\dw3backend\database\databaseConfig.sql"
```

O script cria a extensão `pgcrypto`, as tabelas, o usuário de login e alguns dados de exemplo. Pode ser executado de novo sem duplicar os dados.

Crie os arquivos reais de ambiente a partir dos exemplos e preencha a senha do PostgreSQL e o segredo do JWT. `.env` e `dw3frontend.env` estão no `.gitignore`.

```powershell
Copy-Item .\dw3backend\.env.example .\dw3backend\.env
Copy-Item .\dw3frontend\dw3frontend.env.example .\dw3frontend\dw3frontend.env
```

Variáveis do backend, em `dw3backend/.env`: `PORT`, `SECRET_API`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`.

Variável do frontend, em `dw3frontend/dw3frontend.env`: `SERVIDOR_DW3=http://localhost:40000`. O exemplo também traz `APP_NAME` e `PORT`.

No `.env` local, `DB_HOST` permanece `localhost`, para a execução sem Docker. No `docker run` do backend, `-e DB_HOST=host.docker.internal` substitui esse valor somente dentro do container.

### PostgreSQL acessível a partir do Docker Desktop

O banco continua só no Windows, com o serviço do PostgreSQL 16 em execução. O Docker Desktop encaminha as conexões feitas a `host.docker.internal` pelo próprio Windows, e o PostgreSQL as recebe com origem `127.0.0.1`. Assim, a configuração usada no desenvolvimento já aceita o backend em container: `listen_addresses = '*'` e a regra `host all all 127.0.0.1/32 scram-sha-256` do `pg_hba.conf`. Nenhum dos dois arquivos precisa ser alterado.

Se o backend em container registrar erro de conexão ou de autenticação, confira se o serviço do PostgreSQL está rodando e se `DB_USER`, `DB_PASS` e `DB_NAME` do `.env` estão corretos. Não use `trust` e não libere `0.0.0.0/0` no `pg_hba.conf`.

## Execução com Docker

As portas 40000 e 40100 só podem ser usadas por uma forma de execução por vez. Antes de iniciar os containers, encerre o backend e o frontend locais (`npm start`) e os containers do Compose (`docker compose down`), se estiverem rodando.

Construa a imagem do backend em `dw3backend`:

```powershell
cd dw3backend
docker build -t dw3backend_img:1.0 .
```

Construa a imagem do frontend em `dw3frontend`:

```powershell
cd ..\dw3frontend
docker build -t dw3frontend_img:1.0 .
```

Inicie o backend em `dw3backend`, onde está o arquivo `.env`:

```powershell
cd ..\dw3backend
docker run -d --name dw3backend_ctner --add-host host.docker.internal:host-gateway --env-file .env -e DB_HOST=host.docker.internal -e PORT=40000 -p 40000:40000 --restart unless-stopped dw3backend_img:1.0
```

Inicie o frontend em `dw3frontend`, onde está o arquivo `dw3frontend.env`:

```powershell
cd ..\dw3frontend
docker run -d --name dw3frontend_ctner --env-file dw3frontend.env -e PORT=40100 -e SERVIDOR_DW3=http://localhost:40000 -p 40100:40100 --restart unless-stopped dw3frontend_img:1.0
```

### Verificação

```powershell
docker ps
docker logs dw3backend_ctner
docker logs dw3frontend_ctner
docker exec dw3backend_ctner node tests/testarApis.js
```

- Frontend: http://localhost:40100
- Backend: http://localhost:40000

A rota `/` do frontend redireciona para `/login`. As listagens ficam em `/pastos`, `/piquetes`, `/animais` e `/alocados`.

Dentro do container do backend, a suíte chama a API em `localhost:40000`, que é o próprio container, e consulta o PostgreSQL por `host.docker.internal`.

Para parar e voltar a iniciar os containers:

```powershell
docker stop dw3frontend_ctner dw3backend_ctner
docker start dw3backend_ctner dw3frontend_ctner
```

Para recriá-los depois de alterar o código, remova-os com `docker rm -f dw3backend_ctner dw3frontend_ctner`, construa as imagens de novo e repita os comandos `docker run`.

## Docker Compose (alternativa)

O `compose.yaml`, na raiz, sobe os mesmos dois serviços, com os nomes `pastejo_backend` e `pastejo_frontend`. O PostgreSQL não faz parte do Compose. Antes de usá-lo, pare os containers do `docker run` (`docker stop dw3frontend_ctner dw3backend_ctner`), porque as portas são as mesmas.

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs
docker compose down
```

Com os serviços em execução:

```powershell
docker compose exec -T backend node tests/testarApis.js
```

## Testes sem Docker

Com o backend local no ar:

```powershell
cd .\dw3backend
node tests\testarApis.js
```

A suíte confere as 20 rotas com e sem JWT (ausente, inválido e expirado), executa o CRUD dos quatro módulos, as regras de vínculo e de exclusão, e verifica no banco que os registros removidos continuam na tabela com `removido = true` e que a senha está gravada como hash. Ela cria e remove registros de teste: use apenas o banco de desenvolvimento.

Os arquivos `.rest`, para o REST Client do VS Code, estão em `dw3backend/apps/<módulo>/tests/`. Nos arquivos dos quatro módulos, rode primeiro o pedido `loginAutenticado`.

## Execução sem Docker

Pare antes os containers que usam as portas 40000 e 40100. Depois, abra dois terminais a partir da pasta do projeto.

```powershell
cd .\dw3backend
npm install
npm start
```

```powershell
cd .\dw3frontend
npm install
npm start
```

- API: http://localhost:40000
- Telas: http://localhost:40100

## Login

- Usuário: `admin`
- Senha: `admin`
