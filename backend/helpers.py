"""
helpers.py — utilidades compartilhadas por todos os blueprints.

Sessão (do usuário e do voluntário), decorators de acesso e leitura rápida
do progresso. Este módulo só depende de flask + models, então nenhum
blueprint precisa importar app.py — o que evita import circular.

MODO VISITANTE: o site não tem mais login nem cadastro para o público.
Quem entra pela primeira vez ganha, automaticamente, um usuário "Visitante"
(guardado no banco, ligado ao navegador por um cookie de sessão longo).
O administrador e o voluntário continuam com login próprio.
"""

import re
import secrets
import uuid
from functools import wraps

from flask import redirect, session, url_for

from backend.models import MonthlyCycle, User, Volunteer, WorldItem, db

# e-mail fictício dos visitantes (precisa ser único no banco, não é real)
GUEST_EMAIL_DOMAIN = "visitante.rastro.local"


# ---------------- sessão ----------------

def _create_guest():
    """Cria um usuário visitante já com a marca inicial do WORLD."""
    user = User(
        name="Visitante",
        email=f"{uuid.uuid4().hex}@{GUEST_EMAIL_DOMAIN}",
    )
    # ninguém faz login com essa senha: ela só existe porque a coluna é obrigatória
    user.set_password(secrets.token_urlsafe(32))
    db.session.add(user)
    db.session.flush()  # gera user.id antes de criar dados relacionados

    # marca do primeiro passo, já "de fábrica" (igual ao antigo cadastro)
    db.session.add(WorldItem(user_id=user.id, cost=0))
    db.session.commit()
    return user


def current_user(create=True):
    """Usuário da sessão atual.

    Se a pessoa ainda não tem sessão (ou o usuário dela não existe mais),
    cria um visitante novo, a menos que create=False (usado nas áreas de
    administrador, que nunca devem criar visitantes).
    """
    user_id = session.get("user_id")
    user = db.session.get(User, user_id) if user_id else None
    if user is not None:
        return user
    if not create:
        return None

    user = _create_guest()
    session["user_id"] = user.id
    session.permanent = True  # lembra do visitante por vários meses
    return user


def login_required(view):
    """Antes exigia login. Agora só garante que existe um usuário (visitante)."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        current_user()
        return view(*args, **kwargs)

    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user(create=False)
        if not user or not user.is_admin:
            return redirect(url_for("auth.admin_login"))
        return view(*args, **kwargs)

    return wrapped


# ---------------- progresso do usuário ----------------

def owned_costs_for(user):
    """Custos (thresholds) dos elementos do WORLD que o usuário já obteve."""
    return [item.cost for item in user.world_items]


def unlock(user, field):
    """Marca uma etapa da jornada como desbloqueada, se ainda não estava."""
    if not getattr(user, field):
        setattr(user, field, True)


# ---------------- sessão do voluntário ----------------

def current_volunteer():
    volunteer_id = session.get("volunteer_id")
    if not volunteer_id:
        return None
    return db.session.get(Volunteer, volunteer_id)


def volunteer_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("volunteer_id"):
            return redirect(url_for("volunteer.login"))
        return view(*args, **kwargs)

    return wrapped


def volunteer_or_admin_name():
    volunteer = current_volunteer()
    return volunteer.name if volunteer else "Administrador"


# ---------------- helpers de dados por usuário ----------------

# ---------------- progresso do usuário (continuação) ----------------

def completed_count_for(user):
    """Total de itens concluídos (diários+semanais+mensal) no ciclo ativo do
    usuário, ou o total acumulado do último ciclo se nenhum estiver ativo."""
    cycle = (
        MonthlyCycle.query.filter_by(user_id=user.id, status="ativo")
        .order_by(MonthlyCycle.cycle_number.desc())
        .first()
    )
    if not cycle:
        cycle = (
            MonthlyCycle.query.filter_by(user_id=user.id)
            .order_by(MonthlyCycle.cycle_number.desc())
            .first()
        )
    return cycle.completed_items if cycle else 0


# ---------------- validação de texto livre ----------------

def is_meaningful_text(value, min_len=3):
    """True se `value` tiver texto de verdade: não vazio, não só espaços,
    não só o mesmo caractere repetido (ex.: "...", "aaaa") e com pelo menos
    `min_len` letras de fato (conta letras acentuadas também)."""
    if not value:
        return False
    text = value.strip()
    if len(text) < min_len:
        return False
    letters = re.findall(r"[a-zA-ZÀ-ÖØ-öø-ÿ]", text)
    if len(letters) < min_len:
        return False
    # bloqueia "aaaaaa", "kkkkkk" etc: exige pelo menos 2 letras diferentes
    if len(set(letter.lower() for letter in letters)) < 2:
        return False
    return True
