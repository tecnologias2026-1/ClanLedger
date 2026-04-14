// ARCHIVO: mobile-nav.js
// DESCRIPCION: Inyecta y controla el drawer lateral movil en las paginas con sidebar.

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const layout = document.querySelector(".layout");
  const main = document.querySelector(".main-content, .main, .container");
  if (!sidebar || !layout || !main) return;

  // Siempre iniciar con drawer cerrado al entrar a cualquier vista.
  document.body.classList.remove("mobile-nav-open");

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "mobile-nav-toggle";
  toggleButton.setAttribute("aria-label", "Abrir menu de navegacion");
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.innerHTML = "<span></span><span></span><span></span>";

  if (!sidebar.id) {
    sidebar.id = "main-sidebar";
  }
  toggleButton.setAttribute("aria-controls", sidebar.id);
  sidebar.setAttribute("aria-hidden", "true");

  const sidebarLogo = sidebar.querySelector(".sidebar-logo img");
  const logoSrc = sidebarLogo ? sidebarLogo.getAttribute("src") : "";

  const mobileBrand = document.createElement("div");
  mobileBrand.className = "mobile-page-brand";
  mobileBrand.innerHTML = `
    <div class="mobile-page-brand-left">
      <img src="${logoSrc}" alt="ClanLedger" />
    </div>
  `;
  mobileBrand.appendChild(toggleButton);

  const overlay = document.createElement("div");
  overlay.className = "mobile-nav-overlay";
  overlay.setAttribute("aria-hidden", "true");

  main.prepend(mobileBrand);
  document.body.appendChild(overlay);

  function closeDrawer() {
    document.body.classList.remove("mobile-nav-open");
    toggleButton.setAttribute("aria-expanded", "false");
    sidebar.setAttribute("aria-hidden", "true");
  }

  function openDrawer() {
    document.body.classList.add("mobile-nav-open");
    toggleButton.setAttribute("aria-expanded", "true");
    sidebar.setAttribute("aria-hidden", "false");
  }

  function toggleDrawer() {
    if (document.body.classList.contains("mobile-nav-open")) {
      closeDrawer();
      return;
    }
    openDrawer();
  }

  toggleButton.addEventListener("click", toggleDrawer);
  overlay.addEventListener("click", closeDrawer);

  // Cerrar inmediatamente al seleccionar una ruta en mobile.
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      // Detectar si el click es de navegación (dentro del sidebar o en cualquier link de navegación)
      if (window.innerWidth <= 900) {
        closeDrawer();
      }
    },
    true,
  );

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        closeDrawer();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });

  // Si se cambia de ruta o se restaura desde cache, asegurar estado cerrado.
  window.addEventListener("pagehide", closeDrawer);
  window.addEventListener("pageshow", closeDrawer);

  // Interceptar navigateWithFade para cerrar drawer antes de navegar
  if (window.navigateWithFade) {
    const originalNavigate = window.navigateWithFade;
    window.navigateWithFade = function (url) {
      if (window.innerWidth <= 900) {
        closeDrawer();
      }
      // Pequeño delay para asegurar que el drawer se cierre antes de la animación
      setTimeout(() => {
        originalNavigate(url);
      }, 10);
    };
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeDrawer();
  });
});
