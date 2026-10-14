Rastro - Pequenos passos também deixam marcas.

O Rastro é uma plataforma digital pensada para jovens que desejam desenvolver hábitos mais saudáveis, fortalecer vínculos e cuidar do próprio bem-estar de forma gradual, personalizada e acessível. A proposta parte de uma ideia simples: mudanças importantes não precisam começar com grandes transformações. Ao reconhecer objetivos, sentimentos e dificuldades, a plataforma ajuda a transformar intenções em pequenas ações — 1% por vez.
> A tecnologia é um meio, não o destino. O Rastro busca incentivar experiências e hábitos positivos também fora da tela.

Funcionalidades:
- TALK — conversa inicial: espaço para o usuário refletir sobre seu momento, seus objetivos e as barreiras que dificultam o avanço.
- 1% — metas graduais: organiza a jornada em metas mensais, semanais e diárias. As propostas passam pela revisão de um administrador antes de serem ativadas.
- WORLD — mundo interativo: representa visualmente o progresso do usuário. Pontos conquistados podem ser usados para desbloquear elementos da ilha ou (futuros) benefícios.
- Mundo Real: recomenda lugares de acordo com interesses selecionados pelo usuário, incentivando a exploração de atividades e espaços fora da plataforma.
- SECRET — espaço de compartilhamento: permite publicar e interagir com relatos de forma anônima.
- PERFIL — acompanhamento da jornada: reúne informações sobre progresso, pontos, ações concluídas e conquistas.
- Check-in de humor: permite registrar como o usuário está se sentindo.
- Apoio por voluntariado: oferece um canal de conversa com voluntários, com classificação inicial de urgência baseada em palavras-chave.
- Painel administrativo: apresenta indicadores de uso, permite revisar metas propostas e gerenciar recursos relacionados à plataforma.
- Acessibilidade: inclui recursos de interface voltados a tornar a experiência mais acessível.

> **Importante:** o Rastro é uma ferramenta de apoio, reflexão e incentivo a hábitos positivos. Não substitui acompanhamento psicológico, atendimento médico ou serviços de emergência. A classificação de urgência do sistema é automatizada por palavras-chave e não constitui diagnóstico clínico.

Como funciona a jornada:

A experiência é liberada progressivamente para incentivar o usuário a avançar sem pressão:

1. TALK: o usuário compartilha seu momento e começa a identificar um objetivo.
2. 1%: após concluir a conversa inicial, a área de metas é liberada. O sistema prepara uma proposta de ciclo de metas.
3. WORLD: depois da primeira ação concluída no 1%, o usuário desbloqueia o mundo interativo e ganha pontos.
4. SECRET: é liberado após a primeira visita ao WORLD.
5. PERFIL: é liberado após o usuário publicar ou reagir a uma publicação no SECRET.

O ciclo de metas contempla **1 meta mensal, 4 metas semanais e 140 metas diárias**. As metas são geradas por integração com a API da Anthropic, quando configurada, ou por um mecanismo alternativo baseado em regras. Em ambos os casos, a proposta fica pendente até a aprovação administrativa.

Tecnologias utilizadas:

- **Python** — linguagem principal do backend.
- **Flask** — aplicação web e rotas.
- **Flask-SQLAlchemy / SQLAlchemy** — integração e persistência de dados.
- **MySQL** — banco padrão para desenvolvimento local.
- **PostgreSQL** — opção para ambientes hospedados.
- **HTML, CSS e JavaScript** — estrutura, estilos e interações da interface.
- **PixiJS** — renderização do mundo interativo.
- **Anthropic API** — geração opcional de propostas de metas por IA.
- **Gunicorn** — servidor WSGI para implantação.

Como executar localmente:

1. Pré-requisitos
- Python 3.10 ou superior (recomendado).
- `pip`.
- Opcional: PostgreSQL e uma chave de API da Anthropic.

2. Baixe ou clone o projeto
```bash
git clone <URL_DO_REPOSITORIO>
cd RASTRO-main
```

