"""
routes/auth.py — porta de entrada do app.

Landing (boas-vindas), saída e o acesso separado do administrador.

MODO VISITANTE: não existe mais login nem cadastro para o público. Quem
clica em "Começar" entra direto e ganha um usuário visitante automático
(ver helpers.current_user). As rotas /login e /cadastro continuam existindo
só para não quebrar links antigos: elas apenas levam para o site.
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

from backend.helpers import current_user
from backend.models import User, db

bp = Blueprint("auth", __name__)


@bp.route("/")
def landing():
    # visitante que volta ao site vai direto para a home; quem acabou de
    # clicar em "Sair" (?sair=1) vê a tela inicial
    if session.get("user_id") and not request.args.get("sair"):
        return redirect(url_for("main.home"))
    return render_template("auth/landing.html")


@bp.route("/privacidade")
def privacidade():
    return render_template("auth/privacidade.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    # login público foi desativado (modo visitante)
    return redirect(url_for("main.home"))


@bp.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    # cadastro público foi desativado (modo visitante)
    return redirect(url_for("main.home"))


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
    """Botão "Sair" do menu.

    Administrador: encerra a sessão de verdade.
    Visitante: volta para a tela inicial, mas o navegador continua lembrando
    dele; ao clicar em "Começar como visitante" ele retoma o mesmo progresso.
    (Se a sessão fosse apagada, o progresso do visitante ficaria inacessível.)
    """
    user = current_user(create=False)
    if user is not None and user.is_admin:
        session.clear()
        return redirect(url_for("auth.landing"))
    return redirect(url_for("auth.landing", sair=1))
