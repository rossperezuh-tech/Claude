/* Shared behavior for every site: category filter, search, 3D tilt, signup.
   The product cards are already in the HTML. This script only shows and hides them. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var q = $("#q");
  var cards = $$(".card");
  var secs = $$(".sec");
  var chips = $$(".chip");
  var empty = $("#empty");
  var active = "all";

  /* Categories start closed. Picking a category or searching opens what matches. */
  function apply() {
    var term = q ? q.value.trim().toLowerCase() : "";
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (active === "all" || c.dataset.cat === active) &&
               (!term || c.dataset.search.indexOf(term) !== -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    secs.forEach(function (s) {
      var n = $$(".card:not([hidden])", s).length;
      s.hidden = !n;
      s.open = n > 0 && (active !== "all" || !!term);
      var count = $(".count", s);
      if (count) count.textContent = n + (n === 1 ? " product" : " products");
    });
    if (empty) empty.hidden = shown > 0;
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", c.dataset.id === active ? "true" : "false");
    });
  }

  function toCatalog() {
    var t = $("#catalog");
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pick(id, scroll) {
    active = id;
    apply();
    var chip = chips.filter(function (c) { return c.dataset.id === id; })[0];
    if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: "nearest", inline: "center" });
    if (scroll) toCatalog();
  }

  /* Links that point at one product (the Start Here cards) open its category first. */
  $$('a[href^="#p-"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var card = document.getElementById(a.getAttribute("href").slice(1));
      if (!card) return;
      e.preventDefault();
      if (q) q.value = "";
      active = "all";
      apply();
      var sec = card.closest(".sec");
      if (sec) sec.open = true;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("flash");
      setTimeout(function () { card.classList.remove("flash"); }, 1800);
    });
  });

  chips.forEach(function (c) {
    c.addEventListener("click", function () { pick(c.dataset.id, true); });
  });
  $$(".tile").forEach(function (t) {
    t.addEventListener("click", function () { pick(t.dataset.cat, true); });
  });

  if (q) {
    q.addEventListener("input", apply);
    q.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); q.blur(); toCatalog(); }
    });
  }

  /* 3D effects, only for devices with a real pointer and no reduced-motion setting */
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var calm = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (fine && !calm) {
    var hero = $(".hero"), tiles = $(".tiles");
    if (hero && tiles) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        tiles.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        tiles.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      hero.addEventListener("pointerleave", function () {
        tiles.style.setProperty("--px", 0);
        tiles.style.setProperty("--py", 0);
      });
    }
    cards.forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        c.style.setProperty("--rx", (y * -5).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () {
        c.style.setProperty("--ry", "0deg");
        c.style.setProperty("--rx", "0deg");
      });
    });
  }

  /* Email signup.
     CONNECT A PROVIDER: put the provider's form URL in "signup.action" inside the
     site's site.json and rebuild. Until then the form shows a "coming soon" note
     and sends nothing anywhere. */
  var form = $("#signup-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      var msg = $("#signup-msg");
      var action = form.getAttribute("data-action");
      if (!action) {
        e.preventDefault();
        msg.textContent = form.getAttribute("data-pending");
        return;
      }
      e.preventDefault();
      msg.textContent = "Sending…";
      fetch(action, { method: "POST", body: new FormData(form), mode: "no-cors" })
        .then(function () { msg.textContent = "You're on the list. Thank you!"; form.reset(); })
        .catch(function () { msg.textContent = "That didn't go through. Please try again."; });
    });
  }

  apply();
})();
