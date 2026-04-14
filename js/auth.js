// ARCHIVO: auth.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

document.addEventListener("DOMContentLoaded", () => {
  const SESSION_USER_KEY = "clanledger_current_user_v1";

  // FUNCION: getFieldLabel - obtiene una etiqueta legible para mensajes de validacion.
  function getFieldLabel(field, fallback) {
    return (
      field?.getAttribute("aria-label") ||
      field?.getAttribute("placeholder") ||
      fallback ||
      "este campo"
    );
  }

  // FUNCION: getEmailValidationMessage - devuelve un mensaje en espanol para correos invalidos.
  function getEmailValidationMessage(field) {
    const label = getFieldLabel(field, "correo electrónico");
    const value = String(field?.value || "").trim();
    if (!value) return `Completa ${label.toLowerCase()}.`;
    if (!value.includes("@")) return "El correo electrónico debe incluir @.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Ingresa un correo electrónico válido.";
    }
    return "";
  }

  // FUNCION: getPasswordValidationMessage - devuelve un mensaje en espanol para contrasenas invalidas.
  function getPasswordValidationMessage(field) {
    const label = getFieldLabel(field, "contraseña");
    const value = String(field?.value || "").trim();
    if (!value) return `Completa ${label.toLowerCase()}.`;
    if (value.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    return "";
  }

  // FUNCION: getAuthErrorId - genera el id del mensaje asociado a un campo.
  function getAuthErrorId(field) {
    return `${field.id}-auth-err`;
  }

  // FUNCION: clearAuthFieldError - elimina el mensaje y el estado de error de un campo.
  function clearAuthFieldError(field) {
    if (!field) return;

    field.removeAttribute("aria-invalid");
    if (typeof field.setCustomValidity === "function") {
      field.setCustomValidity("");
    }

    const msgId = getAuthErrorId(field);
    const msg = document.getElementById(msgId);
    if (msg) msg.remove();

    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(" ")
      .filter((id) => id && id !== msgId);

    if (describedBy.length) {
      field.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      field.removeAttribute("aria-describedby");
    }
  }

  // FUNCION: renderAuthFieldError - pinta el mensaje debajo del campo.
  function renderAuthFieldError(field, message) {
    const msgId = getAuthErrorId(field);
    let msg = document.getElementById(msgId);
    if (!msg) {
      msg = document.createElement("span");
      msg.id = msgId;
      msg.className = "form-error-text";
      field.insertAdjacentElement("afterend", msg);
    }

    msg.textContent = message;
    field.setAttribute("aria-invalid", "true");

    const describedBy = new Set(
      (field.getAttribute("aria-describedby") || "").split(" ").filter(Boolean),
    );
    describedBy.add(msgId);
    field.setAttribute("aria-describedby", Array.from(describedBy).join(" "));
  }

  // FUNCION: updateAuthField - valida un campo y coordina el mensaje visual.
  function updateAuthField(field) {
    if (!field) return true;

    let message = "";
    if (field.type === "email") {
      message = getEmailValidationMessage(field);
    } else if (field.type === "password") {
      message = getPasswordValidationMessage(field);
    }

    if (field.type === "email" || field.type === "password") {
      if (field.type === "email") {
        const value = String(field.value || "").trim();
        if (!value)
          message = `Completa ${getFieldLabel(field, "correo electrónico").toLowerCase()}.`;
        else if (!value.includes("@"))
          message = "El correo electrónico debe incluir @.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          message = "Ingresa un correo electrónico válido.";
        }
      }

      if (field.type === "password") {
        const value = String(field.value || "").trim();
        if (!value)
          message = `Completa ${getFieldLabel(field, "contraseña").toLowerCase()}.`;
        else if (value.length < 8) {
          message = "La contraseña debe tener al menos 8 caracteres.";
        }
      }
    }

    if (typeof field.setCustomValidity === "function") {
      field.setCustomValidity(message);
    }

    if (message) {
      renderAuthFieldError(field, message);
    } else {
      clearAuthFieldError(field);
    }

    return !message;
  }

  // FUNCION: bindLiveAuthValidation - activa validacion en vivo para email y contrasena.
  function bindLiveAuthValidation(formEl) {
    if (!formEl || formEl.dataset.authLiveValidationBound === "1") return;

    const emailInput = formEl.querySelector('input[type="email"]');
    const passwordInput = formEl.querySelector('input[type="password"]');

    [emailInput, passwordInput].forEach((field) => {
      if (!field) return;

      const validateAndToggle = () => updateAuthField(field);
      validateAndToggle();
      field.addEventListener("input", validateAndToggle);
      field.addEventListener("blur", validateAndToggle);
    });

    formEl.dataset.authLiveValidationBound = "1";
  }

  // FUNCION: validateAuthForm - valida el formulario de login/registro antes de continuar.
  function validateAuthForm(formEl) {
    const fields = Array.from(
      formEl.querySelectorAll('input[type="email"], input[type="password"]'),
    );

    let firstInvalid = null;
    fields.forEach((field) => {
      const ok = updateAuthField(field);
      if (!ok && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }

    return true;
  }

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
    bindLiveAuthValidation(loginForm);
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateAuthForm(loginForm)) {
        return;
      }
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
    bindLiveAuthValidation(registroForm);
    registroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateAuthForm(registroForm)) {
        return;
      }
      persistSessionUser(registroForm);
      if (typeof window.navigateWithFade === "function") {
        window.navigateWithFade("dashboard.html");
      } else {
        window.location.href = "dashboard.html";
      }
    });
  }
});
