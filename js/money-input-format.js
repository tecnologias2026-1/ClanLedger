(function () {
  function parseValue(raw) {
    const text = String(raw == null ? "" : raw).trim();
    if (!text) return 0;

    const isNegative = text.startsWith("-");
    const digits = text.replace(/[^\d]/g, "");
    if (!digits) return 0;

    const numeric = Number(digits);
    if (!Number.isFinite(numeric)) return 0;
    return isNegative ? -numeric : numeric;
  }

  function formatInputValue(raw) {
    const value = parseValue(raw);
    const abs = Math.abs(value).toLocaleString("es-CO");
    return value < 0 ? `-${abs}` : abs;
  }

  function attach(inputEl) {
    if (!inputEl) return;

    if (inputEl.getAttribute("type") === "number") {
      inputEl.setAttribute("type", "text");
    }
    inputEl.setAttribute("inputmode", "numeric");

    const reformat = function () {
      const value = String(inputEl.value || "").trim();
      if (!value || value === "-") return;
      inputEl.value = formatInputValue(value);
    };

    inputEl.addEventListener("input", reformat);
    inputEl.addEventListener("blur", reformat);

    if (String(inputEl.value || "").trim()) {
      reformat();
    }
  }

  function attachByIds(ids) {
    if (!Array.isArray(ids)) return;
    ids.forEach((id) => attach(document.getElementById(id)));
  }

  window.ClanLedgerMoneyInput = {
    parseValue,
    formatInputValue,
    attach,
    attachByIds,
  };
})();
