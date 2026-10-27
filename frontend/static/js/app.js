/* RASTRO — interações client-side, sem frameworks */

/* campos de mensagem viraram <textarea> pra quebrar linha em vez de estourar a largura;
   essa função deixa a caixa crescer conforme o usuário digita (até um limite) e volta ao
   tamanho normal quando ela é limpa */
function autoGrowInput(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 110) + "px";
}

/* ---------------- HOME: check-in de humor ---------------- */
const RastroHome = {
  init() {
    const grid = document.getElementById("mood-grid");
    const feedback = document.getElementById("checkin-feedback");
    if (!grid) return;

    grid.addEventListener("click", async (e) => {
      const btn = e.target.closest(".mood-card");
      if (!btn) return;
      const mood = btn.dataset.mood;

      grid.querySelectorAll(".mood-card").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood }),
        });
        const data = await res.json();
        if (data.ok && feedback) {
          feedback.textContent = "Check-in registrado. Obrigado por compartilhar como você está.";
        }
      } catch (err) {
        if (feedback) feedback.textContent = "Não consegui registrar agora, mas obrigado por compartilhar.";
      }
    });
  },
};

/* ---------------- TALK: conversa em etapas ---------------- */
const RastroTalk = {
  init({ step }) {
    const log = document.getElementById("chat-log");
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("chat-send");
    const inputRow = document.getElementById("chat-input-row");
    if (!log) return;

    let currentStep = step || 0;
    let sending = false;

    function addBubble(html, from) {
      const div = document.createElement("div");
      div.className = `bubble ${from}`;
      div.innerHTML = html;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }

    function addOptions(options) {
      const wrap = document.createElement("div");
      wrap.className = "talk-options";
      options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "talk-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          wrap.remove();
          addBubble(opt, "user");
          sendToServer(opt);
        });
        wrap.appendChild(btn);
      });
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
    }

    function addResult(objective, barrier) {
      const div = document.createElement("div");
      div.className = "talk-result";
      div.innerHTML = `
        <span>✦</span>
        <div>
          <strong>Pronto! Seu 1% já está te esperando.</strong>
          <small>Objetivo: ${objective} · Barreira: ${barrier}</small>
        </div>`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    async function sendToServer(text) {
      if (sending) return;
      sending = true;
      try {
        const res = await fetch("/api/talk/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: currentStep, text }),
        });
        const data = await res.json();
        if (data.error) {
          sending = false;
          return;
        }

        currentStep = data.step;
        addBubble(data.reply, "rastro");

        if (data.options && data.options.length) {
          addOptions(data.options);
        }

        if (data.done) {
          inputRow.style.display = "none";
          addResult(data.objective, data.barrier);
          setTimeout(() => {
            window.location.href = data.redirect || "/onepct";
          }, 2200);
        }
      } catch (err) {
        addBubble("Tive um problema para responder agora. Tenta de novo?", "rastro");
      } finally {
        sending = false;
      }
    }

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addBubble(text, "user");
      input.value = "";
      autoGrowInput(input);
      sendToServer(text);
    }

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    input.addEventListener("input", () => autoGrowInput(input));
  },
};