Se você baixou o projeto como arquivo ZIP, extraia-o e abra a pasta que contém `app.py`.

3. Crie um ambiente virtual
Windows (PowerShell):
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```
Linux/macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

4. Instale as dependências
```bash
pip install -r requirements.txt
```

5. Configure as variáveis de ambiente (opcional)
Por padrão, o sistema usa um banco SQLite local, criado no arquivo `rastro.sqlite3`. Para utilizar PostgreSQL, defina `DATABASE_URL`.
Windows (PowerShell):
```powershell
$env:DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO"
$env:RASTRO_SECRET_KEY="substitua-por-uma-chave-segura"
$env:ANTHROPIC_API_KEY="sua-chave-da-anthropic"
```

**Linux/macOS:**
```bash
export DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO"
export RASTRO_SECRET_KEY="substitua-por-uma-chave-segura"
export ANTHROPIC_API_KEY="sua-chave-da-anthropic"
```

Atenção:
- `DATABASE_URL` é opcional; sem ela, o SQLite é usado automaticamente.
- `ANTHROPIC_API_KEY` é opcional. Sem a chave, ou se a API não estiver disponível, o sistema utiliza a geração de metas baseada em regras.
- Defina uma `RASTRO_SECRET_KEY` própria e segura em ambientes de produção.
- **Nunca publique senhas, tokens ou chaves de API no repositório.**

6. Inicialize o banco de dados
```bash
flask --app app init-db
```

7. Crie uma conta de administrador
```bash
flask --app app create-admin
```
Siga as instruções do terminal para cadastrar nome, e-mail e senha. Essa conta permite acessar o painel administrativo em `/admin`.

8. Inicie a aplicação
```bash
python app.py
```

Abra no navegador: [http://localhost:5000](http://localhost:5000).
Para encerrar o servidor, use `Ctrl + C` no terminal.

Estrutura do projeto:
```text
RASTRO-main/
├── app.py                  # Inicialização da aplicação Flask
├── cli.py                  # Comandos de configuração pelo terminal
├── config.py               # Configurações e conexão com o banco
├── data.py                 # Conteúdos fixos, regras e dados da experiência
├── helpers.py              # Autenticação e funções auxiliares
├── models.py               # Modelos e tabelas do banco
├── requirements.txt        # Dependências Python
├── routes/
│   ├── auth.py              # Página inicial, login e cadastro
│   ├── main.py              # TALK, 1%, SECRET, PERFIL e APIs
│   ├── world.py             # WORLD e Mundo Real
│   ├── admin.py             # Painel administrativo
│   ├── volunteer.py         # Atendimento voluntário
│   └── db_sync.py           # Sincronização de estrutura do banco
├── services/
│   ├── ai_goals.py          # Geração de propostas de metas
│   └── goal_engine.py       # Regras do ciclo de metas
├── templates/               # Páginas HTML/Jinja
└── static/
    ├── css/                 # Folhas de estilo
    ├── js/                  # Scripts do frontend
    └── img/                 # Imagens e elementos visuais
```

Privacidade e uso responsável:

O Rastro lida com informações que podem ser pessoais, como relatos, registros de humor e objetivos. Em uma implantação real, é essencial:

- informar com clareza quais dados são coletados e para que são usados;
- restringir o acesso administrativo e proteger credenciais;
- utilizar HTTPS e configurações seguras de sessão;
- revisar políticas de retenção, exclusão e anonimização dos dados;
- avaliar cuidadosamente integrações com serviços externos;
- não utilizar o sistema como substituto de atendimento profissional.

As medidas necessárias dependem do ambiente em que a aplicação será utilizada. Antes de disponibilizar o sistema publicamente, revise as configurações de segurança, o tratamento de dados e as obrigações legais aplicáveis.

Situação do projeto:

O Rastro é um projeto em desenvolvimento. Recursos, fluxos e integrações podem ser ajustados conforme testes e avaliações.
Para contribuir com melhorias, documente o problema observado, os passos para reproduzi-lo e, se possível, o resultado esperado.
