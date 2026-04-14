// ARCHIVO: auth.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

document.addEventListener("DOMContentLoaded", () => {
  const SESSION_USER_KEY = "clanledger_current_user_v1";

  // FUNCION: getLoginNameFromEmail - explica su proposito, entradas y salida.
  function getLoginNameFromEmail(formEl) {
    const emailInput = formEl
      ? formEl.querySelector('input[type="email"]')
      : null;
    const rawEmail = String(emailInput?.value || "").trim();
    if (!rawEmail) return "Usuario";

    const localPart = rawEmail.split("@")[0] || "Usuario";
    const cleaned = localPart.replace(/[._-]+/g, " ").trim();
    if (!cleaned) return "Usuario";

    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // FUNCION: persistSessionUser - explica su proposito, entradas y salida.
  function persistSessionUser(formEl) {
    const emailInput = formEl
      ? formEl.querySelector('input[type="email"]')
      : null;
    const email = String(emailInput?.value || "").trim();
    const name = getLoginNameFromEmail(formEl);

    const payload = {
      name,
      email,
      sessionId: (email || name || "guest").toLowerCase(),
      loginAt: Date.now(),
    };

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(payload));
  }

  //  LOGIN ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      persistSessionUser(loginForm);
      if (typeof window.navigateWithFade === "function") {
        window.navigateWithFade("dashboard.html");
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }

  //  REGISTRO ---
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    registroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      persistSessionUser(registroForm);
      if (typeof window.navigateWithFade === "function") {
        window.navigateWithFade("dashboard.html");
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }
});

