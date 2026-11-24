# ERP de Pastejo Rotacionado

Projeto do Trabalho 3 de Desenvolvimento Web III para controle de pastos, piquetes, animais e alocações. O acesso padrão usa usuário `admin` e senha `admin`.

## Como o projeto funciona

O sistema foi dividido em duas aplicações Node.js com Express que sobem separadas: o backend responde na porta **40000** e o frontend na porta **40100**. Nos Dockerfiles a imagem base é `node:24-bookworm-slim`, enquanto o PostgreSQL 16 fica rodando direto no Windows, fora do Docker.

No uso normal, o navegador abre `http://localhost:40100` (a raiz `/` joga para `/login`, e depois as telas ficam em `/pastos`, `/piquetes`, `/animais` e `/alocados`). O servidor do frontend nunca conecta no banco — ele só entrega as páginas e repassa a variável `SERVIDOR_DW3`. Como quem faz as requisições para a API é o JavaScript rodando no navegador, `SERVIDOR_DW3` precisa apontar para `http://localhost:40000`. Usar um nome interno do Docker como `http://backend:40000` quebraria tudo, já que o navegador está no Windows e não resolve nomes da rede interna dos containers. Já o container do backend fala com o PostgreSQL do Windows usando `host.docker.internal`.

### Banco e regras principais

O esquema tem quatro tabelas principais de CRUD mais a tabela `usuarios`, que existe só para autenticação:

- `pasto`: `pastoid`, `descricao`, `areatotal numeric(10,2)` e `removido`.
- `piquete`: `piqueteid`, `descricao`, `latitude numeric(9,6)`, `longitude numeric(9,6)`, `pastoidfk` e `removido`.
- `animal`: `animalid`, `nome`, `datanasc date` e `removido`.
- `alocado`: `alocadoid`, `animalidfk`, `piqueteidfk`, `datainicio date`, `datafinal date` e `removido`.

Um pasto agrupa vários piquetes, e a ligação entre animal e piquete acontece na tabela `alocado`. Nada é apagado fisicamente: remover um registro só marca `removido = true`, e as listagens trazem apenas o que está com `removido = false`. Também existem travas de vínculo — não dá para remover um pasto que ainda tenha piquetes ativos, nem remover piquete ou animal que tenha alocações ativas. Na tabela `alocado`, `datafinal` pode ficar vazia quando a alocação ainda está em andamento; se for preenchida, não pode ser anterior à `datainicio`.

## Preparando o ambiente

Para rodar em containers você precisa do Docker Desktop com WSL2 ativo e do PostgreSQL 16 rodando no Windows. Se preferir rodar direto na máquina, basta Node.js 18 ou superior junto com o PostgreSQL.

Primeiro, abra o PowerShell na raiz do repositório para criar o banco `pastejo` e carregar a estrutura inicial:

```powershell
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$env:PGCLIENTENCODING = "UTF8"
& $psql -h localhost -U postgres -d postgres -c "CREATE DATABASE pastejo;"
& $psql -h localhost -U postgres -d pastejo -f ".\dw3backend\database\databaseConfig.sql"
```

Esse SQL habilita a extensão `pgcrypto`, cria as tabelas, insere o usuário `admin` e popula alguns registros de exemplo. Pode rodar de novo sem medo de duplicar dados.

Depois copie os arquivos de exemplo (`.env` e `dw3frontend.env` já estão no `.gitignore`) e preencha a senha do PostgreSQL e o segredo do JWT:

```powershell
Copy-Item .\dw3backend\.env.example .\dw3backend\.env
Copy-Item .\dw3frontend\dw3frontend.env.example .\dw3frontend\dw3frontend.env
```

Em `dw3backend/.env` ficam `PORT`, `SECRET_API`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` e `DB_PORT`. Deixe `DB_HOST` como `localhost` nesse arquivo para funcionar fora do Docker; quando subir o container do backend, o parâmetro `-e DB_HOST=host.docker.internal` sobrescreve esse valor apenas lá dentro. Em `dw3frontend/dw3frontend.env` o essencial é `SERVIDOR_DW3=http://localhost:40000` (o exemplo também define `APP_NAME` e `PORT`).