/* ---------------- SECRET: posts anônimos ---------------- */
const RastroSecret = {
  init() {
    const feed = document.getElementById("secret-feed");
    const textarea = document.getElementById("secret-textarea");
    const counter = document.getElementById("secret-counter");
    const postBtn = document.getElementById("secret-post-btn");
    if (!feed) return;

    if (textarea && counter) {
      textarea.addEventListener("input", () => {
        counter.textContent = `${textarea.value.length}/500`;
      });
    }

    postBtn.addEventListener("click", async () => {
      const text = textarea.value.trim();
      if (!text) return;

      const res = await fetch("/api/secret/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.post) return;

      const article = document.createElement("article");
      article.className = "secret-post";
      article.dataset.id = data.post.id;
      article.innerHTML = `
        <p></p>
        <button class="secret-heart">♡ <span class="heart-count">0</span> <span>eu também</span></button>
        <button class="secret-report">denunciar</button>`;
      article.querySelector("p").textContent = data.post.text;
      feed.prepend(article);

      textarea.value = "";
      if (counter) counter.textContent = "0/500";
    });

    feed.addEventListener("click", async (e) => {
      const heartBtn = e.target.closest(".secret-heart");
      if (heartBtn) {
        const post = heartBtn.closest(".secret-post");
        const id = post.dataset.id;
        const res = await fetch("/api/secret/heart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (data.hearts !== undefined) {
          heartBtn.querySelector(".heart-count").textContent = data.hearts;
        }
        return;
      }

      const reportBtn = e.target.closest(".secret-report");
      if (reportBtn) {
        reportBtn.textContent = "denunciado";
        reportBtn.disabled = true;
        reportBtn.style.opacity = "0.5";
        reportBtn.style.cursor = "default";
      }
    });
  },
};

/* ---------------- 1%: Desafio dos 7 dias ---------------- */
const RastroChallenge = {
  init() {
    const root = document.getElementById("challenge");
    if (!root) return;

    const chips = Array.from(root.querySelectorAll(".day-chip"));
    const panels = Array.from(root.querySelectorAll(".challenge-day"));
    if (!chips.length || !panels.length) return; // desafio indisponível

    const perDay = parseInt(root.dataset.perDay, 10) || 5;
    const totalMissions = parseInt(root.dataset.total, 10) || chips.length * perDay;
    const totalDays = chips.length;
    const missionPoints = parseInt(root.dataset.missionPoints, 10) || 5;
    const endpoint = root.dataset.endpoint || "/api/onepct/mission";

    const $ = (id) => document.getElementById(id);
    const toast = $("ch-toast");
    let toastTimer = null;
    let current = 1;

    // ---------- persistência (servidor: grava a missão e dá os pontos) ----------
    // as requisições vão em fila, uma de cada vez, para a ordem dos cliques ser respeitada
    let queue = Promise.resolve();
    function saveMission(item, done) {
      const body = JSON.stringify({
        day: parseInt(item.dataset.day, 10),
        position: parseInt(item.dataset.pos, 10),
        done,
      });
      queue = queue.then(async () => {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) throw Object.assign(new Error("save"), { data });
          updatePoints(data.points);
          if (data.gained > 0) showToast(`+${data.gained} pontos! Missão concluída.`, "success");
          else if (data.gained < 0) showToast(`${data.gained} pontos (missão desmarcada).`, "info");
        } catch (err) {
          // não salvou: desfaz a marcação na tela para não mostrar algo que não valeu
          if (item.classList.contains("done") === done) {
            paint(item, !done);
            refreshAll();
            if (!isUnlocked(current)) selectDay(firstIncompleteDay(), { silent: true });
          }
          const locked = err.data && err.data.error === "day_locked";
          showToast(locked
            ? "Complete todas as missões do dia anterior primeiro."
            : "Não foi possível salvar agora. Tente novamente.", "error");
        }
      });
    }

    function updatePoints(points) {
      const el = $("ch-points");
      if (el && typeof points === "number") el.textContent = String(points);
    }

    // ---------- helpers ----------
    function showToast(msg, kind = "error") {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.toggle("is-success", kind === "success");
      toast.classList.toggle("is-info", kind === "info");
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
    }

    function doneCount(day) {
      return root.querySelectorAll(`.mission.done[data-day="${day}"]`).length;
    }
    function isDayComplete(day) { return doneCount(day) >= perDay; }

    // um dia só abre se TODOS os dias anteriores estiverem completos
    function isUnlocked(day) {
      for (let d = 1; d < day; d++) if (!isDayComplete(d)) return false;
      return true;
    }
    function firstIncompleteDay() {
      for (let d = 1; d <= totalDays; d++) if (!isDayComplete(d)) return d;
      return totalDays;
    }

    function paint(item, done) {
      item.classList.toggle("done", done);
      item.setAttribute("aria-checked", done ? "true" : "false");
      const check = item.querySelector(".goal-check");
      if (check) check.textContent = done ? "✓" : "";
    }

    // ---------- atualização da interface ----------
    function refreshDay(day) {
      const n = doneCount(day);
      const complete = n >= perDay;

      const chip = root.querySelector(`.day-chip[data-day="${day}"]`);
      if (chip) {
        const count = chip.querySelector(".day-chip-count");
        if (count) count.textContent = `${n}/${perDay}`;
        chip.classList.toggle("is-done", complete);
        chip.classList.toggle("is-progress", !complete && n > 0);
        chip.classList.toggle("is-idle", n === 0);
      }

      const panel = $(`day-panel-${day}`);
      if (panel) {
        const label = panel.querySelector(".challenge-day-count");
        if (label) label.textContent = `${n}/${perDay} missões concluídas`;
        const msg = panel.querySelector(".challenge-day-message");
        if (msg) msg.hidden = !complete;
      }
    }

    function refreshLocks() {
      chips.forEach((chip) => {
        const day = parseInt(chip.dataset.day, 10);
        const locked = !isUnlocked(day);
        chip.classList.toggle("is-locked", locked);
        chip.setAttribute("aria-disabled", locked ? "true" : "false");
      });

      // botão "Dia N →" só habilita quando o dia atual está completo
      root.querySelectorAll(".challenge-step").forEach((btn) => {
        const target = parseInt(btn.dataset.go, 10);
        const locked = !isUnlocked(target);
        btn.classList.toggle("is-locked", locked);
        btn.setAttribute("aria-disabled", locked ? "true" : "false");
        btn.title = locked ? `Complete as ${perDay} missões do Dia ${target - 1} para liberar` : "";
      });
    }

    function refreshTotals() {
      const done = root.querySelectorAll(".mission.done").length;
      const pct = Math.round((done * 100) / totalMissions);
      const remaining = totalMissions - done;

      const total = $("ch-total");
      if (total) total.textContent = `${done}/${totalMissions} missões`;
      const percent = $("ch-percent");
      if (percent) percent.textContent = `${pct}%`;
      const fill = $("ch-bar-fill");
      if (fill) fill.style.width = `${pct}%`;
      const bar = $("ch-bar");
      if (bar) bar.setAttribute("aria-valuenow", String(pct));
      const rem = $("ch-remaining");
      if (rem) {
        rem.textContent = remaining === 0
          ? "Você completou todas as missões."
          : `Faltam ${remaining} ${remaining === 1 ? "missão" : "missões"} para completar o desafio.`;
      }
      const final = $("ch-final");
      if (final) final.hidden = remaining !== 0;
    }

    function refreshAll() {
      for (let d = 1; d <= totalDays; d++) refreshDay(d);
      refreshLocks();
      refreshTotals();
    }

    // ---------- navegação entre dias ----------
    function selectDay(day, opts = {}) {
      day = parseInt(day, 10);
      if (!day || day < 1 || day > totalDays) return;

      if (!isUnlocked(day)) {
        if (!opts.silent) {
          showToast(`Complete todas as missões do Dia ${firstIncompleteDay()} para liberar o Dia ${day}.`);
        }
        return;
      }

      current = day;
      panels.forEach((panel) => { panel.hidden = parseInt(panel.dataset.day, 10) !== day; });
      chips.forEach((chip) => {
        chip.setAttribute("aria-selected", parseInt(chip.dataset.day, 10) === day ? "true" : "false");
      });
    }

    // ---------- marcar / desmarcar missão ----------
    function toggle(item) {
      const done = !item.classList.contains("done");
      paint(item, done);
      refreshAll();
      saveMission(item, done);
      // se desmarcar uma missão trancou o dia aberto, volta pro primeiro dia liberado
      if (!isUnlocked(current)) selectDay(firstIncompleteDay(), { silent: true });
    }

    // ---------- estado inicial ----------
    // o que já foi concluído vem do servidor, já marcado no HTML
    refreshAll();
    selectDay(firstIncompleteDay(), { silent: true });

    // ---------- eventos ----------
    chips.forEach((chip) => chip.addEventListener("click", () => selectDay(chip.dataset.day)));

    root.querySelectorAll(".challenge-step").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = parseInt(btn.dataset.go, 10);
        // avançar exige o dia atual completo (o botão fica "apagado", mas clicável, para explicar o motivo)
        if (target > current && !isDayComplete(current)) {
          const faltam = perDay - doneCount(current);
          showToast(`Faltam ${faltam} ${faltam === 1 ? "missão" : "missões"} no Dia ${current} para liberar o Dia ${target}.`);
          return;
        }
        selectDay(target);
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    root.querySelectorAll(".mission").forEach((item) => {
      item.addEventListener("click", () => toggle(item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(item);
        }
      });
    });
  },
};

