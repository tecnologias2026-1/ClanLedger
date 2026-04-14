/* =============================================
   TOGGLE: PERSONA / FAMILIAR
   ============================================= */
let currentView = "person";

function switchView(view) {
  if (view === currentView) return;
  currentView = view;

  const circle = document.getElementById("toggle-circle");
  const iconPerson = document.getElementById("icon-person");
  const iconFamily = document.getElementById("icon-family");

  if (view === "family") {
    circle.classList.add("active-family");
    iconPerson.src = "../assets/imagenes/person_1.png"; // dark icon (no circle bg)
    iconFamily.src = "../assets/imagenes/family_group_2.png"; // light icon (on dark circle)
  } else {
    circle.classList.remove("active-family");
    iconPerson.src = "../assets/imagenes/person_2.png"; // light icon (on dark circle)
    iconFamily.src = "../assets/imagenes/family_group_1.png"; // dark icon (no circle bg)
  }
}

/* =============================================
   MODALS
   ============================================= */
let pendingCatSelectId = null;
let pendingCatDropId = null;
let pendingCreateType = "category";
const monthlyBudgetByMonth = {};
let budgetSourceMode = "accounts";
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
let selectedObjectiveMonth = MONTHS[new Date().getMonth()];
const currentYear = String(new Date().getFullYear());
let selectedObjectiveYear = currentYear;

function getStore() {
  return window.ClanLedgerStore || null;
}

function collectObjectivesFromDom() {
  return Array.from(
    document.querySelectorAll("#objetivos-grid .budget-item"),
  ).map((item, index) => ({
    id: item.dataset.id || `obj-${index + 1}`,
    name: item.dataset.name || "Objetivo",
    area: item.dataset.area || "General",
    total: parseFloat(item.dataset.total) || 0,
    year: item.dataset.year || currentYear,
    savings: getObjectiveSavings(item),
  }));
}

function getDropdownDataValues(dropId) {
  const dropdown = document.getElementById(dropId);
  if (!dropdown) return [];
  return Array.from(dropdown.querySelectorAll(".select-option"))
    .filter((opt) => !opt.classList.contains("new-cat-opt"))
    .map((opt) => {
      const span = opt.querySelector("span");
      return span ? span.textContent.trim() : "";
    })
    .filter(Boolean);
}

function getObjectiveAreasFromState(state) {
  const budgetAreas = Array.isArray(state?.budgets?.objectiveAreas)
    ? state.budgets.objectiveAreas
    : [];
  const objectiveAreas = (state?.budgets?.objectives || [])
    .map((obj) => String(obj.area || "").trim())
    .filter(Boolean);
  const merged = [...budgetAreas, ...objectiveAreas];
  return Array.from(new Set(merged));
}

function collectCategoriesFromDom() {
  return Array.from(
    document.querySelectorAll("#categorias-grid .budget-item"),
  ).map((item, index) => ({
    id: item.dataset.id || `cat-${index + 1}`,
    name: item.dataset.name || "Categoria",
    current: parseFloat(item.dataset.current) || 0,
    total: parseFloat(item.dataset.total) || 0,
    period: item.dataset.period || "Mensual",
  }));
}

function renderBudgetDataFromStore() {
  const store = getStore();
  if (!store) return;
  const state = store.getState();
  const budgets = state.budgets || {};
  const objectives = budgets.objectives || [];
  const categories = budgets.categories || [];
  budgetSourceMode =
    budgets.budgetSourceMode === "manual" ? "manual" : "accounts";

  Object.assign(monthlyBudgetByMonth, budgets.monthlyBudgetByMonth || {});

  const objectivesGrid = document.getElementById("objetivos-grid");
  if (objectivesGrid) {
    objectivesGrid.innerHTML = "";
    objectives.forEach((obj) => {
      const current = sumObjectiveSavings(obj.savings || {});
      const el = buildItemEl(
        obj.name,
        current,
        obj.total,
        "",
        obj.year || currentYear,
        obj.area || "General",
      );
      el.dataset.id = obj.id || "";
      setObjectiveSavings(el, obj.savings || {});
      el.dataset.current = current;
      objectivesGrid.appendChild(el);
    });
  }

  const categoriesGrid = document.getElementById("categorias-grid");
  if (categoriesGrid) {
    categoriesGrid.innerHTML = "";
    categories.forEach((cat) => {
      const el = buildItemEl(
        cat.name,
        cat.current,
        cat.total,
        cat.period || "Mensual",
        "",
      );
      el.dataset.id = cat.id || "";
      categoriesGrid.appendChild(el);
    });
  }
}

