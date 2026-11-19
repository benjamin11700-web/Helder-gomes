/* Le Joint d'Helder — comportements communs aux maquettes A, B et C.
   Chaque site garde son propre style et sa propre transition (CSS) ;
   ce fichier ne fait que poser les classes. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EMAIL = "lejointdhelder@gmail.com", TEL = "07 49 89 86 35";

  /* ---------- menu mobile ---------- */
  document.querySelectorAll("[data-menu]").forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open);
      btn.textContent = open ? "Fermer" : label;
    });
    document.querySelectorAll("[data-menu-links] a").forEach(a => a.addEventListener("click", () => {
      document.body.classList.remove("menu-open"); btn.setAttribute("aria-expanded", false); btn.textContent = label;
    }));
  });

  /* ---------- carrousel ----------
     .slide.is-active = visible ; .slide.is-leaving = en train de partir.
     data-dir="next|prev" sur le conteneur pour orienter la transition. */
  document.querySelectorAll("[data-slider]").forEach(root => {
    const slides = [...root.querySelectorAll(".slide")];
    const scope = root.closest("[data-slider-scope]") || root.parentElement;
    const count = scope.querySelector("[data-count]");
    const pauseBtn = scope.querySelector("[data-pause]");
    const DUR = +root.dataset.duration || 1200, DELAY = +root.dataset.delay || 6500;
    let i = 0, busy = false, t, paused = reduce;
    slides[0].classList.add("is-active");
    const paint = () => { if (count) count.textContent = `${i + 1} / ${slides.length}`; };
    function go(n, dir) {
      if (busy || slides.length < 2) return;
      n = (n + slides.length) % slides.length; if (n === i) return;
      busy = true; root.dataset.dir = dir > 0 ? "next" : "prev";
      const old = slides[i]; i = n; const nw = slides[i];
      old.classList.remove("is-active"); old.classList.add("is-leaving");
      void nw.offsetWidth; nw.classList.add("is-active"); paint();
      setTimeout(() => { old.classList.remove("is-leaving"); busy = false; }, reduce ? 0 : DUR);
      schedule();
    }
    function schedule() { clearTimeout(t); if (!paused) t = setTimeout(() => go(i + 1, 1), DELAY); }
    const next = () => go(i + 1, 1), prev = () => go(i - 1, -1);
    scope.querySelector("[data-next]")?.addEventListener("click", next);
    scope.querySelector("[data-prev]")?.addEventListener("click", prev);
    if (pauseBtn) {
      const sync = () => {
        pauseBtn.setAttribute("aria-pressed", paused);
        pauseBtn.setAttribute("aria-label", paused ? "Reprendre le défilement" : "Mettre le défilement en pause");
        pauseBtn.innerHTML = paused
          ? '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
          : '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
      };
      pauseBtn.addEventListener("click", () => { paused = !paused; sync(); paused ? clearTimeout(t) : schedule(); });
      sync();
    }
    let x0 = null;
    root.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
    root.addEventListener("touchend", e => {
      if (x0 === null) return; const d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 45) d < 0 ? next() : prev(); x0 = null;
    });
    scope.addEventListener("keydown", e => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); });
    paint(); schedule();
  });

  /* ---------- avant / après ---------- */
  document.querySelectorAll("[data-ba]").forEach(ba => {
    const r = ba.querySelector("input");
    r.addEventListener("input", () => ba.style.setProperty("--p", r.value + "%"));
  });

  /* ---------- galerie + visionneuse ---------- */
  const items = [...document.querySelectorAll("[data-gallery] [data-src]")];
  if (items.length) {
    const lb = document.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photo agrandie");
    lb.innerHTML = `<div class="lb-stage"></div>
      <div class="lb-bar">
        <button type="button" class="lb-btn" data-lb="prev" aria-label="Photo précédente"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg></button>
        <p class="lb-cap" aria-live="polite"></p>
        <button type="button" class="lb-btn" data-lb="next" aria-label="Photo suivante"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg></button>
        <button type="button" class="lb-btn" data-lb="close" aria-label="Fermer"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>`;
    document.body.appendChild(lb);
    const stage = lb.querySelector(".lb-stage"), cap = lb.querySelector(".lb-cap");
    let k = 0, cur = null, last = null;
    function show(n, dir = 1) {
      k = (n + items.length) % items.length; const it = items[k];
      const im = new Image(); im.src = it.dataset.src; im.alt = it.dataset.cap || "";
      im.className = "lb-img " + (dir > 0 ? "from-r" : "from-l"); stage.appendChild(im);
      if (cur) { const o = cur; o.classList.remove("on"); o.classList.add(dir > 0 ? "to-l" : "to-r"); setTimeout(() => o.remove(), 700); }
      requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add("on")));
      cur = im; cap.textContent = `${it.dataset.cap} (${k + 1}/${items.length})`;
    }
    function open(n) { last = document.activeElement; lb.classList.add("open"); document.body.style.overflow = "hidden"; stage.innerHTML = ""; cur = null; show(n); lb.querySelector('[data-lb="close"]').focus(); }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; last && last.focus(); }
    items.forEach((it, n) => it.addEventListener("click", () => open(n)));
    lb.addEventListener("click", e => {
      const b = e.target.closest("[data-lb]");
      if (b) { b.dataset.lb === "next" ? show(k + 1, 1) : b.dataset.lb === "prev" ? show(k - 1, -1) : close(); }
      else if (e.target === lb || e.target === stage) close();
    });
    addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(k + 1, 1); if (e.key === "ArrowLeft") show(k - 1, -1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
    lb.addEventListener("touchend", e => { if (x0 === null) return; const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 45) d < 0 ? show(k + 1, 1) : show(k - 1, -1); x0 = null; });
  }

  /* ---------- mentions légales ---------- */
  const ml = document.getElementById("ml");
  if (ml) {
    document.querySelectorAll("[data-ml]").forEach(b => b.addEventListener("click", () => ml.showModal ? ml.showModal() : ml.setAttribute("open", "")));
    ml.querySelector("[data-ml-close]")?.addEventListener("click", () => ml.close());
    ml.addEventListener("click", e => { if (e.target === ml) ml.close(); });
  }

  /* ---------- formulaire de devis (ouvre la messagerie) ---------- */
  document.querySelectorAll("form[data-devis]").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault(); const m = f.querySelector("[data-msg]");
    const nom = f.elements.nom, tel = f.elements.tel;
    if (!nom.value.trim() || !tel.value.trim()) {
      m.textContent = "Indiquez au moins votre nom et votre téléphone pour qu’Helder puisse vous rappeler.";
      (nom.value.trim() ? tel : nom).focus(); return;
    }
    const type = f.elements.type ? f.elements.type.value : "Travaux";
    const body = `Nom : ${nom.value}\nTéléphone : ${tel.value}\nCommune : ${f.elements.ville?.value || ""}\nTravaux : ${type}\n\n${f.elements.msg?.value || ""}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Demande de devis : " + type)}&body=${encodeURIComponent(body)}`;
    m.textContent = `Votre messagerie s’ouvre avec la demande rédigée. Si rien ne s’ouvre, appelez le ${TEL}.`;
  }));


  /* ---------- écran d'ouverture (couteau à enduire) ---------- */
  if (!reduce && !sessionStorageSafe("loaderSeen")) {
    const l = document.createElement("div"); l.className = "loader"; l.setAttribute("aria-hidden", "true");
    l.innerHTML = '<div class="seam"></div><svg class="knife" viewBox="0 0 80 80"><path d="M10 34h60l-6 16H16z" fill="#d9dee1" stroke="#5b6368" stroke-width="2"/><rect x="34" y="50" width="12" height="22" rx="3" fill="#c8201b" stroke="#2d3337" stroke-width="2"/></svg>';
    document.body.prepend(l); setTimeout(() => l.classList.add("gone"), 1600);
  }
  function sessionStorageSafe(k) { try { const v = sessionStorage.getItem(k); sessionStorage.setItem(k, "1"); return v; } catch (e) { return null; } }

  /* ---------- apparitions au défilement ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .2, rootMargin: "0px 0px -8% 0px" }) : null;
  document.querySelectorAll("[data-anim],[data-draw]").forEach(el => reduce || !io ? el.classList.add("in") : io.observe(el));

  /* ---------- parallaxe légère (data-parallax="0.15") ---------- */
  const par = [...document.querySelectorAll("[data-parallax]")];
  if (par.length && !reduce) {
    let ticking = false;
    const upd = () => { const vh = innerHeight; par.forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      const k = +el.dataset.parallax || .12; el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + "px");
    }); ticking = false; };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener("resize", upd); upd();
  }

  document.querySelectorAll("[data-year]").forEach(s => s.textContent = new Date().getFullYear());
})();
