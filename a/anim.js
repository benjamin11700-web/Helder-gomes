/* Site A : deuxième couche d'animations (titre tamponné, outils flottants,
   cartes inclinables, démo avant/après, bandeau réactif, chiffres qui sautent). */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hero = document.querySelector(".hero");

  /* départ du héro : après l'écran d'ouverture s'il est affiché */
  const loader = document.querySelector(".loader:not(.gone)");
  setTimeout(() => hero.classList.add("go"), reduce ? 0 : loader ? 1450 : 80);

  /* barre de progression façon ruban de chantier */
  const bar = document.querySelector(".scrollbar");
  const track = document.querySelector(".ribbon .track");
  const marquee = track && track.getAnimations ? () => track.getAnimations()[0] : () => null;
  let lastY = scrollY, vel = 0, raf = 0;
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--sp", max > 0 ? (scrollY / max).toFixed(4) : 0);
    if (reduce) return;
    vel = scrollY - lastY; lastY = scrollY;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    raf = 0;
    if (!track) return;
    const v = Math.max(-40, Math.min(40, vel));
    track.style.setProperty("--sk", (-v * 0.25).toFixed(2) + "deg");
    const a = marquee(); if (a && !document.querySelector(".ribbon.paused")) a.playbackRate = 1 + Math.abs(v) / 6;
    vel *= 0.85;
    if (Math.abs(vel) > 0.3) raf = requestAnimationFrame(tick);
    else { track.style.setProperty("--sk", "0deg"); const b = marquee(); if (b && !document.querySelector(".ribbon.paused")) b.playbackRate = 1; }
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  if (reduce) return;

  /* outils qui suivent la souris avec un effet de profondeur */
  const tools = [...hero.querySelectorAll(".tool")];
  if (fine) hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tools.forEach((t, i) => { const d = 14 + i * 8; t.style.setProperty("--mx", (-x * d).toFixed(1) + "px"); t.style.setProperty("--my", (-y * d).toFixed(1) + "px"); });
  });

  /* cartes de services inclinées sous la souris */
  if (fine) document.querySelectorAll(".card").forEach(c => {
    c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(1) + "deg");
      c.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 12).toFixed(1) + "deg");
      c.classList.add("tilt");
    });
    c.addEventListener("pointerleave", () => c.classList.remove("tilt"));
  });

  /* avant / après : petite démonstration au premier passage */
  const ba = document.querySelector("[data-ba]");
  if (ba && "IntersectionObserver" in window) {
    const input = ba.querySelector("input"); let touched = false;
    ["pointerdown", "keydown", "input"].forEach(ev => ba.addEventListener(ev, () => touched = true, { once: true }));
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), D = 2600;
      const step = now => {
        if (touched) return;
        const k = Math.min(1, (now - t0) / D);
        const v = 50 + Math.sin(k * Math.PI * 2) * 28 * (1 - k * 0.3);
        ba.style.setProperty("--p", v.toFixed(1) + "%"); input.value = v;
        if (k < 1) requestAnimationFrame(step); else { ba.style.setProperty("--p", "50%"); input.value = 50; }
      };
      setTimeout(() => requestAnimationFrame(step), 500);
    }, { threshold: 0.6 });
    io.observe(ba);
  }

  /* numéro de téléphone : chaque chiffre saute à son tour */
  document.querySelectorAll(".tel").forEach(a => {
    const txt = a.textContent; a.textContent = "";
    [...txt].forEach((ch, i) => {
      const s = document.createElement("span"); s.className = "d"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i); s.textContent = ch === " " ? " " : ch; a.appendChild(s);
    });
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { a.classList.add("in"); io.disconnect(); } }, { threshold: 0.8 });
    io.observe(a);
    a.addEventListener("animationend", e => { if (e.target === a.lastChild) a.classList.remove("in"); });
  });
})();