function getAccountsBudgetTotal() {
  const store = getStore();
  if (!store) return 0;
  const state = store.getState();
  return (state.accounts || []).reduce(
    (acc, account) => acc + (Number(account.balance) || 0),
    0,
  );
}

function selectBudgetSource(mode, optionEl) {
  const safeMode = mode === "accounts" ? "accounts" : "manual";
  const label =
    safeMode === "accounts" ? "Usar balance de cuentas" : "Ingresar valor";
  selectOption("sel-budget-source", label, optionEl);
  onBudgetSourceChange(safeMode);
}

function onBudgetSourceChange(mode) {
  budgetSourceMode = mode === "accounts" ? "accounts" : "manual";
  updateBudgetSourceControls();
  updateSummaryCards();
}

function updateBudgetSourceControls() {
  const controls = document.querySelector(".budget-setup-controls");
  const budgetInput = document.getElementById("budget-total-input");
  const saveBtn = document.getElementById("budget-save-btn");
  const hint = document.getElementById("budget-source-hint");
  const usingAccounts = budgetSourceMode === "accounts";

  if (controls) controls.classList.toggle("readonly", usingAccounts);
  if (budgetInput) budgetInput.disabled = usingAccounts;
  if (saveBtn) saveBtn.disabled = usingAccounts;
  if (hint) {
    hint.textContent = usingAccounts
      ? "Se utiliza automáticamente la suma del balance de todas las cuentas en Ajustes."
      : "Define manualmente el presupuesto final del mes.";
  }
}

function persistBudgetDataToStore() {
  const store = getStore();
  if (!store) return;
  const objectives = collectObjectivesFromDom();
  const categories = collectCategoriesFromDom();
  const objectiveAreas = getDropdownDataValues("drop-obj-area");

  store.setState((s) => {
    s.budgets.monthlyBudgetByMonth = { ...monthlyBudgetByMonth };
    s.budgets.objectives = objectives;
    s.budgets.categories = categories;
    s.budgets.objectiveAreas = objectiveAreas;
    s.budgets.budgetSourceMode = budgetSourceMode;
    return s;
  });
}

function openModal(id) {
  document.getElementById("modal-overlay").classList.add("active");
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  // Hide overlay only if no other modal is open
  const anyOpen = document.querySelector(".modal.active");
  if (!anyOpen) {
    document.getElementById("modal-overlay").classList.remove("active");
  }
}

function closeAllModals() {
  document
    .querySelectorAll(".modal.active")
    .forEach((m) => m.classList.remove("active"));
  document.getElementById("modal-overlay").classList.remove("active");
}

/* =============================================
   CUSTOM SELECT / DROPDOWN
   ============================================= */
function toggleDropdown(dropId, selectId) {
  const dropdown = document.getElementById(dropId);
  const select = document.getElementById(selectId);
  const header = select.querySelector(".select-header");
  const arrow = header.querySelector(".select-arrow");
  const isOpen = dropdown.classList.contains("open");

  // Close all other open dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    dropdown.classList.add("open");
    header.classList.add("open");
    arrow.classList.add("rotated");
  }
}

function closeAllDropdowns() {
  document
    .querySelectorAll(".select-dropdown.open")
    .forEach((d) => d.classList.remove("open"));
  document
    .querySelectorAll(".select-header.open")
    .forEach((h) => h.classList.remove("open"));
  document
    .querySelectorAll(".select-arrow.rotated")
    .forEach((a) => a.classList.remove("rotated"));
}

function selectOption(selectId, value, optionEl) {
  const select = document.getElementById(selectId);
  const display = select.querySelector(".select-display");
  const dropdown = select.querySelector(".select-dropdown");

  // Update displayed text
  display.textContent = value;

  // Remove selected state + check icon from all options
  select.querySelectorAll(".select-option").forEach((opt) => {
    opt.classList.remove("selected");
    const chk = opt.querySelector(".check-icon");
    if (chk) chk.remove();
  });

  // Mark clicked option as selected
  optionEl.classList.add("selected");
  const chkImg = document.createElement("img");
  chkImg.src = "../assets/imagenes/Done.png";
  chkImg.alt = "✓";
  chkImg.className = "check-icon";
  optionEl.appendChild(chkImg);

  // Close dropdown
  closeAllDropdowns();
}

