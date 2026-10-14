"""
config.py — configuração do app, toda vinda de variáveis de ambiente.

DATABASE_URL manda em tudo. Em produção, aponte para o Supabase (Postgres),
usando a string do "Session pooler". Sem DATABASE_URL, o app usa um SQLite
local (rastro.sqlite3), útil só para desenvolvimento: nenhuma senha de banco
fica escrita no código.
"""

import os


def _database_uri():
    uri = os.environ.get("DATABASE_URL", "").strip()
    if not uri:
        return "sqlite:///rastro.sqlite3"
    # o SQLAlchemy precisa do driver explícito; Supabase/Railway entregam "postgres(ql)://"
    if uri.startswith("postgres://"):
        uri = "postgresql://" + uri[len("postgres://"):]
    if uri.startswith("postgresql://"):
        uri = "postgresql+psycopg2://" + uri[len("postgresql://"):]
    return uri


class Config:
    SECRET_KEY = os.environ.get("RASTRO_SECRET_KEY", "rastro-dev-secret")

    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # evita erro de "conexão fechada" quando o pooler derruba conexões ociosas
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 300}
