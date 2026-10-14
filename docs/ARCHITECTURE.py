# Arquitetura do Rastro

## Separação por responsabilidade

- `backend/app.py`: application factory, configuração Flask e registro de componentes.
- `backend/routes/`: endpoints e coordenação HTTP por domínio funcional.
- `backend/services/`: regras de negócio e integração com serviços externos.
- `backend/models.py`: modelos ORM e relacionamentos de persistência.
- `backend/data.py`: conteúdo fixo e funções de domínio sem estado de usuário.
- `backend/helpers.py`: utilitários compartilhados e controles de acesso.
- `frontend/templates/`: páginas HTML/Jinja.
- `frontend/static/`: CSS, JavaScript e imagens servidos pelo Flask.
- `app.py`: entrypoint de compatibilidade para execução local e WSGI.
- `tests/`: verificações automatizadas básicas da estrutura.

## Decisões de compatibilidade

Os nomes de URL, blueprints, templates e arquivos estáticos foram mantidos. O Flask recebe caminhos absolutos para `frontend/templates` e `frontend/static`, calculados a partir da localização do código, evitando dependência do diretório de onde o processo foi iniciado.

O entrypoint na raiz preserva comandos comuns como `python app.py` e `gunicorn app:app`. Imports internos usam o namespace `backend.*` para evitar ambiguidades e facilitar a manutenção.

## Execução e configuração

1. Crie um ambiente virtual e instale `requirements.txt`.
2. Configure `RASTRO_SECRET_KEY` com um valor aleatório forte.
3. Configure `DATABASE_URL` no ambiente quando utilizar banco externo. Sem ela, o projeto usa SQLite local.
4. Inicialize o banco com `flask --app app init-db`, conforme os comandos disponíveis no projeto.
5. Execute `python app.py` em desenvolvimento ou use um servidor WSGI apropriado em implantação.

Não habilite modo de depuração em produção. Use HTTPS, segredos gerenciados pela plataforma, backups e uma política de migração de banco antes de publicar alterações de schema.

## Verificação

Execute `python -m unittest discover -s tests -v` para as verificações estruturais incluídas. A compilação sintática pode ser verificada com `python -m compileall -q backend app.py tests`.

A suíte estrutural não substitui testes de integração. Antes de uma implantação corporativa, acrescente testes de autenticação/autorização, fluxos de cadastro, persistência, rotas críticas, acessibilidade, segurança e migrações usando um banco de teste isolado.
