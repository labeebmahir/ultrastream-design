// One-at-a-time questions: tap an answer and move on, review, then export a file.
// Nothing is sent anywhere. Answers stay in the person's own browser until they export them.
US.setupAnswers = ({ root, feature, featureName, questions }) => {
  const key = `us-answers-${feature}-v2`;
  const OTHER = "Something else";
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let state = { name: "", answers: {} };
  try {
    state = { ...state, ...JSON.parse(localStorage.getItem(key)) };
  } catch (e) {
    // Starts empty if this browser blocks storage.
  }
  let at = questions.findIndex((_, i) => !state.answers[i]?.choice);
  if (at < 0) at = questions.length;
  let noteOpen = false;
  let timer = null;

  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      US.toast("Couldn't save in this browser. Export your answers before leaving.");
    }
    document.dispatchEvent(new CustomEvent("us:answers"));
  };
  const answerOf = (i) => state.answers[i] || {};
  const isAnswered = (i) => Boolean(answerOf(i).choice || answerOf(i).note?.trim());
  const answeredCount = () => questions.filter((_, i) => isAnswered(i)).length;
  const answerText = (i) => {
    const { choice, note } = answerOf(i);
    return choice === OTHER ? note?.trim() || OTHER : choice || "";
  };

  function progressHTML() {
    const dots = questions.map((q, i) => {
      const cls = [i === at ? "is-current" : "", isAnswered(i) ? "is-done" : ""].join(" ");
      return `<button class="ask-dot ${cls}" type="button" data-go="${i}" aria-label="Question ${i + 1}: ${US.esc(q.title)}${isAnswered(i) ? ", answered" : ""}"${i === at ? ' aria-current="step"' : ""}></button>`;
    }).join("");
    return `<div class="ask-progress">
      <div class="ask-progress__dots">${dots}</div>
      <button class="ask-progress__review ${at === questions.length ? "is-current" : ""}" type="button" data-go="${questions.length}">
        <span id="ask-count">${answeredCount()}/${questions.length}</span> Review
      </button>
    </div>`;
  }

  function questionHTML() {
    const q = questions[at];
    const answer = answerOf(at);
    const options = [...q.options, OTHER].map((label, i) => {
      const selected = answer.choice === label;
      const current = i === q.current;
      return `<button class="ask-option ${selected ? "is-selected" : ""}" type="button" data-choice="${US.esc(label)}" aria-pressed="${selected}">
        <span class="ask-option__key" aria-hidden="true">${i + 1}</span>
        <span class="ask-option__label">${US.esc(label)}${current ? '<span class="ask-option__now">In the prototype now</span>' : ""}</span>
        <i class="icon icon--sm ask-option__tick" data-lucide="check"></i>
      </button>`;
    }).join("");
    const showNote = noteOpen || answer.choice === OTHER || answer.note;
    return `<section class="ask-card" aria-labelledby="ask-q">
      <p class="ask-card__count">Question ${at + 1} of ${questions.length} · ${US.esc(q.title)}</p>
      <h1 class="ask-card__q" id="ask-q" tabindex="-1">${US.esc(q.ask)}</h1>
      <div class="ask-options" role="group" aria-labelledby="ask-q">${options}</div>
      ${showNote
        ? `<label class="field ask-note"><span class="field__label">${answer.choice === OTHER ? "Your answer" : "Your note"}</span><textarea class="input" id="ask-note" rows="2">${US.esc(answer.note || "")}</textarea></label>`
        : `<button class="ask-link" type="button" data-note><i class="icon icon--sm" data-lucide="message-square-plus"></i>Add a note</button>`}
      <div class="ask-nav">
        <button class="btn" type="button" data-go="${at - 1}" ${at === 0 ? "disabled" : ""}><i class="icon icon--sm" data-lucide="arrow-left"></i>Back</button>
        <button class="btn ${isAnswered(at) ? "btn--primary" : ""}" type="button" data-go="${at + 1}">${isAnswered(at) ? "Next" : "Skip"}<i class="icon icon--sm" data-lucide="arrow-right"></i></button>
      </div>
    </section>`;
  }

  function reviewHTML() {
    const done = answeredCount();
    const all = done === questions.length;
    const rows = questions.map((q, i) => `<button class="ask-row" type="button" data-go="${i}">
        <span class="ask-row__n">${i + 1}</span>
        <span class="ask-row__body"><span class="ask-row__title">${US.esc(q.title)}</span><span class="ask-row__answer ${isAnswered(i) ? "" : "is-empty"}">${isAnswered(i) ? US.esc(answerText(i)) : "Not answered yet"}${answerOf(i).note?.trim() && answerOf(i).choice !== OTHER ? ` · ${US.esc(answerOf(i).note.trim())}` : ""}</span></span>
        <i class="icon icon--sm ask-row__edit" data-lucide="pencil"></i>
      </button>`).join("");
    return `<section class="ask-card ask-card--review" aria-labelledby="ask-q">
      <div class="ask-done ${all ? "is-all" : ""}" aria-hidden="true"><i class="icon" data-lucide="${all ? "check" : "list-checks"}"></i></div>
      <h1 class="ask-card__q" id="ask-q" tabindex="-1">${all ? "That's all of them. Thank you!" : `${done} of ${questions.length} answered`}</h1>
      <p class="ask-card__help">${all ? "Export your answers and send the file to whoever shared this link." : "Answer the rest, or export what you have so far."}</p>
      <label class="field ask-name"><span class="field__label">Your name <span class="opt">(optional)</span></span><input class="input" id="answer-name" autocomplete="name" value="${US.esc(state.name)}"></label>
      <div class="ask-export">
        <button class="btn btn--primary" type="button" id="answer-export"><i class="icon icon--sm" data-lucide="download"></i>Export answers</button>
        <button class="btn" type="button" id="answer-copy"><i class="icon icon--sm" data-lucide="copy"></i>Copy</button>
      </div>
      <div class="ask-rows">${rows}</div>
    </section>`;
  }

  function render(moveFocus) {
    clearTimeout(timer);
    root.innerHTML = progressHTML() + (at === questions.length ? reviewHTML() : questionHTML());
    if (moveFocus) {
      root.querySelector(".ask-card").classList.add("ask-card--enter");
      root.querySelector("#ask-q")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function go(index) {
    at = Math.max(0, Math.min(questions.length, index));
    noteOpen = false;
    render(true);
  }

  function choose(label) {
    const answer = { ...answerOf(at) };
    answer.choice = label;
    state.answers[at] = answer;
    save();
    const typing = label === OTHER || noteOpen || answer.note;
    // Mark the answer where it is, so the screen doesn't redraw under the person's finger.
    clearTimeout(timer);
    root.querySelectorAll(".ask-option").forEach((option) => {
      const selected = option.dataset.choice === label;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", selected);
    });
    root.querySelector("#ask-count").textContent = `${answeredCount()}/${questions.length}`;
    root.querySelectorAll(".ask-dot")[at].classList.add("is-done");
    const forward = root.querySelector(`.ask-nav [data-go="${at + 1}"]`);
    forward.classList.add("btn--primary");
    forward.firstChild.textContent = "Next";
    if (label === OTHER && !root.querySelector("#ask-note")) {
      render(false);
    } else if (root.querySelector("#ask-note")) {
      root.querySelector(".ask-note .field__label").textContent = label === OTHER ? "Your answer" : "Your note";
    }
    if (label === OTHER) root.querySelector("#ask-note")?.focus();
    if (!typing) timer = setTimeout(() => go(at + 1), calm ? 0 : 260);
  }

  function toMarkdown() {
    const lines = [`# ${featureName}: answers`, "", `Answered by: ${state.name.trim() || "Not given"}`, `Exported: ${new Date().toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}`, `Answered: ${answeredCount()} of ${questions.length}`, ""];
    questions.forEach((q, i) => {
      lines.push(`## Q${i + 1}. ${q.title}`, "", q.ask, "");
      lines.push(`**In the prototype now:** ${q.options[q.current] ?? "Not set"}`, "");
      lines.push(`**Answer:** ${answerText(i) || "No answer"}`, "");
      if (answerOf(i).note?.trim() && answerOf(i).choice !== OTHER) lines.push(`**Note:** ${answerOf(i).note.trim()}`, "");
    });
    return lines.join("\n");
  }

  function ready() {
    if (answeredCount()) return true;
    US.toast("Answer at least one question first.");
    return false;
  }

  function exportFile() {
    if (!ready()) return;
    const who = state.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const date = new Date();
    const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([toMarkdown()], { type: "text/markdown" }));
    link.download = `${feature}-answers${who ? "-" + who : ""}-${stamp}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    US.toast("Exported. Send the file to whoever shared this link.");
  }

  async function copyText() {
    if (!ready()) return;
    try {
      await navigator.clipboard.writeText(toMarkdown());
      US.toast("Copied. Paste it into a message.");
    } catch (e) {
      US.toast("Couldn't copy here. Use Export instead.");
    }
  }

  root.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    if (target.dataset.go !== undefined) go(Number(target.dataset.go));
    else if (target.dataset.choice) choose(target.dataset.choice);
    else if ("note" in target.dataset) {
      clearTimeout(timer);
      noteOpen = true;
      render(false);
      root.querySelector("#ask-note")?.focus();
    } else if (target.id === "answer-export") exportFile();
    else if (target.id === "answer-copy") copyText();
  });

  root.addEventListener("input", (e) => {
    if (e.target.id === "ask-note") {
      state.answers[at] = { ...answerOf(at), note: e.target.value };
      const count = root.querySelector("#ask-count");
      if (count) count.textContent = `${answeredCount()}/${questions.length}`;
    }
    if (e.target.id === "answer-name") state.name = e.target.value;
    save();
  });

  // Keyboard: number keys pick an answer, arrow keys move between questions.
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight") go(at + 1);
    else if (e.key === "ArrowLeft") go(at - 1);
    else if (at < questions.length) {
      const option = root.querySelectorAll(".ask-option")[Number(e.key) - 1];
      if (option) option.click();
    }
  });

  render(false);
};
