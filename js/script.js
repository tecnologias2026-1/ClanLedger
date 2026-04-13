document.addEventListener("DOMContentLoaded", () => {
  const store = window.ClanLedgerStore;
  if (!store) return;

  const membersWrap = document.querySelector(".members");
  const accountsWrap = document.querySelector(".accounts");
  const infoCard = document.querySelector(".section .inner-card");

  const modalMember = document.getElementById("modalMiembro");
  const modalAccount = document.getElementById("modalCuenta");
  const modalDelete = document.getElementById("modalEliminar");

  const btnOpenMember = document.getElementById("abrirModal");
  const btnCloseMember = document.getElementById("cerrarModal");
  const btnOpenAccount = document.getElementById("abrirModalCuenta");
  const btnCloseAccount = document.getElementById("cerrarModalCuenta");
  const btnOpenDelete = document.getElementById("abrirEliminar");
  const btnCancelDelete = document.getElementById("cancelarEliminar");
  const btnConfirmDelete = document.getElementById("confirmarEliminar");

  const memberNameInput = modalMember
    ? modalMember.querySelector('input[type="text"]')
    : null;
  const memberSaveBtn = modalMember
    ? modalMember.querySelector(".modal-btn")
    : null;

  const accountNameInput = modalAccount
    ? modalAccount.querySelector('input[type="text"]')
    : null;
  const accountTypeSelect = modalAccount
    ? modalAccount.querySelector("select")
    : null;
  const accountBalanceInput = modalAccount
    ? modalAccount.querySelector('input[type="number"]')
    : null;
  const accountSaveBtn = modalAccount
    ? modalAccount.querySelector(".modal-btn")
    : null;

  const colors = document.querySelectorAll(".color");
  let selectedColor = "#3b82f6";

  function openModal(el) {
    if (el) el.style.display = "flex";
  }

  function closeModal(el) {
    if (el) el.style.display = "none";
  }

  function renderAjustes() {
    const state = store.getState();

    if (membersWrap) {
      membersWrap.innerHTML = "";
      state.members.forEach((m) => {
        const row = document.createElement("div");
        row.className = "member";
        row.innerHTML = `
          <div style="width:44px;height:44px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">${m.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <p class="name">${m.name}</p>
            <span>${m.role}</span>
          </div>
        `;
        membersWrap.appendChild(row);
      });
    }

    if (accountsWrap) {
      accountsWrap.innerHTML = "";
      state.accounts.forEach((a) => {
        const row = document.createElement("div");
        row.className = "account";
        row.innerHTML = `
          <div>
            <p class="title">${a.name}</p>
            <span>${a.type} - Saldo $${store.formatCOP(a.balance)}</span>
          </div>
        `;
        accountsWrap.appendChild(row);
      });
    }

    if (infoCard) {
      infoCard.innerHTML = `
        <p>Version 0.2.3</p>
        <p>Total de transacciones: ${state.transactions.length}</p>
        <p>Miembros registrados: ${state.members.length}</p>
        <p>Cuentas registradas: ${state.accounts.length}</p>
      `;
    }
  }

  colors.forEach((color) => {
    color.addEventListener("click", function () {
      colors.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedColor = this.getAttribute("data-color") || selectedColor;
    });
  });

  if (btnOpenMember)
    btnOpenMember.addEventListener("click", () => openModal(modalMember));
  if (btnCloseMember)
    btnCloseMember.addEventListener("click", () => closeModal(modalMember));
  if (modalMember) {
    modalMember.addEventListener("click", (e) => {
      if (e.target === modalMember) closeModal(modalMember);
    });
  }

  if (btnOpenAccount)
    btnOpenAccount.addEventListener("click", () => openModal(modalAccount));
  if (btnCloseAccount)
    btnCloseAccount.addEventListener("click", () => closeModal(modalAccount));
  if (modalAccount) {
    modalAccount.addEventListener("click", (e) => {
      if (e.target === modalAccount) closeModal(modalAccount);
    });
  }

  if (btnOpenDelete)
    btnOpenDelete.addEventListener("click", () => openModal(modalDelete));
  if (btnCancelDelete)
    btnCancelDelete.addEventListener("click", () => closeModal(modalDelete));
  if (modalDelete) {
    modalDelete.addEventListener("click", (e) => {
      if (e.target === modalDelete) closeModal(modalDelete);
    });
  }

  if (memberSaveBtn) {
    memberSaveBtn.addEventListener("click", () => {
      const name = memberNameInput ? memberNameInput.value.trim() : "";
      if (!name) return;

      store.setState((s) => {
        const nextId =
          s.members.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
        s.members.push({
          id: nextId,
          name,
          role: "Invitado",
          color: selectedColor,
        });
        return s;
      });

      if (memberNameInput) memberNameInput.value = "";
      closeModal(modalMember);
      renderAjustes();
    });
  }

  if (accountSaveBtn) {
    accountSaveBtn.addEventListener("click", () => {
      const name = accountNameInput ? accountNameInput.value.trim() : "";
      const type = accountTypeSelect ? accountTypeSelect.value : "";
      const balance = accountBalanceInput
        ? parseFloat(accountBalanceInput.value) || 0
        : 0;
      if (!name || !type || type === "Tipo cuenta") return;

      store.setState((s) => {
        const nextId =
          s.accounts.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0) +
          1;
        s.accounts.push({ id: nextId, name, type, balance });
        return s;
      });

      if (accountNameInput) accountNameInput.value = "";
      if (accountBalanceInput) accountBalanceInput.value = "";
      if (accountTypeSelect) accountTypeSelect.selectedIndex = 0;
      closeModal(modalAccount);
      renderAjustes();
    });
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", () => {
      store.setState((s) => {
        s.transactions = [];
        s.budgets.objectives = [];
        s.budgets.categories = [];
        s.budgets.monthlyBudgetByMonth = {};
        return s;
      });
      closeModal(modalDelete);
      renderAjustes();
    });
  }

  renderAjustes();
});
