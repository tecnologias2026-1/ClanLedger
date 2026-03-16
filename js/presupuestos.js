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

/* =============================================
   CREATE NEW CATEGORY (inline modal)
   ============================================= */
function createNewCategory(selectId, dropId) {
  pendingCatSelectId = selectId;
  pendingCatDropId = dropId;

  // Open the new-category sub-modal (overlay stays active)
  document.getElementById("modal-nueva-cat").classList.add("active");
  document.getElementById("new-cat-input").value = "";
  setTimeout(() => document.getElementById("new-cat-input").focus(), 80);
}

function cancelNewCategory() {
  document.getElementById("modal-nueva-cat").classList.remove("active");
  pendingCatSelectId = null;
  pendingCatDropId = null;
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
  }

  document.getElementById("modal-nueva-cat").classList.remove("active");
  pendingCatSelectId = null;
  pendingCatDropId = null;
}

/* Enter key on new category input */
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("new-cat-input")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") confirmNewCategory();
      if (e.key === "Escape") cancelNewCategory();
    });
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
let editingField = null; // 'amount' | 'percent' — tracks which field was last changed

function formatCOP(n) {
  return n.toLocaleString("es-CO");
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
  const name =
    itemEl.dataset.name || itemEl.querySelector(".item-name").textContent;
  const current = parseFloat(itemEl.dataset.current) || 0;
  const total = parseFloat(itemEl.dataset.total) || 1;
  const period = itemEl.dataset.period || "";
  const pct = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;

  document.getElementById("edit-item-title").textContent = "Editar — " + name;
  document.getElementById("edit-name").value = name;
  document.getElementById("edit-current").value = current;
  document.getElementById("edit-total").value = total;
  document.getElementById("edit-percent").value = pct;

  // Periodo: show group only if item has a period, pre-select it
  const periodGroup = document.getElementById("edit-period-group");
  if (period) {
    periodGroup.style.display = "";
    resetSelect("sel-edit-periodo", "Sin período");
    preselectDropdown("sel-edit-periodo", period);
  } else {
    periodGroup.style.display = "none";
  }

  editingField = null;
  openModal("modal-editar-item");
}

function syncEditFromAmount() {
  editingField = "amount";
  const current =
    parseFloat(document.getElementById("edit-current").value) || 0;
  const total = parseFloat(document.getElementById("edit-total").value) || 1;
  const pct = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;
  document.getElementById("edit-percent").value = pct;
}

function syncEditFromPercent() {
  editingField = "percent";
  const pct = parseFloat(document.getElementById("edit-percent").value) || 0;
  const total = parseFloat(document.getElementById("edit-total").value) || 1;
  const current = Math.round((pct / 100) * total);
  document.getElementById("edit-current").value = current;
}

function saveEditItem() {
  if (!currentEditItem) return;

  const newName = document.getElementById("edit-name").value.trim();
  const current =
    parseFloat(document.getElementById("edit-current").value) || 0;
  const total = parseFloat(document.getElementById("edit-total").value) || 1;
  const pct = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;
  const pctInt = Math.round(pct);
  const isExceeded = current >= total;

  // Update name
  if (newName) {
    currentEditItem.dataset.name = newName;
    currentEditItem.querySelector(".item-name").textContent = newName;
    document.getElementById("edit-item-title").textContent =
      "Editar — " + newName;
  }

  // Update data attributes
  currentEditItem.dataset.current = current;
  currentEditItem.dataset.total = total;

  // Update displayed percent
  currentEditItem.querySelector(".item-percent").textContent = pctInt + "%";

  // Update progress bar
  const fill = currentEditItem.querySelector(".progress-fill");
  const barPct = Math.min(pct, 100);
  fill.style.width = barPct + "%";

  // Update amounts display
  const amounts = currentEditItem.querySelectorAll(".item-amounts span");
  amounts[0].textContent = "$" + formatCOP(Math.round(current));
  amounts[1].textContent = "$" + formatCOP(Math.round(total));

  // Toggle exceeded state
  if (isExceeded) {
    currentEditItem.classList.add("exceeded");
    fill.classList.add("exceeded");
  } else {
    currentEditItem.classList.remove("exceeded");
    fill.classList.remove("exceeded");
  }

  // Update period if the group was visible
  const periodGroup = document.getElementById("edit-period-group");
  if (periodGroup.style.display !== "none") {
    const newPeriod = getSelectValue("sel-edit-periodo");
    if (newPeriod) {
      currentEditItem.dataset.period = newPeriod;
      let badge = currentEditItem.querySelector(".item-period");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "item-period";
        currentEditItem.appendChild(badge);
      }
      badge.textContent = newPeriod;
    }
  }

  closeModal("modal-editar-item");
  currentEditItem = null;
}

function deleteEditItem() {
  if (!currentEditItem) return;
  const el = currentEditItem;
  closeModal("modal-editar-item");
  currentEditItem = null;
  el.style.transition = "opacity 0.22s ease, transform 0.22s ease";
  el.style.opacity = "0";
  el.style.transform = "scale(0.9)";
  setTimeout(() => el.remove(), 240);
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

function buildItemEl(name, current, total, period) {
  const pct = total > 0 ? Math.round((current / total) * 1000) / 10 : 0;
  const pctInt = Math.round(pct);
  const isExceeded = current >= total && total > 0 && current > 0;
  const barPct = Math.min(pct, 100);

  const div = document.createElement("div");
  div.className = "budget-item" + (isExceeded ? " exceeded" : "") + " entering";
  div.dataset.name = name;
  div.dataset.current = current;
  div.dataset.total = total;
  if (period) div.dataset.period = period;

  const periodBadge = period
    ? `<span class="item-period">${escapeHtml(period)}</span>`
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
    ${periodBadge}
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
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.focus();
    nameEl.style.borderColor = "#e53935";
    setTimeout(() => (nameEl.style.borderColor = ""), 1200);
    return;
  }
  const meta = parseFloat(metaEl.value) || 0;
  const grid = document.getElementById("objetivos-grid");
  grid.appendChild(buildItemEl(name, 0, meta > 0 ? meta : 1));

  nameEl.value = "";
  metaEl.value = "";
  resetSelect("sel-obj-cat", "Categoría");
  closeModal("modal-objetivo");
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
  const limite = parseFloat(limEl.value) || 0;
  const period = getSelectValue("sel-periodo");
  const grid = document.getElementById("categorias-grid");
  grid.appendChild(buildItemEl(name, 0, limite > 0 ? limite : 1, period));

  nameEl.value = "";
  limEl.value = "0";
  resetSelect("sel-pres-cat", "Categoría");
  resetSelect("sel-periodo", "Elige el período");
  closeModal("modal-presupuesto");
}
