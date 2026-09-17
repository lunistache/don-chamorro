(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  const waFloat = document.querySelector(".wa-float");

  // Mobile menu
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    links.classList.toggle("open", !open);
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("open");
    }
  });

  // Nav shadow + floating WhatsApp button after the hero
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    waFloat.classList.toggle("show", y > window.innerHeight * 0.7);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  const targets = document.querySelectorAll(
    ".section-head, .about-grid, .pillar, .menu-card, .visit-grid"
  );
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
