/* HABYTEC — site provisoire : apparitions au défilement, maison animée, effets au survol.
   Aucun cookie, aucun suivi, rien n'est envoyé. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const spots = document.querySelectorAll(".spot");
  const name = document.getElementById("zoneName");
  const text = document.getElementById("zoneText");
  let current = 0, timer = null;
  const show = index => {
    current = index;
    spots.forEach(spot => spot.classList.toggle("on", Number(spot.dataset.zone) === index));
    if (name) name.textContent = zones[index][0];
    if (text) text.textContent = zones[index][1];
  };
  const start = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show((current + 1) % zones.length), 3600); };
  spots.forEach(spot => spot.addEventListener("click", () => { show(Number(spot.dataset.zone)); start(); }));
  start();

  /* Écran de la maison : légère inclinaison 3D qui suit la souris */
  const stage = document.getElementById("stage");
  if (stage && !reduce && window.matchMedia("(hover: hover)").matches) {
    stage.addEventListener("mousemove", event => {
      const box = stage.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5, y = (event.clientY - box.top) / box.height - 0.5;
      stage.style.transform = `perspective(1100px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    stage.addEventListener("mouseleave", () => { stage.style.transform = ""; });
  }

  /* Cartes : halo lumineux qui suit la souris */
  document.querySelectorAll(".card").forEach(card => card.addEventListener("mousemove", event => {
    const box = card.getBoundingClientRect();
    card.style.setProperty("--x", (event.clientX - box.left) + "px");
    card.style.setProperty("--y", (event.clientY - box.top) + "px");
  }));
})();
