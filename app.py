"""Entry point compatível para execução local e servidores WSGI.

Uso: python app.py ou gunicorn app:app
"""
from backend.app import app, create_app

__all__ = ["app", "create_app"]

if __name__ == "__main__":
    app.run(debug=app.config.get("DEBUG", False))
