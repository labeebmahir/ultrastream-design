(function () {
  const feed = document.getElementById("feed");
  const sentinel = document.createElement("div");
  sentinel.className = "feed__end";
  let stream = null;

  function appendBatch() {
    let html = "";
    for (let i = 0; i < 8; i++) html += stream.next();
    sentinel.insertAdjacentHTML("beforebegin", html);
  }

  function render(category) {
    stream = US.createFeedStream(category, { suggestions: true });
    feed.scrollTop = 0;
    feed.innerHTML = "";
    feed.append(sentinel);
    appendBatch();
  }

  // States: ?state=loading|empty|error|offline
  const STATES = {
    empty: ["clapperboard", "No content yet", "Check back again", ""],
    error: ["triangle-alert", "Something went wrong", "We couldn't load the content right now", "Retry"],
    offline: ["wifi-off", "You're offline", "Connect to the internet and try again", "Retry"],
  };
  const state = new URLSearchParams(location.search).get("state");
  if (state === "loading") {
    feed.innerHTML = '<div class="card"><span class="card__thumb"></span></div>'.repeat(3);
    return;
  }
  if (STATES[state]) {
    const [icon, title, text, action] = STATES[state];
    if (state === "offline") document.getElementById("chips").hidden = true;
    feed.classList.add("feed--state");
    feed.innerHTML = `<div class="empty-state"><i class="icon empty-state__icon" data-lucide="${icon}"></i><h1 class="empty-state__title">${title}</h1><p class="empty-state__text">${text}</p>${action ? `<a class="btn btn--primary btn--lg" href="discover.html">${action}</a>` : ""}</div>`;
    return;
  }

  US.setupChips(document.getElementById("chips"), render);
  US.setupNotBuilt();
  document.addEventListener("click", (e) => {
    const follow = e.target.closest("[data-follow]");
    if (follow) follow.textContent = follow.textContent === "Follow" ? "Following" : "Follow";
  });
  render(null);
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) appendBatch();
  }, { root: feed, rootMargin: "600px" }).observe(sentinel);
})();
