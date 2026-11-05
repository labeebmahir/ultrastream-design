// Shared by this prototype's admin pages: status badges, the confirm dialog, and pausing and resuming a campaign.
(function () {
  US.statusBadge = (status) => `<span class="badge badge--${status}">${status === "paused" ? '<i class="icon icon--sm" data-lucide="pause"></i>' : ""}${US.STATUS_LABELS[status]}</span>`;

  // Like the panel's modal: a title, a few lines, then Cancel and Confirm on the right. Resolves true on confirm.
  US.confirmModal = ({ title, lines, confirm }) => new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "modal";
    dialog.setAttribute("aria-labelledby", "modal-title");
    dialog.innerHTML = `<h2 id="modal-title">${US.esc(title)}</h2>
      ${lines.map((line) => `<p>${US.esc(line)}</p>`).join("")}
      <div class="modal__actions">
        <button class="btn" type="button" value="cancel">Cancel</button>
        <button class="btn btn--primary" type="button" value="ok" data-confirm>${US.esc(confirm)}</button>
      </div>`;
    document.body.append(dialog);
    const close = (ok) => {
      dialog.close();
      dialog.remove();
      resolve(ok);
    };
    dialog.addEventListener("click", (e) => {
      const value = e.target.closest("button")?.value;
      if (value) close(value === "ok");
    });
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      close(false);
    });
    dialog.showModal();
    dialog.querySelector('[value="cancel"]').focus();
  });

  US.askPause = async (c) => {
    const ok = await US.confirmModal({
      title: `Pause ${c.advertiser}?`,
      lines: ["The ad stops showing in Discover until you resume it.", "Paused days are added to the end date. There's no refund."],
      confirm: "Pause campaign",
    });
    if (!ok) return;
    US.pause(c.id);
    US.toast(`${c.advertiser} is paused and won't show in Discover`);
  };

  US.askResume = async (c) => {
    const ok = await US.confirmModal({
      title: `Resume ${c.advertiser}?`,
      lines: [`The ad shows in Discover again straight away. With the days paused so far, its last day is now ${US.fmtDate(US.lastDay(c))}.`],
      confirm: "Resume campaign",
    });
    if (!ok) return;
    US.resume(c.id);
    US.toast(`${c.advertiser} is live again until ${US.fmtDate(US.lastDay(c))}`);
  };

  // Any button with data-pause or data-resume set to a campaign id.
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-pause], [data-resume]");
    if (!button) return;
    const c = US.campaign(button.dataset.pause || button.dataset.resume);
    if (c) ("pause" in button.dataset ? US.askPause : US.askResume)(c);
  });

  // Paused time as plain words: "2 days", "1.5 days" or "5 hours".
  US.fmtDuration = (ms) => {
    const hours = ms / 3600000;
    if (hours < 24) {
      const h = Math.max(1, Math.round(hours));
      return `${h} hour${h === 1 ? "" : "s"}`;
    }
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days} day${days === 1 ? "" : "s"}`;
  };
})();
