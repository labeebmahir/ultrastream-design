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
    stream = US.createFeedStream(category);
    feed.scrollTop = 0;
    feed.innerHTML = "";
    feed.append(sentinel);
    appendBatch();
  }

  US.setupChips(document.getElementById("chips"), render);
  US.setupNotBuilt();
  render(null);
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) appendBatch();
  }, { root: feed, rootMargin: "600px" }).observe(sentinel);
})();
