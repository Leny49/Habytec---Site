/* HABYTEC — site provisoire : apparitions au défilement, maison animée, effets au survol.
   Aucun cookie, aucun suivi, rien n'est envoyé. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Apparition des blocs au défilement */
  const blocks = document.querySelectorAll(".reveal:not(.in)");
  if ("IntersectionObserver" in window && !reduce) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    blocks.forEach(block => observer.observe(block));
  } else blocks.forEach(block => block.classList.add("in"));

  /* Maison : les zones s'allument l'une après l'autre ; un clic choisit une zone */
  const zones = [
    ["Éclairage", "Des ambiances lumineuses adaptées à chaque moment de la journée."],
    ["Volets", "Des ouvertures qui s’adaptent au soleil, à l’heure et à vos habitudes."],
    ["Confort", "Un confort thermique équilibré dans chaque espace de vie."],
    ["Énergie", "Visualisez votre consommation pour faire les bons choix, au bon moment."]
  ];
  const stage = document.getElementById("stage");
  const spots = document.querySelectorAll(".spot");
  const name = document.getElementById("zoneName");
  const text = document.getElementById("zoneText");
  let current = 0, timer = null;
  const show = index => {
    current = index;
    spots.forEach(spot => spot.classList.toggle("on", Number(spot.dataset.zone) === index));
    if (stage) stage.dataset.zone = String(index); /* la maison réagit : lumière, volets, chaleur, énergie */
    if (name) name.textContent = zones[index][0];
    if (text) text.textContent = zones[index][1];
  };
  const start = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show((current + 1) % zones.length), 3600); };
  spots.forEach(spot => spot.addEventListener("click", () => { show(Number(spot.dataset.zone)); start(); }));
  if (stage) setTimeout(() => show(current), 2600); /* après le dessin de la maison */
  start();

  /* Écran de la maison : légère inclinaison 3D qui suit la souris */
  if (stage && !reduce && hover) {
    stage.addEventListener("mousemove", event => {
      const box = stage.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5, y = (event.clientY - box.top) / box.height - 0.5;
      stage.style.transform = `perspective(1100px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    stage.addEventListener("mouseleave", () => { stage.style.transform = ""; });
  }

  /* Cartes : halo qui suit la souris et inclinaison 3D */
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mousemove", event => {
      const box = card.getBoundingClientRect();
      const x = event.clientX - box.left, y = event.clientY - box.top;
      card.style.setProperty("--x", x + "px");
      card.style.setProperty("--y", y + "px");
      if (!reduce && hover) card.style.transform = `perspective(900px) rotateY(${(x / box.width - 0.5) * 8}deg) rotateX(${-(y / box.height - 0.5) * 8}deg) translateY(-6px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });

  /* Barre de progression, en-tête au défilement */
  const bar = document.querySelector(".progress");
  const top = document.querySelector(".top");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    if (top) top.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Halo lumineux qui suit la souris (ordinateur seulement) */
  const glow = document.querySelector(".cursor-glow");
  const hero = document.querySelector(".hero");
  if (glow && hover && !reduce) {
    window.addEventListener("mousemove", event => {
      glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      glow.classList.add("on");
      if (hero) {
        const box = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (event.clientX - box.left) + "px");
        hero.style.setProperty("--my", (event.clientY - box.top) + "px");
      }
    }, { passive: true });
    document.addEventListener("mouseleave", () => glow.classList.remove("on"));
  }

  /* Circuit lumineux qui relie les 3 étapes (sur grand écran) */
  const line = document.querySelector(".steps-line");
  if (line) {
    const steps = line.parentElement;
    const path = line.querySelector("path");
    const draw = () => {
      const nums = steps.querySelectorAll(".num");
      if (nums.length < 2) return;
      const origin = steps.getBoundingClientRect();
      const points = [...nums].map(num => { const box = num.getBoundingClientRect(); return { left: box.left - origin.left, right: box.right - origin.left, y: box.top - origin.top + box.height / 2 }; });
      if (Math.abs(points[0].y - points[1].y) > 4) { path.setAttribute("d", ""); return; } /* cartes empilées : pas de circuit */
      let d = "";
      for (let i = 0; i < points.length - 1; i++) d += `M${points[i].right + 6} ${points[i].y} H${points[i + 1].left - 6} `;
      path.setAttribute("d", d.trim());
    };
    draw();
    window.addEventListener("resize", draw);
    window.addEventListener("load", draw);
    if ("IntersectionObserver" in window && !reduce) {
      const lineObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { setTimeout(draw, 900); line.classList.add("on"); lineObserver.disconnect(); }
      }), { threshold: 0.35 });
      lineObserver.observe(steps);
    } else line.classList.add("on");
  }

  /* Réseau de points lumineux derrière l'en-tête : la maison connectée */
  const canvas = document.querySelector(".net");
  if (canvas && hero && !reduce && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0, points = [], mouse = null, running = false, frame = 0;
    const resize = () => {
      /* sur téléphone, la barre d'adresse change la hauteur au défilement : on ne recrée pas les points pour si peu */
      if (points.length && hero.clientWidth === width && Math.abs(hero.clientHeight - height) < 140) return;
      width = hero.clientWidth; height = hero.clientHeight;
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.min(70, Math.max(26, width * height / 22000)));
      points = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.6 + 0.6 }));
    };
    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const reach = 130;
      for (const point of points) {
        point.x += point.vx; point.y += point.vy;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < reach) { ctx.strokeStyle = `rgba(88,206,255,${(1 - dist / reach) * 0.16})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        if (mouse) {
          const dist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (dist < 180) { ctx.strokeStyle = `rgba(81,225,193,${(1 - dist / 180) * 0.35})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        }
        ctx.fillStyle = "rgba(127,216,255,.55)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    const play = on => {
      if (on && !running) { running = true; frame = requestAnimationFrame(tick); }
      if (!on && running) { running = false; cancelAnimationFrame(frame); }
    };
    resize();
    window.addEventListener("resize", resize);
    hero.addEventListener("mousemove", event => { const box = hero.getBoundingClientRect(); mouse = { x: event.clientX - box.left, y: event.clientY - box.top }; });
    hero.addEventListener("mouseleave", () => { mouse = null; });
    /* Pause quand l'en-tête n'est plus visible ou que l'onglet est caché */
    let visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; play(visible && !document.hidden); }).observe(hero);
    document.addEventListener("visibilitychange", () => play(visible && !document.hidden));
    play(true);
  }
})();