function ensureCategoryOption(dropId, name) {
  const dropdown = document.getElementById(dropId);
  if (!dropdown) return;
  const clean = String(name || "").trim();
  if (!clean) return;

  const exists = Array.from(
    dropdown.querySelectorAll(".select-option span"),
  ).some(
    (span) => span.textContent.trim().toLowerCase() === clean.toLowerCase(),
  );
  if (exists) return;

  const newCatBtn = dropdown.querySelector(".new-cat-opt");
  const option = document.createElement("div");
  option.className = "select-option";
  option.innerHTML = `<span>${escapeHtml(clean)}</span>`;

  if (dropId === "drop-pres-cat") {
    option.onclick = function () {
      selectOption("sel-pres-cat", clean, this);
    };
  } else if (dropId === "drop-obj-area") {
    option.onclick = function () {
      selectOption("sel-obj-area", clean, this);
    };
  } else if (dropId === "drop-edit-obj-area") {
    option.onclick = function () {
      selectOption("sel-edit-obj-area", clean, this);
    };
  }

  dropdown.insertBefore(option, newCatBtn || null);
}

function syncCategoryDropdownsFromStore() {
  const dropdown = document.getElementById("drop-pres-cat");
  if (!dropdown) return;

  const store = getStore();
  if (!store) return;
  const state = store.getState();
  const names = (state.budgets.categories || [])
    .map((c) => c.name)
    .filter(Boolean);

  dropdown.innerHTML = "";
  names.forEach((name) => ensureCategoryOption("drop-pres-cat", name));

  const action = document.createElement("div");
  action.className = "select-option new-cat-opt";
  action.onclick = function () {
    createNewCategory("sel-pres-cat", "drop-pres-cat");
  };
  action.innerHTML = `
    <img src="../assets/imagenes/add blue.png" alt="+" class="new-cat-icon" />
    Crear nueva categoría
  `;
  dropdown.appendChild(action);
}

function syncObjectiveAreaDropdownsFromStore() {
  const store = getStore();
  if (!store) return;
  const state = store.getState();
  const areas = getObjectiveAreasFromState(state);

  const objectiveDrop = document.getElementById("drop-obj-area");
  const editDrop = document.getElementById("drop-edit-obj-area");

  if (objectiveDrop) {
    objectiveDrop.innerHTML = "";
    areas.forEach((area) => ensureCategoryOption("drop-obj-area", area));

    const action = document.createElement("div");
    action.className = "select-option new-cat-opt";
    action.onclick = function () {
      createNewCategory("sel-obj-area", "drop-obj-area");
    };
    action.innerHTML = `
      <img src="../assets/imagenes/add blue.png" alt="+" class="new-cat-icon" />
      Crear nueva área
    `;
    objectiveDrop.appendChild(action);
  }

  if (editDrop) {
    editDrop.innerHTML = "";
    areas.forEach((area) => ensureCategoryOption("drop-edit-obj-area", area));
  }
}

/* =============================================
   CREATE NEW CATEGORY (inline modal)
   ============================================= */
function createNewCategory(selectId, dropId) {
  pendingCatSelectId = selectId;
  pendingCatDropId = dropId;
  pendingCreateType = dropId === "drop-pres-cat" ? "category" : "area";

  const title = document.getElementById("new-item-modal-title");
  const subtitle = document.getElementById("new-item-modal-subtitle");
  const label = document.getElementById("new-item-modal-label");
  const btn = document.getElementById("new-item-modal-btn");
  const isArea = pendingCreateType === "area";

  if (title) title.textContent = isArea ? "Nueva Área" : "Nueva Categoría";
  if (subtitle) {
    subtitle.textContent = isArea
      ? "Escribe el nombre de la nueva área"
      : "Escribe el nombre de la nueva categoría";
  }
  if (label) {
    label.textContent = isArea ? "Nombre del Área" : "Nombre de la Categoría";
  }
  if (btn) btn.textContent = isArea ? "Crear Área" : "Crear Categoría";

  // Open the new-category sub-modal (overlay stays active)
  document.getElementById("modal-nueva-cat").classList.add("active");
  document.getElementById("new-cat-input").value = "";
  setTimeout(() => document.getElementById("new-cat-input").focus(), 80);
}

