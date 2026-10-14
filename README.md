# Rastro — Pequenos passos também deixam marcas.

O **Rastro** é uma plataforma digital voltada para jovens que busca incentivar a construção de hábitos mais saudáveis, a socialização e o bem-estar de forma gradual, personalizada e acessível.

A proposta parte de uma ideia simples: mudanças importantes não precisam começar com grandes transformações. Ao reconhecer seus objetivos, sentimentos e dificuldades, o usuário pode transformar suas intenções em pequenas ações e desenvolver uma rotina mais equilibrada, um passo de cada vez.

O Rastro utiliza a tecnologia como uma ferramenta para incentivar experiências positivas também fora da tela, estimulando o autocuidado, a descoberta de interesses e a conexão com o mundo ao redor.

## Aviso de propriedade intelectual e uso

O **Rastro é um projeto desenvolvido pela SIMP - Estratégias**. Seu código-fonte, identidade visual, textos, estrutura, funcionalidades e demais materiais originais são protegidos pelos direitos de propriedade intelectual aplicáveis.

A disponibilização deste repositório para consulta, apresentação ou avaliação não significa que o projeto seja de código aberto, nem concede autorização para copiar, reproduzir, modificar, adaptar, redistribuir, comercializar ou utilizar seus elementos, integral ou parcialmente, sem autorização prévia e expressa por escrito dos respectivos titulares.

Também não é permitido apresentar o Rastro, seus materiais ou suas adaptações não autorizadas como criação própria. O acesso ao código não representa cessão de direitos ou concessão de licença de uso.

As bibliotecas, ferramentas e dependências de terceiros permanecem sujeitas às respectivas licenças.

A Política de Privacidade e os Termos de Uso do Rastro complementam as informações sobre a utilização da plataforma. Este aviso não substitui esses documentos nem constitui aconselhamento jurídico.


## Contexto e origem do projeto

O Rastro surgiu a partir da participação da **Escola Estadual Manuel Casasanta no Projeto Ação e Cidadania**, promovido pela **Junior Achievement Minas Gerais**. A iniciativa propôs aos alunos o desafio de desenvolver uma solução inovadora, tecnicamente possível e economicamente viável para responder à seguinte questão: **como tornar os jovens mais saudáveis?**

A partir dessa proposta, quatro amigos se uniram para formar a **SIMP - Estratégias**, equipe responsável pela criação do Rastro. Nossa ideia foi desenvolver uma plataforma digital capaz de incentivar hábitos mais saudáveis, fortalecer vínculos sociais e promover o bem-estar dos jovens por meio de pequenas mudanças incorporadas gradualmente à rotina.

Embora o projeto não tenha avançado para a etapa final da competição, decidimos continuar trabalhando nele de forma independente, para além dos limites do desafio inicial. Essa decisão nos permitiu aprofundar a proposta, explorar novas funcionalidades e dar continuidade ao desenvolvimento da plataforma.

Assim, o Rastro deixou de ser apenas uma solução idealizada para uma competição estudantil e passou a representar um projeto que continuamos construindo por iniciativa própria, com o objetivo de transformar uma ideia em uma ferramenta que incentive os jovens a cuidarem de si mesmos e a desenvolverem hábitos mais positivos.

## Funcionalidades