/* ---------------- Voluntariado (usuário): chat persistente com voluntário ---------------- */
const RastroVolunteer = {
  init() {
    const chat = document.getElementById("volunteer-chat");
    if (!chat) return;

    const log = document.getElementById("volunteer-log");
    const input = document.getElementById("volunteer-input");
    const sendBtn = document.getElementById("volunteer-send");
    const areasBox = document.getElementById("volunteer-areas-box");
    const outcomeBox = document.getElementById("volunteer-outcome-box");

    let ticketId = chat.dataset.ticketId ? parseInt(chat.dataset.ticketId, 10) : null;
    let ticketOpen = chat.dataset.ticketOpen === "true";
    let sending = false;
    let pollTimer = null;

    function addBubble(text, sender) {
      const div = document.createElement("div");
      div.className = `bubble ${sender === "usuario" ? "user" : "rastro"}`;
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    function collectAreas() {
      if (!areasBox) return [];
      return Array.from(areasBox.querySelectorAll('input[name="areas"]:checked')).map((el) => el.value);
    }

    async function createTicket(text) {
      const areas = collectAreas();
      const res = await fetch("/api/voluntario/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, areas }),
      });
      const data = await res.json();
      if (data.error) return;

      ticketId = data.ticket_id;
      ticketOpen = !data.crisis;
      chat.dataset.ticketId = ticketId;
      chat.dataset.ticketOpen = ticketOpen ? "true" : "false";

      if (areasBox) areasBox.remove();

      // a bolha de abertura (sistema) e a mensagem do usuário já estão na tela;
      // adiciona só o que veio depois delas (aviso de espera ou mensagem do CVV)
      (data.messages || []).slice(2).forEach((m) => addBubble(m.text, m.sender));

      if (!ticketOpen) {
        document.getElementById("volunteer-input-row")?.remove();
      } else {
        startPolling();
      }
    }

    async function sendFollowUp(text) {
      const res = await fetch("/api/voluntario/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId, text }),
      });
      const data = await res.json();
      if (data.error) return;
    }

    async function send() {
      if (sending) return;
      const text = input.value.trim();
      if (!text) return;
      sending = true;
      input.value = "";
      autoGrowInput(input);
      addBubble(text, "usuario");

      try {
        if (!ticketId) {
          await createTicket(text);
        } else {
          await sendFollowUp(text);
        }
      } finally {
        sending = false;
      }
    }

    if (sendBtn) sendBtn.addEventListener("click", send);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });
      input.addEventListener("input", () => autoGrowInput(input));
    }

    function startPolling() {
      if (pollTimer || !ticketId) return;
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`/api/voluntario/mensagens/${ticketId}`);
          const data = await res.json();
          if (!data.messages) return;
          const current = log.querySelectorAll(".bubble").length;
          if (data.messages.length > current) {
            data.messages.slice(current).forEach((m) => addBubble(m.text, m.sender));
          }
          if (data.status !== "fila" && data.status !== "em_atendimento") {
            clearInterval(pollTimer);
            pollTimer = null;
            document.getElementById("volunteer-input-row")?.remove();
            window.location.reload();
          }
        } catch (err) {
          /* silencioso — tenta de novo no próximo ciclo */
        }
      }, 4000);
    }

    if (ticketId && ticketOpen) startPolling();

    // ---- registrar resultado do atendimento (encerrado/encaminhado ao CVV) ----
    if (outcomeBox) {
      const commentEl = document.getElementById("volunteer-outcome-comment");
      outcomeBox.querySelectorAll("[data-rating]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          outcomeBox.querySelectorAll("[data-rating]").forEach((b) => (b.disabled = true));
          try {
            await fetch(`/api/voluntario/ticket/${ticketId}/resultado`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rating: btn.dataset.rating, comment: commentEl ? commentEl.value.trim() : "" }),
            });
          } finally {
            outcomeBox.innerHTML = "<p>Obrigado por contar como foi. 🌿</p>";
          }
        });
      });
    }
  },
};