function cancelNewCategory() {
  document.getElementById("modal-nueva-cat").classList.remove("active");
  pendingCatSelectId = null;
  pendingCatDropId = null;
  pendingCreateType = "category";
}

function confirmNewCategory() {
  const input = document.getElementById("new-cat-input");
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }

  if (pendingCatSelectId && pendingCatDropId) {
    const dropdown = document.getElementById(pendingCatDropId);
    const newCatBtn = dropdown.querySelector(".new-cat-opt");

    // Build new option element
    const newOpt = document.createElement("div");
    newOpt.className = "select-option";
    const span = document.createElement("span");
    span.textContent = name;
    newOpt.appendChild(span);

    const sid = pendingCatSelectId;
    newOpt.onclick = function () {
      selectOption(sid, name, this);
    };

    dropdown.insertBefore(newOpt, newCatBtn);

    // Auto-select the new category
    selectOption(pendingCatSelectId, name, newOpt);

    const store = getStore();
    if (store && pendingCreateType === "category") {
      if (typeof store.addCategoryIfMissing === "function") {
        store.addCategoryIfMissing(name);
      }
    } else if (store && pendingCreateType === "area") {
      store.setState((s) => {
        if (!Array.isArray(s.budgets.objectiveAreas)) {
          s.budgets.objectiveAreas = [];
        }
        const exists = s.budgets.objectiveAreas.some(
          (area) =>
            String(area || "")
              .trim()
              .toLowerCase() ===
            String(name || "")
              .trim()
              .toLowerCase(),
        );
        if (!exists) {
          s.budgets.objectiveAreas.push(name);
        }
        return s;
      });
      ensureCategoryOption("drop-edit-obj-area", name);
    }
  }

  document.getElementById("modal-nueva-cat").classList.remove("active");
  pendingCatSelectId = null;
  pendingCatDropId = null;
  pendingCreateType = "category";
}

/* Enter key on new category input */
function renderPresupuestosPage() {
  if (!window.__clanledgerPresupuestosBound) {
    const newCatInput = document.getElementById("new-cat-input");
    if (newCatInput) {
      newCatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") confirmNewCategory();
        if (e.key === "Escape") cancelNewCategory();
      });
    }

    const budgetInput = document.getElementById("budget-total-input");
    if (budgetInput) {
      budgetInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") saveBudgetTotal();
      });
    }

    if (window.ClanLedgerMoneyInput) {
      window.ClanLedgerMoneyInput.attachByIds([
        "budget-total-input",
        "obj-meta",
        "pres-limite",
        "edit-current",
        "edit-total",
      ]);
    }

    window.__clanledgerPresupuestosBound = true;
  }

  renderBudgetDataFromStore();
  syncCategoryDropdownsFromStore();
  syncObjectiveAreaDropdownsFromStore();
  initializeObjectiveMonthState();
  preselectDropdown(
    "sel-budget-source",
    budgetSourceMode === "manual"
      ? "Ingresar valor"
      : "Usar balance de cuentas",
  );
  updateBudgetSourceControls();
  refreshAllProgress();
  persistBudgetDataToStore();
}

document.addEventListener("DOMContentLoaded", renderPresupuestosPage);
window.addEventListener("clanledger:mode-change", () => {
  const store = window.ClanLedgerStore;
  if (store && typeof store.reloadForCurrentMode === "function") {
    store.reloadForCurrentMode();
  }
  renderPresupuestosPage();
});

window.addEventListener("focus", function () {
  if (budgetSourceMode === "accounts") {
    updateSummaryCards();
  }
});

/* =============================================
   CLOSE DROPDOWNS ON OUTSIDE CLICK
   ============================================= */
document.addEventListener("click", function (e) {
  if (!e.target.closest(".custom-select")) {
    closeAllDropdowns();
  }
});

/* Close modals with Escape key */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const newCatModal = document.getElementById("modal-nueva-cat");
    if (newCatModal.classList.contains("active")) {
      cancelNewCategory();
    } else {
      closeAllModals();
    }
  }
});

/* =============================================
   EDIT BUDGET ITEM
   ============================================= */