- **TALK — conversa inicial:** espaço para o usuário refletir sobre seu momento, seus objetivos e as barreiras que dificultam seu avanço.
- **1% — metas graduais:** organiza a jornada em metas mensais, semanais e diárias. As propostas passam pela revisão de um administrador antes de serem ativadas.
- **WORLD — mundo interativo:** representa visualmente o progresso do usuário. Os pontos conquistados podem ser utilizados para desbloquear elementos da ilha ou, futuramente, acessar benefícios.
- **Mundo Real:** recomenda lugares de acordo com os interesses selecionados pelo usuário, incentivando a exploração de atividades e espaços fora da plataforma.
- **SECRET — espaço de compartilhamento:** permite publicar e interagir com relatos de forma anônima.
- **PERFIL — acompanhamento da jornada:** reúne informações sobre progresso, pontos, ações concluídas e conquistas.
- **Check-in de humor:** permite registrar como o usuário está se sentindo.
- **Apoio por voluntariado:** oferece um canal de conversa com voluntários, com classificação inicial de urgência baseada em palavras-chave.
- **Painel administrativo:** apresenta indicadores de uso, permite revisar metas propostas e gerenciar recursos relacionados à plataforma.
- **Acessibilidade:** inclui recursos de interface voltados a tornar a experiência mais acessível.

> **Importante:** o Rastro é uma ferramenta de apoio, reflexão e incentivo a hábitos positivos. Não substitui acompanhamento psicológico, atendimento médico ou serviços de emergência. A classificação de urgência do sistema é automatizada por palavras-chave e não constitui diagnóstico clínico.


## Como funciona a jornada

A experiência é liberada progressivamente para incentivar o usuário a avançar sem pressão:

1. **TALK:** o usuário compartilha seu momento e começa a identificar um objetivo.
2. **1%:** após concluir a conversa inicial, a área de metas é liberada. O sistema prepara uma proposta de ciclo de metas.
3. **WORLD:** depois da primeira ação concluída no 1%, o usuário desbloqueia o mundo interativo e ganha pontos.
4. **SECRET:** é liberado após a primeira visita ao WORLD.
5. **PERFIL:** é liberado após o usuário publicar ou reagir a uma publicação no SECRET.

O ciclo de metas contempla **1 meta mensal, 4 metas semanais e 140 metas diárias**. As propostas são geradas por integração com a API da Anthropic, quando configurada, ou por um mecanismo alternativo baseado em regras. Em ambos os casos, ficam pendentes até a aprovação administrativa.


## Tecnologias utilizadas

- **Python:** linguagem principal do backend.
- **Flask:** estrutura da aplicação web e gerenciamento de rotas.
- **Flask-SQLAlchemy / SQLAlchemy:** integração e persistência de dados.
- **MySQL:** banco de dados padrão para desenvolvimento local, conforme a configuração do projeto.
- **PostgreSQL:** opção para ambientes hospedados.
- **HTML, CSS e JavaScript:** estrutura, estilos e interações da interface.
- **PixiJS:** renderização do mundo interativo.
- **Anthropic API:** geração opcional de propostas de metas por inteligência artificial.
- **Gunicorn:** servidor WSGI para implantação.


## Como executar localmente

As instruções abaixo são destinadas à execução em um ambiente autorizado, para fins de desenvolvimento, demonstração ou avaliação.

### 1. Pré-requisitos

- Python 3.10 ou superior (recomendado).
- `pip`.
- Opcional: PostgreSQL e uma chave de API da Anthropic.

### 2. Obtenha os arquivos do projeto

Utilize os arquivos disponibilizados pelos responsáveis pelo Rastro.

Caso exista um repositório autorizado para clonagem, utilize o endereço correspondente:

```bash
git clone <URL_DO_REPOSITORIO>
cd RASTRO-main
```

Se você recebeu o projeto como arquivo ZIP, extraia-o e abra a pasta que contém `app.py`.

### 3. Crie um ambiente virtual

**Windows (PowerShell):**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 4. Instale as dependências

```bash
pip install -r requirements.txt
```

### 5. Configure as variáveis de ambiente

A configuração do banco depende dos parâmetros definidos no projeto. Se o sistema estiver configurado para utilizar SQLite por padrão, o banco local será criado conforme a implementação. Para utilizar PostgreSQL, configure `DATABASE_URL`.

**Windows (PowerShell):**

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

**Atenção:**

