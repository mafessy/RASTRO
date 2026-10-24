"""
routes/auth.py — porta de entrada do app.

Landing (boas-vindas), saída e o acesso separado do administrador.

MODO VISITANTE: o login e o cadastro do público estão desativados
temporariamente. A landing continua mostrando o formulário de entrada, mas
enviar login/cadastro só exibe um aviso. Quem clica em "Testar sem login"
entra direto e ganha um usuário visitante automático (ver
helpers.current_user).
"""

from datetime import datetime

from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from backend.models import User, db

bp = Blueprint("auth", __name__)


LOGIN_DISABLED_MESSAGE = (
    "Essa função foi desativada temporariamente para fins de segurança "
    "e manutenção do sistema."
)


@bp.route("/")
def landing():
    # sem redirect automático: a landing sempre aparece e a pessoa escolhe
    # "Testar sem login" (ou tenta entrar e vê o aviso)
    return render_template("auth/landing.html", tab=request.args.get("tab"))


@bp.route("/privacidade")
def privacidade():
    return render_template("auth/privacidade.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    # login público desativado temporariamente: só mostra o aviso
    if request.method == "POST":
        flash(LOGIN_DISABLED_MESSAGE)
    return redirect(url_for("auth.landing"))


@bp.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    # cadastro público desativado temporariamente: só mostra o aviso
    if request.method == "POST":
        flash(LOGIN_DISABLED_MESSAGE)
    return redirect(url_for("auth.landing", tab="cadastro"))


@bp.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "GET":
        return render_template("auth/admin_login.html")

    email = (request.form.get("email") or "").strip().lower()
    password = request.form.get("password") or ""

    user = User.query.filter_by(email=email, is_admin=True).first()
    if not user or not user.check_password(password):
        flash("Credenciais de administrador inválidas.")
        return redirect(url_for("auth.admin_login"))

    session["user_id"] = user.id
    user.last_login_at = datetime.utcnow()
    db.session.commit()
    return redirect(url_for("admin.dashboard"))


@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.landing"))
