"""
RASTRO — motor de regras do ciclo de metas (mensal / semanal / diária).

Isola toda a lógica de desbloqueio progressivo e pontuação, pra manter
app.py só com rotas. Nada aqui faz commit no banco — quem chama decide
quando commitar (facilita testar e evitar commits parciais).
"""

from datetime import datetime

from backend.models import (
    CYCLE_BONUS_POINTS,
    DAILY_POINTS,
    MONTHLY_POINTS,
    WEEKLY_POINTS,
    WEEKLY_UNLOCK_THRESHOLDS,
    AIGoalDraft,
    DailyGoal,
    MonthlyCycle,
    WeeklyGoal,
    db,
)

# True  = o bloco de metas gerado já vira o ciclo ativo na hora, sem passar
#         pela aprovação do /admin (modo atual, para os visitantes).
# False = volta ao fluxo antigo: o rascunho fica "pendente" até um
#         administrador aprovar.
AUTO_APPROVE_DRAFTS = True


def request_new_draft(user, cycle_number, payload, source):
    """Cria o AIGoalDraft com o bloco de metas. Com AUTO_APPROVE_DRAFTS ligado
    (padrão), ele é aprovado na hora e já vira o ciclo ativo do usuário; com
    o interruptor desligado, fica pendente de aprovação do admin."""
    draft = AIGoalDraft(
        user_id=user.id,
        cycle_number=cycle_number,
        objective=user.current_objective,
        barrier=user.current_barrier,
        payload_json=_dump(payload),
        source=source,
        status="pendente",
    )
    db.session.add(draft)
    if AUTO_APPROVE_DRAFTS:
        activate_draft(draft, None)
    return draft


def activate_draft(draft, admin_user):
    """Aprova o rascunho (um admin, ou automaticamente quando admin_user é
    None): transforma-o em um MonthlyCycle ativo de verdade, com as 4
    WeeklyGoal e as 140 DailyGoal já criadas (mas só a semana 1 com
    daily_available=True)."""
    payload = draft.payload()

    # se havia um ciclo ativo (ex.: usuário pediu atualização de objetivo no
    # meio do mês), ele é encerrado como substituído antes do novo começar
    from backend.models import MonthlyCycle as _MonthlyCycle
    previous_active = _MonthlyCycle.query.filter_by(user_id=draft.user_id, status="ativo").first()
    if previous_active:
        previous_active.status = "substituido"

    cycle = MonthlyCycle(
        user_id=draft.user_id,
        cycle_number=draft.cycle_number,
        objective=draft.objective,
        barrier=draft.barrier,
        monthly_text=payload["monthly"],
    )
    db.session.add(cycle)
    db.session.flush()  # gera cycle.id

    for week_index, week_texts in enumerate(payload["daily"]):
        order = week_index + 1
        weekly = WeeklyGoal(
            cycle_id=cycle.id,
            order=order,
            text=payload["weekly"][week_index],
            unlocked=False,
            daily_available=(order == 1),  # só a semana 1 já libera os diários
        )
        db.session.add(weekly)
        db.session.flush()

        for position, text in enumerate(week_texts):
            day_number = (position // 5) + 1
            db.session.add(DailyGoal(
                weekly_id=weekly.id,
                position=position + 1,
                day_number=day_number,
                text=text,
            ))

    draft.status = "aprovado"
    draft.reviewed_by = admin_user.id if admin_user else None
    draft.reviewed_at = datetime.utcnow()
    if admin_user is None:
        draft.review_note = "Aprovado automaticamente"
    return cycle


def reject_draft(draft, admin_user, note=""):
    draft.status = "rejeitado"
    draft.reviewed_by = admin_user.id
    draft.reviewed_at = datetime.utcnow()
    draft.review_note = note[:255]


def _recompute_unlocks(cycle):
    """Depois de qualquer alteração em done, recalcula completed_items e
    checa se algum novo limiar foi cruzado, desbloqueando a próxima semanal
    (e os diários da semana seguinte junto)."""
    weeklies = cycle.weekly_goals  # já vem ordenado por 'order'
    daily_done = sum(1 for w in weeklies for d in w.daily_goals if d.done)
    weekly_done = sum(1 for w in weeklies if w.done)
    monthly_done = 1 if cycle.monthly_done else 0

    cycle.completed_items = daily_done + weekly_done + monthly_done

    for index, threshold in enumerate(WEEKLY_UNLOCK_THRESHOLDS):
        weekly = weeklies[index]
        if cycle.completed_items >= threshold and not weekly.unlocked:
            weekly.unlocked = True
            weekly.unlocked_at = datetime.utcnow()
            # a semana seguinte (se existir) libera os diários junto
            if index + 1 < len(weeklies):
                weeklies[index + 1].daily_available = True

    return cycle.completed_items


def toggle_daily_goal(user, cycle, daily_goal):
    was_done = daily_goal.done
    daily_goal.done = not was_done
    daily_goal.done_at = datetime.utcnow() if daily_goal.done else None
    user.points = max(0, user.points + (DAILY_POINTS if daily_goal.done else -DAILY_POINTS))
    _recompute_unlocks(cycle)
    _maybe_complete_cycle(user, cycle)


def toggle_weekly_goal(user, cycle, weekly_goal):
    if not weekly_goal.unlocked:
        return  # não deveria acontecer via UI, mas protege a regra
    was_done = weekly_goal.done
    weekly_goal.done = not was_done
    weekly_goal.done_at = datetime.utcnow() if weekly_goal.done else None
    user.points = max(0, user.points + (WEEKLY_POINTS if weekly_goal.done else -WEEKLY_POINTS))
    _recompute_unlocks(cycle)
    _maybe_complete_cycle(user, cycle)


def toggle_monthly_goal(user, cycle):
    was_done = cycle.monthly_done
    cycle.monthly_done = not was_done
    user.points = max(0, user.points + (MONTHLY_POINTS if cycle.monthly_done else -MONTHLY_POINTS))
    _recompute_unlocks(cycle)
    _maybe_complete_cycle(user, cycle)


def _maybe_complete_cycle(user, cycle):
    if cycle.status == "ativo" and cycle.completed_items >= 145:
        cycle.status = "concluido"
        cycle.completed_at = datetime.utcnow()
        user.points += CYCLE_BONUS_POINTS

        # dispara automaticamente a geração do próximo bloco (que, com
        # AUTO_APPROVE_DRAFTS ligado, já entra como o novo ciclo ativo)
        from backend.services import ai_goals
        payload, source = ai_goals.generate_goal_payload(user.current_objective, user.current_barrier)
        request_new_draft(user, cycle.cycle_number + 1, payload, source)


def _dump(payload):
    import json
    return json.dumps(payload, ensure_ascii=False)
