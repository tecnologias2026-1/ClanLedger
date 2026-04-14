// ARCHIVO: accessibility.js
// DESCRIPCION: Capa global de accesibilidad WCAG 2.1 AA para toda la aplicacion.

(function () {
  const STORAGE_KEY = "accesibilidad";
  const DEFAULT_CONFIG = {
    textSize: "normal",
    highContrast: false,
    colorBlind: false,
    readableFont: false,
    reducedMotion: false,
  };

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function applyConfig(config) {
    const body = document.body;
    if (!body) return;

    body.classList.remove("texto-pequeno", "texto-grande");
    if (config.textSize === "small") body.classList.add("texto-pequeno");
    if (config.textSize === "large") body.classList.add("texto-grande");

    body.classList.toggle("alto-contraste", Boolean(config.highContrast));
    body.classList.toggle("daltonismo", Boolean(config.colorBlind));
    body.classList.toggle("fuente-legible", Boolean(config.readableFont));
    body.classList.toggle("reducir-animaciones", Boolean(config.reducedMotion));
  }

  function ensureMainLandmark() {
    const main =
      document.querySelector("main") ||
      document.querySelector(".main") ||
      document.querySelector(".main-content") ||
      document.querySelector(".container");
    if (!main) return null;

    if (main.tagName.toLowerCase() !== "main") {
      main.setAttribute("role", "main");
    }

    if (!main.id) {
      main.id = "main-content";
    }

    return main;
  }

  function injectSkipLink(mainEl) {
    if (!mainEl) return;
    if (document.querySelector(".skip-link")) return;

    const skipLink = document.createElement("a");
    skipLink.href = `#${mainEl.id}`;
    skipLink.className = "skip-link";
    skipLink.textContent = "Saltar al contenido principal";
    document.body.prepend(skipLink);
  }

  function ensureAltAndLabels() {
    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) {
        img.setAttribute("alt", "");
      }
    });

    document.querySelectorAll("input, select, textarea").forEach((field) => {
      const hasLabel =
        (field.id && document.querySelector(`label[for=\"${field.id}\"]`)) ||
        field.closest("label") ||
        field.getAttribute("aria-label") ||
        field.getAttribute("aria-labelledby");

      if (!field.id) {
        const rnd = Math.random().toString(36).slice(2, 8);
        field.id = `fld-${rnd}`;
      }

      if (!hasLabel) {
        const placeholder =
          field.getAttribute("placeholder") || "Campo de formulario";
        field.setAttribute("aria-label", placeholder);
      }
    });
  }

  function getSpanishValidationMessage(field) {
    const label =
      field.getAttribute("aria-label") ||
      field.getAttribute("placeholder") ||
      field.id ||
      "este campo";

    if (field.validity.valueMissing) {
      return `Completa ${label.toLowerCase()}.`;
    }

    if (field.validity.typeMismatch && field.type === "email") {
      return "Ingresa un correo electrónico válido.";
    }

    if (field.validity.tooShort) {
      return `El valor de ${label.toLowerCase()} es demasiado corto.`;
    }

    if (field.validity.tooLong) {
      return `El valor de ${label.toLowerCase()} es demasiado largo.`;
    }

    if (field.validity.patternMismatch) {
      return `El formato de ${label.toLowerCase()} no es válido.`;
    }

    if (field.validity.rangeUnderflow) {
      return `El valor de ${label.toLowerCase()} es demasiado bajo.`;
    }

    if (field.validity.rangeOverflow) {
      return `El valor de ${label.toLowerCase()} es demasiado alto.`;
    }

    return `Revisa ${label.toLowerCase()}.`;
  }

  function updateFieldValidationMessage(field) {
    if (!field || typeof field.setCustomValidity !== "function") return;
    field.setCustomValidity("");
    if (field.validity.valid) {
      field.setCustomValidity("");
      return;
    }
    field.setCustomValidity(getSpanishValidationMessage(field));
  }

  function clearFieldError(field) {
    if (!field) return;
    field.removeAttribute("aria-invalid");
    const msgId = `${field.id}-err`;
    const msg = document.getElementById(msgId);
    if (msg) {
      msg.remove();
    }
    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(" ")
      .filter((id) => id && id !== msgId);
    if (describedBy.length > 0) {
      field.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      field.removeAttribute("aria-describedby");
    }
  }

  function validateForm(form) {
    if (!form) return true;

    const fields = Array.from(
      form.querySelectorAll("input, select, textarea"),
    );

    fields.forEach((field) => updateFieldValidationMessage(field));

    const firstInvalid = fields.find((field) => !field.checkValidity());
    if (firstInvalid) {
      firstInvalid.reportValidity();
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function enableKeyboardForClickableDivs() {
    const selector =
      "[onclick]:not(button):not(a):not(input):not(select):not(textarea)";
    document.querySelectorAll(selector).forEach((node) => {
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "0");
      if (!node.hasAttribute("role")) node.setAttribute("role", "button");

      if (node.dataset.a11yBound === "1") return;
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        node.click();
      });
      node.dataset.a11yBound = "1";
    });
  }

  function closeOpenUi() {
    document.querySelectorAll(".user-menu.open").forEach((menu) => {
      menu.classList.remove("open");
      const trigger = menu.querySelector(".user-menu-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });

    document.querySelectorAll(".modal.visible").forEach((modal) => {
      modal.classList.remove("visible");
      modal.setAttribute("aria-hidden", "true");
    });

    const panel = document.getElementById("a11y-panel");
    const backdrop = document.getElementById("a11y-backdrop");
    const fab = document.getElementById("a11y-fab");
    if (panel && !panel.hidden) {
      panel.hidden = true;
      if (backdrop) backdrop.hidden = true;
      if (fab) fab.setAttribute("aria-expanded", "false");
      if (fab) fab.focus();
    }
  }

  function enhanceAriaForMenus() {
    document.querySelectorAll(".sidebar").forEach((sidebar) => {
      if (!sidebar.getAttribute("aria-label")) {
        sidebar.setAttribute("aria-label", "Navegacion lateral");
      }
      if (sidebar.tagName.toLowerCase() !== "nav") {
        sidebar.setAttribute("role", "navigation");
      }
    });

    document.querySelectorAll(".nav-item.active").forEach((item) => {
      item.setAttribute("aria-current", "page");
    });

    document.querySelectorAll(".user-menu-trigger").forEach((trigger) => {
      trigger.setAttribute("aria-haspopup", "menu");
      const menu = trigger.closest(".user-menu");
      const isOpen = menu ? menu.classList.contains("open") : false;
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");

      if (trigger.dataset.a11yMenuBound === "1") return;
      trigger.addEventListener("click", () => {
        window.setTimeout(() => {
          const nextOpen = menu ? menu.classList.contains("open") : false;
          trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        }, 0);
      });
      trigger.dataset.a11yMenuBound = "1";
    });

    document.querySelectorAll(".modal").forEach((modal) => {
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      if (!modal.classList.contains("visible")) {
        modal.setAttribute("aria-hidden", "true");
      } else {
        modal.setAttribute("aria-hidden", "false");
      }
    });
  }

  function enhanceFormErrors() {
    document.querySelectorAll("form").forEach((form) => {
      if (form.id === "loginForm" || form.id === "registroForm") {
        return;
      }
      form.noValidate = true;
      if (form.dataset.a11yValidateBound === "1") return;

      form.addEventListener(
        "submit",
        (event) => {
          if (validateForm(form)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );

      form.dataset.a11yValidateBound = "1";
    });

    document.addEventListener(
      "invalid",
      (event) => {
        const field = event.target;
        const authForm = field?.closest?.("#loginForm, #registroForm");
        if (authForm) return;
        if (
          !(
            field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement
          )
        ) {
          return;
        }

        event.preventDefault();
        updateFieldValidationMessage(field);
        field.setAttribute("aria-invalid", "true");
        const msgId = `${field.id}-err`;

        let msg = document.getElementById(msgId);
        if (!msg) {
          msg = document.createElement("span");
          msg.id = msgId;
          msg.className = "form-error-text";
          field.insertAdjacentElement("afterend", msg);
        }

        msg.textContent =
          field.validationMessage || getSpanishValidationMessage(field);

        const describedBy = field.getAttribute("aria-describedby") || "";
        const ids = new Set(describedBy.split(" ").filter(Boolean));
        ids.add(msgId);
        field.setAttribute("aria-describedby", Array.from(ids).join(" "));
      },
      true,
    );

    document.addEventListener("input", (event) => {
      const field = event.target;
      const authForm = field?.closest?.("#loginForm, #registroForm");
      if (authForm) return;
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }

      updateFieldValidationMessage(field);

      if (field.checkValidity()) {
        clearFieldError(field);
      }
    });

    document.addEventListener("blur", (event) => {
      const field = event.target;
      const authForm = field?.closest?.("#loginForm, #registroForm");
      if (authForm) return;
      if (
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        return;
      }
      updateFieldValidationMessage(field);
      if (field.checkValidity()) {
        clearFieldError(field);
      }
    }, true);
  }

  function trapFocus(container, event) {
    if (event.key !== "Tab") return;

    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function createA11yPanel(config) {
    if (document.getElementById("a11y-fab")) return;

    const live = document.createElement("div");
    live.className = "a11y-live";
    live.id = "a11y-live";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");

    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "a11y-fab";
    fab.className = "a11y-fab";
    fab.setAttribute("aria-label", "Abrir configuracion de accesibilidad");
    fab.setAttribute("aria-controls", "a11y-panel");
    fab.setAttribute("aria-expanded", "false");
    fab.innerHTML = '<span aria-hidden="true">♿</span>';

    const backdrop = document.createElement("div");
    backdrop.id = "a11y-backdrop";
    backdrop.className = "a11y-panel-backdrop";
    backdrop.hidden = true;

    const panel = document.createElement("section");
    panel.id = "a11y-panel";
    panel.className = "a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "a11y-title");
    panel.hidden = true;

    panel.innerHTML = `
      <h2 id="a11y-title">Configuración de accesibilidad</h2>
      <fieldset class="a11y-option-group">
        <legend>Tamaño de texto</legend>
        <label class="a11y-option" for="a11y-text-small">
          <span>Pequeño</span>
          <input type="radio" id="a11y-text-small" name="a11y-text-size" value="small" />
        </label>
        <label class="a11y-option" for="a11y-text-normal">
          <span>Normal</span>
          <input type="radio" id="a11y-text-normal" name="a11y-text-size" value="normal" />
        </label>
        <label class="a11y-option" for="a11y-text-large">
          <span>Grande</span>
          <input type="radio" id="a11y-text-large" name="a11y-text-size" value="large" />
        </label>
      </fieldset>
      <fieldset class="a11y-option-group">
        <legend>Visual</legend>
        <label class="a11y-option" for="a11y-contrast">
          <span>Alto contraste</span>
          <input type="checkbox" id="a11y-contrast" />
        </label>
        <label class="a11y-option" for="a11y-colorblind">
          <span>Modo daltonismo</span>
          <input type="checkbox" id="a11y-colorblind" />
        </label>
        <label class="a11y-option" for="a11y-readable-font">
          <span>Fuente legible</span>
          <input type="checkbox" id="a11y-readable-font" />
        </label>
        <label class="a11y-option" for="a11y-reduced-motion">
          <span>Reducir animaciones</span>
          <input type="checkbox" id="a11y-reduced-motion" />
        </label>
      </fieldset>
      <button type="button" class="a11y-close" id="a11y-close">Cerrar</button>
    `;

    function announce(message) {
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = message;
      }, 20);
    }

    function syncUIFromConfig() {
      const textSize = panel.querySelector(
        `input[name=\"a11y-text-size\"][value=\"${config.textSize}\"]`,
      );
      if (textSize) textSize.checked = true;

      panel.querySelector("#a11y-contrast").checked = Boolean(
        config.highContrast,
      );
      panel.querySelector("#a11y-colorblind").checked = Boolean(
        config.colorBlind,
      );
      panel.querySelector("#a11y-readable-font").checked = Boolean(
        config.readableFont,
      );
      panel.querySelector("#a11y-reduced-motion").checked = Boolean(
        config.reducedMotion,
      );
    }

    function openPanel() {
      panel.hidden = false;
      backdrop.hidden = false;
      fab.setAttribute("aria-expanded", "true");
      const firstControl = panel.querySelector("input, button");
      if (firstControl) firstControl.focus();
    }

    function closePanel() {
      panel.hidden = true;
      backdrop.hidden = true;
      fab.setAttribute("aria-expanded", "false");
      fab.focus();
    }

    function updateAndPersist() {
      const selected = panel.querySelector(
        'input[name="a11y-text-size"]:checked',
      );
      config.textSize = selected ? selected.value : "normal";
      config.highContrast = panel.querySelector("#a11y-contrast").checked;
      config.colorBlind = panel.querySelector("#a11y-colorblind").checked;
      config.readableFont = panel.querySelector("#a11y-readable-font").checked;
      config.reducedMotion = panel.querySelector(
        "#a11y-reduced-motion",
      ).checked;

      applyConfig(config);
      saveConfig(config);
      announce("Configuracion de accesibilidad actualizada");
    }

    fab.addEventListener("click", () => {
      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
    });

    backdrop.addEventListener("click", closePanel);
    panel.querySelector("#a11y-close").addEventListener("click", closePanel);
    panel.addEventListener("change", updateAndPersist);

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      trapFocus(panel, event);
    });

    syncUIFromConfig();

    document.body.appendChild(live);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.body.appendChild(fab);
  }

  function init() {
    const config = loadConfig();
    applyConfig(config);

    const mainEl = ensureMainLandmark();
    injectSkipLink(mainEl);

    ensureAltAndLabels();
    enhanceAriaForMenus();
    enableKeyboardForClickableDivs();
    enhanceFormErrors();
    createA11yPanel(config);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeOpenUi();
      }
    });
  }

  window.ClanLedgerA11y = {
    validateForm,
    getSpanishValidationMessage,
    updateFieldValidationMessage,
    clearFieldError,
  };

  document.addEventListener("DOMContentLoaded", init);
})();