Sobre a conexão do Docker Desktop com o PostgreSQL do Windows: o próprio Docker Desktop encaminha o tráfego de `host.docker.internal` pelo Windows, então o banco enxerga a conexão chegando de `127.0.0.1`. Por conta disso, a configuração padrão com `listen_addresses = '*'` e `host all all 127.0.0.1/32 scram-sha-256` no `pg_hba.conf` já funciona sem editar nada. Se o backend em container der erro de conexão ou autenticação, confira se o serviço do PostgreSQL está de pé e se `DB_USER`, `DB_PASS` e `DB_NAME` batem com o banco. Evite colocar `trust` ou abrir `0.0.0.0/0` no `pg_hba.conf`.

## Rodando com Docker

Como as portas 40000 e 40100 são compartilhadas entre todos os modos de execução, pare antes qualquer instância local (`npm start`) ou do Compose (`docker compose down`) que já esteja ocupando essas portas.

### Manualmente com `docker build` e `docker run`

Monte as duas imagens entrando em cada pasta:

```powershell
cd dw3backend
docker build -t dw3backend_img:1.0 .
```

```powershell
cd ..\dw3frontend
docker build -t dw3frontend_img:1.0 .
```

Agora suba o backend a partir de `dw3backend` (onde está o `.env`) e depois o frontend a partir de `dw3frontend` (onde está o `dw3frontend.env`):

```powershell
cd ..\dw3backend
docker run -d --name dw3backend_ctner --add-host host.docker.internal:host-gateway --env-file .env -e DB_HOST=host.docker.internal -e PORT=40000 -p 40000:40000 --restart unless-stopped dw3backend_img:1.0
```

```powershell
cd ..\dw3frontend
docker run -d --name dw3frontend_ctner --env-file dw3frontend.env -e PORT=40100 -e SERVIDOR_DW3=http://localhost:40000 -p 40100:40100 --restart unless-stopped dw3frontend_img:1.0
```

Para conferir se tudo subiu certo e rodar a suíte de testes dentro do backend:

```powershell
docker ps
docker logs dw3backend_ctner
docker logs dw3frontend_ctner
docker exec dw3backend_ctner node tests/testarApis.js
```

Ali dentro do container, o script de testes chama a API em `localhost:40000` (ele mesmo) e acessa o PostgreSQL em `host.docker.internal`. No navegador, o frontend responde em `http://localhost:40100` e a API em `http://localhost:40000`.

Para parar e ligar os containers depois:

```powershell
docker stop dw3frontend_ctner dw3backend_ctner
docker start dw3backend_ctner dw3frontend_ctner
```

Sempre que alterar código e quiser refletir nos containers, remova os antigos com `docker rm -f dw3backend_ctner dw3frontend_ctner`, rode os `docker build` novamente e execute os `docker run` de novo.

### Com Docker Compose

Se preferir gerenciar os dois juntos, o `compose.yaml` na raiz sobe os serviços `pastejo_backend` e `pastejo_frontend` (o PostgreSQL continua fora do Compose). Lembre de parar os containers manuais (`docker stop dw3frontend_ctner dw3backend_ctner`) antes para não bater porta:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs
docker compose down
```

Para rodar os testes com o Compose no ar:

```powershell
docker compose exec -T backend node tests/testarApis.js
```

## Rodando sem Docker e testes locais

Com os containers parados para liberar as portas 40000 e 40100, abra dois terminais na raiz do projeto:

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

Com os dois rodando, a API fica em `http://localhost:40000` e as telas em `http://localhost:40100`. Para rodar os testes fora do Docker:

```powershell
cd .\dw3backend
node tests\testarApis.js
```

O script passa pelas 20 rotas testando autenticação JWT (sem token, inválido e expirado), faz o CRUD completo dos quatro módulos, valida as travas de vínculo e exclusão, e ainda consulta o PostgreSQL direto para garantir que os registros removidos seguem gravados com `removido = true` e que a senha do usuário está em hash. Como ele cria e remove registros durante a execução, rode apenas no banco de desenvolvimento.

Quem usa a extensão REST Client no VS Code também encontra arquivos `.rest` em `dw3backend/apps/<módulo>/tests/`. Nos arquivos de cada módulo, dispare primeiro a requisição `loginAutenticado` para preencher o token antes das demais chamadas.