let currentEditItem = null;

function calcProgress(current, total) {
  const safeCurrent = Math.max(0, Number(current) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const pct =
    safeTotal > 0 ? Math.round((safeCurrent / safeTotal) * 1000) / 10 : 0;
  return {
    current: safeCurrent,
    total: safeTotal,
    pct,
    pctInt: Math.round(pct),
    barPct: Math.min(pct, 100),
    isExceeded: safeTotal > 0 && safeCurrent > safeTotal,
  };
}

function getObjectiveSavings(itemEl) {
  try {
    return JSON.parse(itemEl.dataset.savings || "{}");
  } catch {
    return {};
  }
}

function setObjectiveSavings(itemEl, savings) {
  itemEl.dataset.savings = JSON.stringify(savings);
}

function sumObjectiveSavings(savings) {
  return Object.values(savings).reduce((acc, v) => acc + (Number(v) || 0), 0);
}

function normalizeObjectiveData(itemEl) {
  if (!itemEl.dataset.year) {
    itemEl.dataset.year = currentYear;
  }

  const savings = getObjectiveSavings(itemEl);
  const hasSavings = Object.keys(savings).length > 0;
  if (!hasSavings) {
    const legacyCurrent = parseFloat(itemEl.dataset.current) || 0;
    savings[selectedObjectiveMonth] = legacyCurrent;
    setObjectiveSavings(itemEl, savings);
  }

  itemEl.dataset.current = sumObjectiveSavings(getObjectiveSavings(itemEl));
}

function refreshItemProgress(itemEl) {
  if (!itemEl) return;

  const isObjective = !!itemEl.closest("#objetivos-grid");
  if (isObjective) {
    normalizeObjectiveData(itemEl);
  }

  const baseCurrent = isObjective
    ? sumObjectiveSavings(getObjectiveSavings(itemEl))
    : itemEl.dataset.current;

  const { current, total, pctInt, barPct, isExceeded } = calcProgress(
    baseCurrent,
    itemEl.dataset.total,
  );

  const percentEl = itemEl.querySelector(".item-percent");
  if (percentEl) percentEl.textContent = pctInt + "%";

  const fill = itemEl.querySelector(".progress-fill");
  if (fill) {
    fill.style.width = barPct + "%";
    fill.classList.toggle("exceeded", isExceeded);
  }

  const amounts = itemEl.querySelectorAll(".item-amounts span");
  if (amounts.length >= 2) {
    amounts[0].textContent = "$" + formatCOP(Math.round(current));
    amounts[1].textContent = "$" + formatCOP(Math.round(total));
  }

  itemEl.classList.toggle("exceeded", isExceeded);
}

function refreshAllProgress() {
  document
    .querySelectorAll(
      "#objetivos-grid .budget-item, #categorias-grid .budget-item",
    )
    .forEach((item) => refreshItemProgress(item));

  applyObjectiveMonthFilter();
  updateSummaryCards();
}

function initializeObjectiveMonthState() {
  preselectDropdown("sel-objetivo-mes-filtro", selectedObjectiveYear);

  document.querySelectorAll("#objetivos-grid .budget-item").forEach((item) => {
    normalizeObjectiveData(item);
    upsertItemBadge(item, `Anual ${item.dataset.year || currentYear}`);
  });

  preselectDropdown("sel-obj-year", currentYear);
  syncBudgetInputWithSelectedMonth();
}

function selectYearFilter(year, optionEl) {
  selectOption("sel-objetivo-mes-filtro", year, optionEl);
  onYearFilterChange(year);
}

function onYearFilterChange(year) {
  selectedObjectiveYear = year || currentYear;

  syncBudgetInputWithSelectedMonth();
  applyObjectiveMonthFilter();
  updateSummaryCards();
}

function applyObjectiveMonthFilter() {
  document.querySelectorAll("#objetivos-grid .budget-item").forEach((item) => {
    const itemYear = item.dataset.year || currentYear;
    item.style.display = itemYear === selectedObjectiveYear ? "" : "none";
  });
}

function sumObjectiveMonthlyContributions(month) {
  return Array.from(
    document.querySelectorAll("#objetivos-grid .budget-item"),
  ).reduce((acc, item) => {
    const itemYear = item.dataset.year || currentYear;
    if (itemYear !== selectedObjectiveYear) return acc;
    const savings = getObjectiveSavings(item);
    return acc + (parseFloat(savings[month]) || 0);
  }, 0);
}

function sumBy(selector, field, filterFn) {
  return Array.from(document.querySelectorAll(selector)).reduce((acc, item) => {
    if (filterFn && !filterFn(item)) return acc;
    return acc + (parseFloat(item.dataset[field]) || 0);
  }, 0);
}

function updateSummaryCards() {
  const objetivosSelector = "#objetivos-grid .budget-item";
  const categoriasSelector = "#categorias-grid .budget-item";

  const totalObjetivosMes = sumObjectiveMonthlyContributions(
    selectedObjectiveMonth,
  );
  const totalGastosObjetivosMes = sumObjectiveMonthlyContributions(
    selectedObjectiveMonth,
  );
  const totalCategorias = sumBy(categoriasSelector, "total");
  const totalGastos =
    sumBy(categoriasSelector, "current") + totalGastosObjetivosMes;

  const categorias = Array.from(document.querySelectorAll(categoriasSelector));
  const excedidos = categorias.filter((item) => {
    const current = parseFloat(item.dataset.current) || 0;
    const total = parseFloat(item.dataset.total) || 0;
    return total > 0 && current > total;
  }).length;

  const presupuestoAsignado = totalObjetivosMes + totalCategorias;
  const presupuestoTotal =
    budgetSourceMode === "accounts"
      ? getAccountsBudgetTotal()
      : (monthlyBudgetByMonth[selectedObjectiveMonth] ?? presupuestoAsignado);

  const presupuestoEl = document.getElementById("sum-presupuesto-total");
  const gastosEl = document.getElementById("sum-total-gastos");
  const excedidosEl = document.getElementById("sum-excedidos");

  if (presupuestoEl) {
    presupuestoEl.textContent = "$" + formatCOP(Math.round(presupuestoTotal));
  }
  if (gastosEl) {
    gastosEl.textContent = "$" + formatCOP(Math.round(totalGastos));
  }
  if (excedidosEl) {
    excedidosEl.textContent = `${excedidos} de ${categorias.length}`;
  }

  syncBudgetInputWithSelectedMonth();
  persistBudgetDataToStore();
}

function syncBudgetInputWithSelectedMonth() {
  const budgetInput = document.getElementById("budget-total-input");
  if (!budgetInput) return;

  if (budgetSourceMode === "accounts") {
    setMoneyInputValue(budgetInput, getAccountsBudgetTotal());
    return;
  }

  const objetivosSelector = "#objetivos-grid .budget-item";
  const categoriasSelector = "#categorias-grid .budget-item";
  const totalObjetivosMes = sumObjectiveMonthlyContributions(
    selectedObjectiveMonth,
  );
  const totalCategorias = sumBy(categoriasSelector, "total");
  const fallbackTotal = Math.round(totalObjetivosMes + totalCategorias);

  const monthValue = monthlyBudgetByMonth[selectedObjectiveMonth];
  setMoneyInputValue(
    budgetInput,
    monthValue != null ? Math.round(monthValue) : fallbackTotal,
  );
}

function saveBudgetTotal() {
  if (budgetSourceMode === "accounts") {
    updateSummaryCards();
    return;
  }

  const budgetInput = document.getElementById("budget-total-input");
  if (!budgetInput) return;

  const parsed = parseMoneyInputValue(budgetInput.value);
  const value = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  monthlyBudgetByMonth[selectedObjectiveMonth] = value;
  setMoneyInputValue(budgetInput, value);
  updateSummaryCards();
}

function formatCOP(n) {
  return n.toLocaleString("es-CO");
}

function parseMoneyInputValue(raw) {
  if (window.ClanLedgerMoneyInput) {
    return window.ClanLedgerMoneyInput.parseValue(raw);
  }
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return 0;
  const numeric = Number(text.replace(/[^\d-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function setMoneyInputValue(inputEl, value) {
  if (!inputEl) return;
  const rounded = Math.round(Number(value) || 0);
  if (window.ClanLedgerMoneyInput) {
    inputEl.value = window.ClanLedgerMoneyInput.formatInputValue(rounded);
  } else {
    inputEl.value = rounded;
  }
}

// Read the currently selected value from a custom-select
function getSelectValue(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return "";
  const selected = el.querySelector(".select-option.selected span");
  return selected ? selected.textContent.trim() : "";
}

// Pre-select a value in a custom-select (used when opening edit modal)
function preselectDropdown(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select || !value) return;
  const display = select.querySelector(".select-display");
  select.querySelectorAll(".select-option").forEach((opt) => {
    const span = opt.querySelector("span");
    const isMatch = span && span.textContent.trim() === value;
    opt.classList.toggle("selected", isMatch);
    const existingChk = opt.querySelector(".check-icon");
    if (existingChk) existingChk.remove();
    if (isMatch) {
      display.textContent = value;
      const chkImg = document.createElement("img");
      chkImg.src = "../assets/imagenes/Done.png";
      chkImg.alt = "✓";
      chkImg.className = "check-icon";
      opt.appendChild(chkImg);
    }
  });
}

function openEditItem(itemEl) {
  currentEditItem = itemEl;
  const isObjective = !!itemEl.closest("#objetivos-grid");
  const name =
    itemEl.dataset.name || itemEl.querySelector(".item-name").textContent;
  const savings = getObjectiveSavings(itemEl);
  const current = isObjective
    ? parseFloat(savings[selectedObjectiveMonth]) || 0
    : parseFloat(itemEl.dataset.current) || 0;
  const total = parseFloat(itemEl.dataset.total) || 0;
  const period = itemEl.dataset.period || "";
  const area = itemEl.dataset.area || "General";

  document.getElementById("edit-item-title").textContent = "Editar — " + name;
  document.getElementById("edit-name").value = name;
  setMoneyInputValue(document.getElementById("edit-current"), current);
  setMoneyInputValue(document.getElementById("edit-total"), total);

  // Periodo: show group only if item has a period, pre-select it
  const periodGroup = document.getElementById("edit-period-group");
  const objectiveAreaGroup = document.getElementById(
    "edit-objective-area-group",
  );
  if (!isObjective && period) {
    periodGroup.style.display = "";
    resetSelect("sel-edit-periodo", "Sin período");
    preselectDropdown("sel-edit-periodo", period);
    if (objectiveAreaGroup) objectiveAreaGroup.style.display = "none";
  } else {
    periodGroup.style.display = "none";
    if (objectiveAreaGroup) {
      objectiveAreaGroup.style.display = "";
      resetSelect("sel-edit-obj-area", "Área");
      preselectDropdown("sel-edit-obj-area", area);
    }
  }

  openModal("modal-editar-item");
}

function syncEditFromAmount() {
  // Allow empty inputs while editing. Empty is interpreted as 0 on save.
}

function saveEditItem() {
  if (!currentEditItem) return;

  const newName = document.getElementById("edit-name").value.trim();
  const isObjective = !!currentEditItem.closest("#objetivos-grid");
  const currentRaw = document.getElementById("edit-current").value;
  const totalRaw = document.getElementById("edit-total").value;
  const current = currentRaw === "" ? 0 : parseMoneyInputValue(currentRaw);
  const total = totalRaw === "" ? 0 : parseMoneyInputValue(totalRaw);

  // Update name
  if (newName) {
    currentEditItem.dataset.name = newName;
    currentEditItem.querySelector(".item-name").textContent = newName;
    document.getElementById("edit-item-title").textContent =
      "Editar — " + newName;
  }

  // Update data attributes
  if (isObjective) {
    const savings = getObjectiveSavings(currentEditItem);
    savings[selectedObjectiveMonth] = current;
    setObjectiveSavings(currentEditItem, savings);
    currentEditItem.dataset.current = sumObjectiveSavings(savings);

    const newArea = getSelectValue("sel-edit-obj-area") || "General";
    currentEditItem.dataset.area = newArea;
  } else {
    currentEditItem.dataset.current = current;
  }
  currentEditItem.dataset.total = total;

  refreshItemProgress(currentEditItem);

  // Update period if the group was visible
  const periodGroup = document.getElementById("edit-period-group");
  if (periodGroup.style.display !== "none") {
    const newPeriod = getSelectValue("sel-edit-periodo");
    if (newPeriod) {
      currentEditItem.dataset.period = newPeriod;
      upsertItemBadge(currentEditItem, newPeriod);
    }
  }

  closeModal("modal-editar-item");
  currentEditItem = null;
  updateSummaryCards();
}

function deleteEditItem() {
  if (!currentEditItem) return;
  const el = currentEditItem;
  closeModal("modal-editar-item");
  currentEditItem = null;
  el.style.transition = "opacity 0.22s ease, transform 0.22s ease";
  el.style.opacity = "0";
  el.style.transform = "scale(0.9)";
  setTimeout(() => {
    el.remove();
    updateSummaryCards();
  }, 240);
}

/* =============================================
   ADD NEW OBJECTIVE / CATEGORY CARD
   ============================================= */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function upsertItemBadge(itemEl, labelText) {
  let badge = itemEl.querySelector(".item-period");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "item-period";
    itemEl.appendChild(badge);
  }
  badge.textContent = labelText;
}

function buildItemEl(name, current, total, period, year, area) {
  const { pctInt, isExceeded, barPct } = calcProgress(current, total);

  const div = document.createElement("div");
  div.className = "budget-item" + (isExceeded ? " exceeded" : "") + " entering";
  div.dataset.name = name;
  div.dataset.current = current;
  div.dataset.total = total;
  if (period) div.dataset.period = period;
  if (year) div.dataset.year = year;
  if (area) div.dataset.area = area;

  if (year && !period) {
    const initialSavings = {};
    initialSavings[selectedObjectiveMonth] = current;
    setObjectiveSavings(div, initialSavings);
  }

  const badgeLabel = period || (year ? `Anual ${year}` : "");
  const badgeHtml = badgeLabel
    ? `<span class="item-period">${escapeHtml(badgeLabel)}</span>`
    : "";

  div.innerHTML = `
    <div class="item-header">
      <span class="item-name">${escapeHtml(name)}</span>
      <div class="item-header-right">
        <span class="item-percent">${pctInt}%</span>
        <button class="item-edit-btn" onclick="openEditItem(this.closest('.budget-item'))" title="Editar">&#9998;</button>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill${isExceeded ? " exceeded" : ""}" style="width:${barPct}%"></div>
    </div>
    <div class="item-amounts">
      <span>$${formatCOP(Math.round(current))}</span><span>$${formatCOP(Math.round(total))}</span>
    </div>
    ${badgeHtml}
  `;
  setTimeout(() => div.classList.remove("entering"), 400);
  return div;
}

function resetSelect(selectId, placeholder) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.querySelector(".select-display").textContent = placeholder;
  select.querySelectorAll(".select-option").forEach((opt) => {
    opt.classList.remove("selected");
    const chk = opt.querySelector(".check-icon");
    if (chk) chk.remove();
  });
}

function addObjetivo() {
  const nameEl = document.getElementById("obj-nombre");
  const metaEl = document.getElementById("obj-meta");
  const area = getSelectValue("sel-obj-area") || "General";
  const year = getSelectValue("sel-obj-year") || currentYear;
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    nameEl.style.borderColor = "#e53935";
    setTimeout(() => (nameEl.style.borderColor = ""), 1200);
    return;
  }
  const meta = parseMoneyInputValue(metaEl.value);
  const grid = document.getElementById("objetivos-grid");
  grid.appendChild(buildItemEl(name, 0, meta > 0 ? meta : 1, "", year, area));

  nameEl.value = "";
  metaEl.value = "";
  resetSelect("sel-obj-area", "Área");
  preselectDropdown("sel-obj-year", currentYear);
  closeModal("modal-objetivo");
  refreshAllProgress();
}

function addPresupuesto() {
  const nameEl = document.getElementById("pres-nombre");
  const limEl = document.getElementById("pres-limite");
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    nameEl.style.borderColor = "#e53935";
    setTimeout(() => (nameEl.style.borderColor = ""), 1200);
    return;
  }
  const limite = parseMoneyInputValue(limEl.value);
  const period = getSelectValue("sel-periodo");
  const grid = document.getElementById("categorias-grid");
  grid.appendChild(buildItemEl(name, 0, limite > 0 ? limite : 1, period, ""));

  nameEl.value = "";
  setMoneyInputValue(limEl, 0);
  resetSelect("sel-pres-cat", "Categoría");
  resetSelect("sel-periodo", "Elige el período");
  closeModal("modal-presupuesto");
  refreshAllProgress();
}
