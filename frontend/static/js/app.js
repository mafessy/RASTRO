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

/* ---------------- 1% novo: ciclo mensal/semanal/diário ---------------- */
const RastroCycle = {
  init() {
    const list = document.querySelectorAll(".goal[data-kind]");
    if (!list.length) return;

    async function toggle(item) {
      if (item.classList.contains("locked-card")) return;
      const kind = item.dataset.kind;
      const id = item.dataset.id;
      item.style.pointerEvents = "none";
      try {
        const res = await fetch("/api/goals/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, id }),
        });
        const data = await res.json();
        if (data.error) {
          item.style.pointerEvents = "";
          return;
        }
        // o desbloqueio de novas semanas/dias muda a estrutura da página,
        // então recarregamos pra refletir o estado real vindo do servidor
        window.location.reload();
      } catch (err) {
        item.style.pointerEvents = "";
      }
    }

    list.forEach((item) => {
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

/* ---------------- 1%: abas "Desafio dos 7 dias" / "Meu ciclo" ---------------- */
const RastroOnepctTabs = {
  init() {
    const tabs = document.querySelectorAll(".onepct-tab");
    if (!tabs.length) return;

    const show = (name) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.pane === name;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      document.querySelectorAll(".onepct-pane").forEach((pane) => {
        pane.hidden = pane.id !== `pane-${name}`;
      });
      try { localStorage.setItem("rastro_onepct_tab", name); } catch (e) { /* só preferência visual */ }
    };

    tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.pane)));

    let saved = null;
    try { saved = localStorage.getItem("rastro_onepct_tab"); } catch (e) { /* ignora */ }
    if (saved === "ciclo" || saved === "desafio") show(saved);
  },
};

/* ---------------- 1%: desafio dos 7 dias (5 missões por dia) ---------------- */
const RastroChallenge = {
  init() {
    const root = document.getElementById("challenge");
    if (!root || !root.dataset.total) return;

    const total = parseInt(root.dataset.total, 10);
    const perDay = parseInt(root.dataset.perDay, 10);
    const chips = root.querySelectorAll(".day-chip");
    const panels = root.querySelectorAll(".challenge-day");
    const toast = document.getElementById("ch-toast");
    let toastTimer = null;

    function selectDay(day) {
      chips.forEach((chip) => chip.setAttribute("aria-selected", chip.dataset.day === String(day) ? "true" : "false"));
      panels.forEach((panel) => { panel.hidden = panel.dataset.day !== String(day); });
      const chip = root.querySelector(`.day-chip[data-day="${day}"]`);
      if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: "nearest", inline: "center" });
    }

    function showError() {
      if (!toast) return;
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
    }

    // recalcula tudo a partir do que está marcado na tela (fonte única da verdade visual)
    function refresh(day) {
      const panel = root.querySelector(`.challenge-day[data-day="${day}"]`);
      const dayDone = panel.querySelectorAll(".mission.done").length;
      panel.querySelector(".challenge-day-count").textContent = `${dayDone}/${perDay} missões concluídas`;
      panel.querySelector(".challenge-day-message").hidden = dayDone !== perDay;

      const chip = root.querySelector(`.day-chip[data-day="${day}"]`);
      chip.querySelector(".day-chip-count").textContent = `${dayDone}/${perDay}`;
      chip.classList.toggle("is-done", dayDone === perDay);
      chip.classList.toggle("is-progress", dayDone > 0 && dayDone < perDay);
      chip.classList.toggle("is-idle", dayDone === 0);

      const done = root.querySelectorAll(".mission.done").length;
      const pct = Math.round((done / total) * 100);
      const remaining = total - done;
      document.getElementById("ch-total").textContent = `${done}/${total} missões`;
      document.getElementById("ch-percent").textContent = `${pct}%`;
      document.getElementById("ch-bar-fill").style.width = `${pct}%`;
      document.getElementById("ch-bar").setAttribute("aria-valuenow", pct);
      document.getElementById("ch-remaining").textContent = remaining === 0
        ? "Você completou todas as missões."
        : `Faltam ${remaining} ${remaining === 1 ? "missão" : "missões"} para completar o desafio.`;
      document.getElementById("ch-final").hidden = remaining !== 0;
    }

    function paint(item, done) {
      item.classList.toggle("done", done);
      item.setAttribute("aria-checked", done ? "true" : "false");
      item.querySelector(".goal-check").textContent = done ? "✓" : "";
    }

    async function toggle(item) {
      if (item.dataset.busy === "1") return;
      item.dataset.busy = "1";
      const day = item.dataset.day;
      const wasDone = item.classList.contains("done");
      const wantDone = !wasDone;

      paint(item, wantDone); // muda na hora; volta atrás se o servidor recusar
      refresh(day);
      try {
        const res = await fetch("/api/onepct/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day: parseInt(day, 10), position: parseInt(item.dataset.pos, 10), done: wantDone }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "erro");
      } catch (err) {
        paint(item, wasDone);
        refresh(day);
        showError();
      } finally {
        delete item.dataset.busy;
      }
    }

    chips.forEach((chip) => chip.addEventListener("click", () => selectDay(chip.dataset.day)));
    root.querySelectorAll(".challenge-step").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectDay(btn.dataset.go);
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