/* ---------------- Voluntariado (painel do voluntário): abas + chat das conversas ---------------- */
const RastroVolunteerPanel = {
  init() {
    const tabs = document.querySelectorAll(".volunteer-panel-tab");
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".volunteer-panel-tabpage").forEach((page) => {
          page.hidden = page.dataset.tabpage !== tab.dataset.tab;
        });
      });
    });

    document.querySelectorAll(".volunteer-conversation").forEach((card) => {
      const ticketId = card.dataset.ticketId;
      const log = document.getElementById(`conv-log-${ticketId}`);
      const input = document.getElementById(`conv-input-${ticketId}`);
      const sendBtn = card.querySelector(".conv-send");

      function addBubble(text, sender) {
        const div = document.createElement("div");
        div.className = `bubble ${sender === "voluntario" ? "user" : "rastro"}`;
        div.textContent = text;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
      }

      async function send() {
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        autoGrowInput(input);
        addBubble(text, "voluntario");
        await fetch(`/voluntario/tickets/${ticketId}/mensagem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      if (sendBtn) sendBtn.addEventListener("click", send);
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        });
        input.addEventListener("input", () => autoGrowInput(input));
      }

      setInterval(async () => {
        try {
          const res = await fetch(`/voluntario/tickets/${ticketId}/mensagens`);
          const data = await res.json();
          if (!data.messages) return;
          const current = log.querySelectorAll(".bubble").length;
          if (data.messages.length > current) {
            data.messages.slice(current).forEach((m) => addBubble(m.text, m.sender));
          }
        } catch (err) {
          /* silencioso — tenta de novo no próximo ciclo */
        }
      }, 4000);
    });
  },
};