- `DATABASE_URL` é opcional quando a configuração permite utilizar SQLite automaticamente.
- `ANTHROPIC_API_KEY` é opcional. Sem a chave, ou se a API não estiver disponível, o sistema pode utilizar a geração de metas baseada em regras.
- Defina uma `RASTRO_SECRET_KEY` própria e segura em ambientes de produção.
- **Nunca publique senhas, tokens ou chaves de API no repositório.**

### 6. Inicialize o banco de dados

```bash
flask --app app init-db
```

### 7. Crie uma conta de administrador

```bash
flask --app app create-admin
```

Siga as instruções do terminal para cadastrar nome, e-mail e senha. Essa conta permite acessar o painel administrativo em `/admin`.

### 8. Inicie a aplicação

```bash
python app.py
```

Abra no navegador:

[http://localhost:5000](http://localhost:5000)

Para encerrar o servidor, utilize `Ctrl + C` no terminal.


## Estrutura do projeto

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
│   ├── auth.py             # Página inicial, login e cadastro
│   ├── main.py             # TALK, 1%, SECRET, PERFIL e APIs
│   ├── world.py            # WORLD e Mundo Real
│   ├── admin.py            # Painel administrativo
│   ├── volunteer.py        # Atendimento voluntário
│   └── db_sync.py          # Sincronização da estrutura do banco
├── services/
│   ├── ai_goals.py         # Geração de propostas de metas
│   └── goal_engine.py      # Regras do ciclo de metas
├── templates/              # Páginas HTML/Jinja
└── static/
    ├── css/                # Folhas de estilo
    ├── js/                 # Scripts do frontend
    └── img/                # Imagens e elementos visuais
```

---

## Privacidade e uso responsável

O Rastro pode lidar com informações pessoais, como relatos, registros de humor e objetivos. Em uma implantação real, é essencial:

- Informar com clareza quais dados são coletados e para que são utilizados.
- Resttringir o acesso administrativo e proteger credenciais.
- Utilizar HTTPS e configurações seguras de sessão.
- Revisar políticas de retenção, exclusão e anonimização dos dados.
- Avaliar cuidadosamente as integrações com serviços externos.
- Não utilizar o sistema como substituto de atendimento profissional.

As medidas necessárias dependem do ambiente em que a aplicação será utilizada. Antes de acessar o sistema publicamente, é necessário revisar as configurações de segurança, o tratamento de dados e as obrigações legais aplicáveis, incluindo a legislação de proteção de dados.

A Política de Privacidade e os Termos de Uso do Rastro complementam estas orientações e devem ser consultados para conhecer as condições específicas aplicáveis à plataforma. Este README não substitui esses documentos.



## Situação do projeto

O Rastro é um projeto em desenvolvimento contínuo por iniciativa da equipe SIMP - Estratégias. Suas funcionalidades, fluxos e integrações podem ser aprimorados ao longo das etapas de desenvolvimento e avaliação.

Este documento tem finalidade informativa e técnica. A descrição das funcionalidades, tecnologias e instruções de execução não constitui autorização para reutilizar, copiar, modificar ou redistribuir o projeto.

Solicitações de acesso, demonstração, parceria ou autorização de uso devem ser encaminhadas aos responsáveis pelo Rastro através do email (rastroadm.contato@gmail.com).


## Autoria e direitos reservados

**Rastro — SIMP - Estratégias**

Concebido por uma equipe de quatro integrantes a partir do desafio proposto pelo Projeto Ação e Cidadania, promovido pela Junior Achievement Minas Gerais, o Rastro continuou sendo desenvolvido de forma independente após a participação na iniciativa.

O nome Rastro, sua identidade visual, seu código-fonte, seus textos, sua estrutura e os demais materiais originais do projeto são protegidos pela legislação aplicável.

Nenhuma licença aberta é concedida por este README. Qualquer uso que dependa de autorização dos titulares deverá ser previamente autorizado por escrito, respeitando também os direitos de terceiros e as licenças dos componentes utilizados.
