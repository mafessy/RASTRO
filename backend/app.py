"""
RASTRO — Flask + HTML + CSS + JS puro, com login real e dados em MySQL.

Sidebar no desktop, bottom-nav no celular, cards em glassmorphism,
TALK → barreira → 1% → WORLD → PERFIL e SECRET.

Este arquivo só monta o app: configuração, banco, blueprints e comandos de
terminal. As rotas ficam em routes/ (uma por área), as regras de negócio em
services/, as tabelas em models.py e o conteúdo fixo em data.py.

    python app.py            sobe o servidor em http://localhost:5000
    flask --app app init-db  cria as tabelas
"""

from pathlib import Path

from flask import Flask, session

from backend import cli
from backend import routes
from backend.config import Config
from backend.models import db


def create_app(config_object=Config):
    project_root = Path(__file__).resolve().parent.parent
    app = Flask(
        __name__,
        template_folder=str(project_root / "frontend" / "templates"),
        static_folder=str(project_root / "frontend" / "static"),
    )
    app.config.from_object(config_object)
    app.secret_key = app.config["SECRET_KEY"]

    db.init_app(app)
    routes.register(app)
    cli.register(app)

    @app.context_processor
    def inject_just_registered():
        # consome a flag uma única vez: some da sessão assim que a primeira
        # página é renderizada depois do cadastro (ver routes/auth.py),
        # então o modal "Conta criada!" nunca reaparece num refresh.
        return {"just_registered": session.pop("just_registered", False)}

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
