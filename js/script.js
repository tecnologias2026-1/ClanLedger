// ARCHIVO: script.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

document.addEventListener("DOMContentLoaded", () => {
  const store = window.ClanLedgerStore;
  if (!store) return;
  const moneyInput = window.ClanLedgerMoneyInput;
  const SESSION_USER_KEY = "clanledger_current_user_v1";

  const membersWrap = document.querySelector(".members");
  const membersSection = membersWrap ? membersWrap.closest(".section") : null;
  const accountsWrap = document.querySelector(".accounts");
  const infoCard = document.querySelector(".section .inner-card");
  const headerSub = document.querySelector(".header-top .sub");
  const userMenu = document.getElementById("user-menu");
  const userMenuTrigger = document.getElementById("user-menu-trigger");
  const userMenuLogoutBtn = document.getElementById("cerrarSesionBtn");

  const modalMember = document.getElementById("modalMiembro");
  const modalEditMember = document.getElementById("modalEditarMiembro");
  const modalAccount = document.getElementById("modalCuenta");
  const modalDelete = document.getElementById("modalEliminar");
  const modalDeleteAccount = document.getElementById("modalEliminarCuenta");

  const btnOpenMember = document.getElementById("abrirModal");
  const btnCloseMember = document.getElementById("cerrarModal");
  const btnCloseEditMember = document.getElementById(
    "cerrarModalEditarMiembro",
  );
  const btnOpenAccount = document.getElementById("abrirModalCuenta");
  const btnCloseAccount = document.getElementById("cerrarModalCuenta");
  const btnOpenDelete = document.getElementById("abrirBorrarDatos");
  const btnCancelDelete = document.getElementById("cancelarEliminar");
  const btnConfirmDelete = document.getElementById("confirmarEliminar");
  const btnOpenDeleteAccount = document.getElementById("abrirEliminarCuenta");
  const btnCancelDeleteAccount = document.getElementById(
    "cancelarEliminarCuenta",
  );
  const btnConfirmDeleteAccount = document.getElementById(
    "confirmarEliminarCuenta",
  );

  const memberNameInput = document.getElementById("member-name-input");
  const memberRoleInput = document.getElementById("member-role-input");
  const memberAdminInput = document.getElementById("member-admin-input");
  const memberSaveBtn = document.getElementById("guardarMiembroBtn");

  const editMemberNameInput = document.getElementById("edit-member-name-input");
  const editMemberRoleInput = document.getElementById("edit-member-role-input");
  const editMemberAdminInput = document.getElementById(
    "edit-member-admin-input",
  );
  const editMemberSaveBtn = document.getElementById("guardarEdicionMiembroBtn");
  const editMemberDeleteBtn = document.getElementById("eliminarMiembroBtn");

  const accountNameInput = modalAccount
    ? document.getElementById("account-name-input")
    : null;
  const accountTypeSelect = modalAccount
    ? document.getElementById("account-type-input")
    : null;
  const accountTypeCustomSelect = modalAccount
    ? document.getElementById("account-type-select")
    : null;
  const accountIconOptions = modalAccount
    ? modalAccount.querySelectorAll(".account-icon-option")
    : [];
  const accountBalanceInput = modalAccount
    ? document.getElementById("account-balance-input")
    : null;
  const accountModalTitle = modalAccount
    ? document.getElementById("account-modal-title")
    : null;
  const accountModalSubtitle = modalAccount
    ? document.getElementById("account-modal-subtitle")
    : null;
  const accountSaveBtn = modalAccount
    ? document.getElementById("guardarCuentaBtn")
    : null;
  const accountDeleteBtn = modalAccount
    ? document.getElementById("eliminarCuentaIndividualBtn")
    : null;

  if (moneyInput && accountBalanceInput) {
    moneyInput.attach(accountBalanceInput);
  }

  const addColors = modalMember ? modalMember.querySelectorAll(".color") : [];
  const editColors = modalEditMember
    ? modalEditMember.querySelectorAll(".color-edit")
    : [];
  let selectedColor = "#3b82f6";
  let selectedEditColor = "#3b82f6";
  let selectedAccountIcon = "checking";
  let editingMemberId = null;
  let editingAccountId = null;

  const ACCOUNT_ICON_MAP = {
    checking: "../assets/imagenes/checking.png",
    ahorro: "../assets/imagenes/ahorro.png",
    credito: "../assets/imagenes/credito.png",
    efectivo: "../assets/imagenes/efectivo.png",
  };

  // FUNCION: readSessionUser - explica su proposito, entradas y salida.
  function readSessionUser() {
    try {
      const raw = localStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // FUNCION: writeSessionUser - explica su proposito, entradas y salida.
  function writeSessionUser(session) {
    if (!session) return;
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session));
  }

  // FUNCION: clearSessionUser - explica su proposito, entradas y salida.
  function clearSessionUser() {
    localStorage.removeItem(SESSION_USER_KEY);
  }

  // FUNCION: getRoleLine - explica su proposito, entradas y salida.
  function getRoleLine(member) {
    const normalized = normalizeMember(member);
    return normalized.isAdmin
      ? `${normalized.name} - Admin`
      : `${normalized.name} - ${normalized.role}`;
  }

  // FUNCION: ensureActiveSessionMember - explica su proposito, entradas y salida.
  function ensureActiveSessionMember() {
    const mode =
      window.ClanLedgerModeManager?.getMode?.() ||
      store.getMode?.() ||
      "familiar";
    if (mode === "personal") return;

    const session = readSessionUser();
    if (!session || !session.name) return;

    store.setState((s) => {
      s.members = (s.members || []).filter(
        (m) => !m.sessionUser || Number(m.id) === Number(session.memberId),
      );

      let idx = s.members.findIndex(
        (m) => Number(m.id) === Number(session.memberId),
      );

      if (idx < 0) {
        const nextId =
          s.members.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
        const activeMember = {
          id: nextId,
          name: session.name,
          role: "Tu",
          isAdmin: true,
          color: "#249a40",
          sessionUser: true,
        };
        s.members.unshift(activeMember);
        session.memberId = nextId;
      } else {
        s.members[idx].name = session.name;
        s.members[idx].sessionUser = true;
        const [active] = s.members.splice(idx, 1);
        s.members.unshift(active);
      }

      return s;
    });

    writeSessionUser(session);
  }

  // FUNCION: normalizeMember - explica su proposito, entradas y salida.
  function normalizeMember(member) {
    const rawRole = String(member.role || "Invitado").trim();
    const inferredAdmin =
      typeof member.isAdmin === "boolean"
        ? member.isAdmin
        : /(^|\s|-|_)admin$/i.test(rawRole) || /-\s*admin/i.test(rawRole);
    const cleanRole =
      rawRole.replace(/\s*-\s*admin\s*$/i, "").trim() || "Invitado";
    return {
      id: member.id,
      name: member.name || "Miembro",
      role: cleanRole,
      isAdmin: inferredAdmin,
      color: member.color || "#3b82f6",
    };
  }

  // FUNCION: getMemberRoleLabel - explica su proposito, entradas y salida.
  function getMemberRoleLabel(member) {
    const normalized = normalizeMember(member);
    return normalized.isAdmin ? `${normalized.role} - Admin` : normalized.role;
  }

  // FUNCION: setPaletteSelection - explica su proposito, entradas y salida.
  function setPaletteSelection(nodes, color) {
    const target = String(color || "").toLowerCase();
    nodes.forEach((node) => {
      const isMatch =
        String(node.getAttribute("data-color") || "").toLowerCase() === target;
      node.classList.toggle("selected", isMatch);
    });
  }

  // FUNCION: openEditMember - explica su proposito, entradas y salida.
  function openEditMember(memberId, originRef) {
    const state = store.getState();
    const member = state.members.find((m) => Number(m.id) === Number(memberId));
    if (!member || !modalEditMember) return;

    const normalized = normalizeMember(member);
    editingMemberId = Number(normalized.id);
    selectedEditColor = normalized.color;

    if (editMemberNameInput) editMemberNameInput.value = normalized.name;
    if (editMemberRoleInput) editMemberRoleInput.value = normalized.role;
    if (editMemberAdminInput) editMemberAdminInput.checked = normalized.isAdmin;
    setPaletteSelection(editColors, selectedEditColor);
    openModal(modalEditMember, originRef);
  }

  // FUNCION: setModalStartPosition - explica su proposito, entradas y salida.
  function setModalStartPosition(el, originRef) {
    if (!el) return;
    const modalContent = el.querySelector(".modal-content");

    const triggerEl =
      originRef?.currentTarget ||
      originRef?.target?.closest("button") ||
      (originRef?.getBoundingClientRect ? originRef : null);
    const triggerRect = triggerEl?.getBoundingClientRect
      ? triggerEl.getBoundingClientRect()
      : null;
    const clickY =
      originRef && typeof originRef.clientY === "number"
        ? originRef.clientY
        : null;

    const preferredTop = triggerRect
      ? triggerRect.top - 20
      : clickY != null
        ? clickY - 120
        : window.innerHeight * 0.14;

    const modalHeight = modalContent?.offsetHeight || 420;
    const maxTop = Math.max(24, window.innerHeight - modalHeight - 24);
    const clampedTop = Math.max(24, Math.min(preferredTop, maxTop));

    (modalContent || el).style.setProperty(
      "--modal-start-y",
      `${Math.round(clampedTop)}px`,
    );
  }

  // FUNCION: openModal - abre una ventana modal desde la posicion del control origen.
  function openModal(el, originRef) {
    if (!el) return;
    setModalStartPosition(el, originRef);
    el.classList.add("visible");
  }

  // FUNCION: closeModal - cierra la ventana modal indicada.
  function closeModal(el) {
    if (el) el.classList.remove("visible");
  }

  // FUNCION: closeUserMenu - colapsa el menu desplegable del usuario.
  function closeUserMenu() {
    if (userMenu) userMenu.classList.remove("open");
  }

  // FUNCION: getAccountIconUrl - resuelve el icono visual de una cuenta segun su tipo.
  function getAccountIconUrl(account) {
    if (account && account.icon && ACCOUNT_ICON_MAP[account.icon]) {
      return ACCOUNT_ICON_MAP[account.icon];
    }

    const name = String(account.name || "").toLowerCase();
    const type = String(account.type || "").toLowerCase();
    const text = `${name} ${type}`;

    if (text.includes("corriente") || text.includes("checking")) {
      return ACCOUNT_ICON_MAP.checking;
    }
    if (text.includes("ahorro") || text.includes("savings")) {
      return ACCOUNT_ICON_MAP.ahorro;
    }
    if (
      text.includes("credito") ||
      text.includes("crÃ©dito") ||
      text.includes("tarjeta")
    ) {
      return ACCOUNT_ICON_MAP.credito;
    }
    if (text.includes("efectivo") || text.includes("cash")) {
      return ACCOUNT_ICON_MAP.efectivo;
    }

    return ACCOUNT_ICON_MAP.credito;
  }

  // FUNCION: inferAccountIconKey - infiere la clave del icono a partir del nombre o tipo de cuenta.
  function inferAccountIconKey(account) {
    if (account && account.icon && ACCOUNT_ICON_MAP[account.icon]) {
      return account.icon;
    }

    const name = String(account?.name || "").toLowerCase();
    const type = String(account?.type || "").toLowerCase();
    const text = `${name} ${type}`;

    if (text.includes("corriente") || text.includes("checking")) {
      return "checking";
    }
    if (text.includes("ahorro") || text.includes("savings")) {
      return "ahorro";
    }
    if (
      text.includes("credito") ||
      text.includes("crÃ©dito") ||
      text.includes("tarjeta")
    ) {
      return "credito";
    }
    if (text.includes("efectivo") || text.includes("cash")) {
      return "efectivo";
    }

    return "credito";
  }

  // FUNCION: setAccountIconSelection - marca visualmente el icono de cuenta seleccionado.
  function setAccountIconSelection(iconKey) {
    const nextIcon = ACCOUNT_ICON_MAP[iconKey] ? iconKey : "checking";
    selectedAccountIcon = nextIcon;
    accountIconOptions.forEach((button) => {
      const isMatch = button.getAttribute("data-icon") === nextIcon;
      button.classList.toggle("selected", isMatch);
    });
  }

  // FUNCION: setAccountTypeSelection - sincroniza el tipo de cuenta entre select nativo y dropdown visual.
  function setAccountTypeSelection(typeValue) {
    if (!accountTypeSelect || !accountTypeCustomSelect) return;
    const nextValue = typeValue || "";
    const displayText = accountTypeCustomSelect.querySelector(
      ".account-type-display",
    );
    const options = accountTypeCustomSelect.querySelectorAll(
      ".account-type-option",
    );

    accountTypeSelect.value = nextValue;
    options.forEach((option) => {
      const isMatch = option.getAttribute("data-value") === nextValue;
      option.classList.toggle("selected", isMatch);
      const check = option.querySelector(".check");
      if (check) check.style.opacity = isMatch ? "1" : "0";
    });

    if (displayText) {
      const selected = Array.from(options).find(
        (option) => option.getAttribute("data-value") === nextValue,
      );
      displayText.textContent = selected
        ? selected.querySelector("span")?.textContent || "Tipo cuenta"
        : "Tipo cuenta";
    }
  }

  // FUNCION: toggleAccountTypeDropdown - abre o cierra el dropdown visual del tipo de cuenta.
  function toggleAccountTypeDropdown(forceOpen) {
    if (!accountTypeCustomSelect) return;
    const shouldOpen =
      typeof forceOpen === "boolean"
        ? forceOpen
        : !accountTypeCustomSelect.classList.contains("open");
    accountTypeCustomSelect.classList.toggle("open", shouldOpen);
  }

  // FUNCION: closeAccountTypeDropdown - asegura que el dropdown de tipo de cuenta quede cerrado.
  function closeAccountTypeDropdown() {
    if (accountTypeCustomSelect) {
      accountTypeCustomSelect.classList.remove("open");
    }
  }

  // FUNCION: openCreateAccountModal - prepara el modal para crear una cuenta nueva.
  function openCreateAccountModal(originRef) {
    editingAccountId = null;
    if (accountModalTitle) accountModalTitle.textContent = "Nueva Cuenta";
    if (accountModalSubtitle)
      accountModalSubtitle.textContent =
        "Agrega una cuenta bancaria o de efectivo";
    if (accountSaveBtn) accountSaveBtn.textContent = "Agregar Cuenta";
    if (accountDeleteBtn) accountDeleteBtn.style.display = "none";
    if (accountNameInput) accountNameInput.value = "";
    setAccountTypeSelection("");
    if (accountBalanceInput) accountBalanceInput.value = "";
    setAccountIconSelection("checking");
    openModal(modalAccount, originRef);
  }

  // FUNCION: openEditAccountModal - carga los datos de una cuenta en el modal de edicion.
  function openEditAccountModal(accountId, originRef) {
    const state = store.getState();
    const account = state.accounts.find(
      (a) => Number(a.id) === Number(accountId),
    );
    if (!account) return;

    editingAccountId = Number(account.id);
    if (accountModalTitle) accountModalTitle.textContent = "Editar Cuenta";
    if (accountModalSubtitle)
      accountModalSubtitle.textContent =
        "Actualiza los datos y el logo de la cuenta";
    if (accountSaveBtn) accountSaveBtn.textContent = "Guardar cambios";
    if (accountDeleteBtn) accountDeleteBtn.style.display = "inline-block";
    if (accountNameInput) accountNameInput.value = account.name || "";
    setAccountTypeSelection(account.type || "");
    if (accountBalanceInput) {
      const balanceValue = Number(account.balance) || 0;
      accountBalanceInput.value = moneyInput
        ? moneyInput.formatInputValue(balanceValue)
        : balanceValue;
    }
    setAccountIconSelection(inferAccountIconKey(account));
    openModal(modalAccount, originRef);
  }

  // FUNCION: renderAjustes - refresca miembros, cuentas y textos segun el modo y la sesion.
  function renderAjustes() {
    const state = store.getState();
    const mode =
      window.ClanLedgerModeManager?.getMode?.() ||
      store.getMode?.() ||
      "familiar";

    if (membersSection) {
      // En modo personal la gestion de miembros no es relevante y se oculta.
      membersSection.style.display = mode === "personal" ? "none" : "";
    }
    if (btnOpenMember) {
      btnOpenMember.style.display = mode === "personal" ? "none" : "";
    }

    if (headerSub) {
      const session = readSessionUser();
      const active =
        mode === "personal"
          ? null
          : session
            ? state.members.find(
                (m) => Number(m.id) === Number(session.memberId),
              )
            : state.members[0];
      if (active) {
        headerSub.textContent = getRoleLine(active);
      } else if (session?.name) {
        headerSub.textContent =
          mode === "personal" ? session.name : `${session.name} - Admin`;
      }
    }

    if (membersWrap) {
      membersWrap.innerHTML = "";
      state.members.forEach((m) => {
        const roleLabel = getMemberRoleLabel(m);
        const row = document.createElement("div");
        row.className = "member";
        row.innerHTML = `
          <div class="member-main">
            <div class="member-avatar" style="background:${m.color};">${m.name.slice(0, 1).toUpperCase()}</div>
            <div class="member-info">
              <p class="name">${m.name}</p>
              <span>${roleLabel}</span>
            </div>
          </div>
          <button class="member-edit-btn" data-member-id="${m.id}">Editar</button>
        `;
        membersWrap.appendChild(row);
      });

      membersWrap.querySelectorAll(".member-edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          openEditMember(btn.getAttribute("data-member-id"), e);
        });
      });
    }

    if (accountsWrap) {
      accountsWrap.innerHTML = "";
      state.accounts.forEach((a) => {
        const iconUrl = getAccountIconUrl(a);
        const row = document.createElement("div");
        row.className = "account";
        row.innerHTML = `
          <div class="account-main">
            <img src="${iconUrl}" alt="Icono cuenta" />
            <div>
              <p class="title">${a.name}</p>
              <span>${a.type} - Saldo $${store.formatCOP(a.balance)}</span>
            </div>
          </div>
          <button class="account-edit-btn" data-account-id="${a.id}">Editar</button>
        `;
        accountsWrap.appendChild(row);
      });

      accountsWrap.querySelectorAll(".account-edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          openEditAccountModal(btn.getAttribute("data-account-id"), e);
        });
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

  addColors.forEach((color) => {
    color.addEventListener("click", function () {
      addColors.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedColor = this.getAttribute("data-color") || selectedColor;
    });
  });

  editColors.forEach((color) => {
    color.addEventListener("click", function () {
      editColors.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedEditColor = this.getAttribute("data-color") || selectedEditColor;
    });
  });

  accountIconOptions.forEach((button) => {
    button.addEventListener("click", () => {
      setAccountIconSelection(button.getAttribute("data-icon"));
    });
  });

  if (accountTypeCustomSelect) {
    const header = accountTypeCustomSelect.querySelector(
      ".account-type-header",
    );
    const options = accountTypeCustomSelect.querySelectorAll(
      ".account-type-option",
    );

    if (header) {
      header.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = accountTypeCustomSelect.classList.contains("open");
        closeAccountTypeDropdown();
        if (!wasOpen) toggleAccountTypeDropdown(true);
      });
    }

    options.forEach((option) => {
      option.addEventListener("click", () => {
        setAccountTypeSelection(option.getAttribute("data-value") || "");
        closeAccountTypeDropdown();
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#account-type-select")) {
      closeAccountTypeDropdown();
    }
  });

  if (btnOpenMember)
    btnOpenMember.addEventListener("click", (e) => {
      selectedColor = "#3b82f6";
      setPaletteSelection(addColors, selectedColor);
      if (memberAdminInput) memberAdminInput.checked = false;
      if (memberRoleInput) memberRoleInput.value = "";
      if (memberNameInput) memberNameInput.value = "";
      openModal(modalMember, e);
    });
  if (btnCloseMember)
    btnCloseMember.addEventListener("click", () => closeModal(modalMember));
  if (modalMember) {
    modalMember.addEventListener("click", (e) => {
      if (e.target === modalMember) closeModal(modalMember);
    });
  }

  if (btnCloseEditMember)
    btnCloseEditMember.addEventListener("click", () => {
      closeModal(modalEditMember);
      editingMemberId = null;
    });
  if (modalEditMember) {
    modalEditMember.addEventListener("click", (e) => {
      if (e.target === modalEditMember) {
        closeModal(modalEditMember);
        editingMemberId = null;
      }
    });
  }

  if (btnOpenAccount)
    btnOpenAccount.addEventListener("click", (e) => openCreateAccountModal(e));
  if (btnCloseAccount)
    btnCloseAccount.addEventListener("click", () => {
      closeModal(modalAccount);
      editingAccountId = null;
    });
  if (modalAccount) {
    modalAccount.addEventListener("click", (e) => {
      if (e.target === modalAccount) {
        closeModal(modalAccount);
        editingAccountId = null;
      }
    });
  }

  if (btnOpenDelete)
    btnOpenDelete.addEventListener("click", (e) => openModal(modalDelete, e));
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
      const role = memberRoleInput ? memberRoleInput.value.trim() : "";
      const isAdmin = memberAdminInput ? memberAdminInput.checked : false;
      if (!name) return;

      store.setState((s) => {
        const nextId =
          s.members.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0) + 1;
        s.members.push({
          id: nextId,
          name,
          role: role || "Invitado",
          isAdmin,
          color: selectedColor,
        });
        return s;
      });

      if (memberNameInput) memberNameInput.value = "";
      if (memberRoleInput) memberRoleInput.value = "";
      if (memberAdminInput) memberAdminInput.checked = false;
      selectedColor = "#3b82f6";
      setPaletteSelection(addColors, selectedColor);
      closeModal(modalMember);
      renderAjustes();
    });
  }

  if (editMemberSaveBtn) {
    editMemberSaveBtn.addEventListener("click", () => {
      if (editingMemberId == null) return;

      const name = editMemberNameInput ? editMemberNameInput.value.trim() : "";
      const role = editMemberRoleInput ? editMemberRoleInput.value.trim() : "";
      const isAdmin = editMemberAdminInput
        ? editMemberAdminInput.checked
        : false;
      if (!name) return;

      store.setState((s) => {
        const idx = s.members.findIndex(
          (m) => Number(m.id) === Number(editingMemberId),
        );
        if (idx >= 0) {
          s.members[idx].name = name;
          s.members[idx].role = role || "Invitado";
          s.members[idx].isAdmin = isAdmin;
          s.members[idx].color = selectedEditColor;
        }
        return s;
      });

      const session = readSessionUser();
      if (session && Number(session.memberId) === Number(editingMemberId)) {
        session.name = name;
        writeSessionUser(session);
      }

      closeModal(modalEditMember);
      editingMemberId = null;
      renderAjustes();
    });
  }

  if (editMemberDeleteBtn) {
    editMemberDeleteBtn.addEventListener("click", () => {
      if (editingMemberId == null) return;

      store.setState((s) => {
        s.members = s.members.filter(
          (m) => Number(m.id) !== Number(editingMemberId),
        );
        return s;
      });

      closeModal(modalEditMember);
      editingMemberId = null;
      renderAjustes();
    });
  }

  if (accountSaveBtn) {
    accountSaveBtn.addEventListener("click", () => {
      const name = accountNameInput ? accountNameInput.value.trim() : "";
      const type = accountTypeSelect ? accountTypeSelect.value : "";
      const icon = selectedAccountIcon || "checking";
      const balance = accountBalanceInput
        ? moneyInput
          ? moneyInput.parseValue(accountBalanceInput.value)
          : Number(
              String(accountBalanceInput.value || "").replace(/[^\d-]/g, ""),
            ) || 0
        : 0;
      if (!name || !type) return;

      store.setState((s) => {
        if (editingAccountId != null) {
          const idx = s.accounts.findIndex(
            (a) => Number(a.id) === Number(editingAccountId),
          );
          if (idx >= 0) {
            s.accounts[idx].name = name;
            s.accounts[idx].type = type;
            s.accounts[idx].balance = balance;
            s.accounts[idx].icon = icon;
          }
        } else {
          const nextId =
            s.accounts.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0) +
            1;
          s.accounts.push({ id: nextId, name, type, balance, icon });
        }
        return s;
      });

      if (accountNameInput) accountNameInput.value = "";
      if (accountBalanceInput) accountBalanceInput.value = "";
      setAccountTypeSelection("");
      setAccountIconSelection("checking");
      closeModal(modalAccount);
      editingAccountId = null;
      renderAjustes();
    });
  }

  if (accountDeleteBtn) {
    accountDeleteBtn.addEventListener("click", () => {
      if (editingAccountId == null) return;

      store.setState((s) => {
        const target = s.accounts.find(
          (a) => Number(a.id) === Number(editingAccountId),
        );

        s.accounts = s.accounts.filter(
          (a) => Number(a.id) !== Number(editingAccountId),
        );

        if (target?.name) {
          s.transactions = (s.transactions || []).filter(
            (tx) => String(tx.cuenta || "") !== String(target.name),
          );
        }

        return s;
      });

      if (accountNameInput) accountNameInput.value = "";
      if (accountBalanceInput) accountBalanceInput.value = "";
      setAccountTypeSelection("");
      setAccountIconSelection("checking");
      if (accountDeleteBtn) accountDeleteBtn.style.display = "none";
      closeModal(modalAccount);
      editingAccountId = null;
      renderAjustes();
    });
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", () => {
      store.setState((s) => {
        s.transactions = [];
        s.accounts = [];
        s.budgets.monthlyBudgetByMonth = {};
        s.budgets.objectives = [];
        s.budgets.categories = [];
        s.budgets.objectiveAreas = [];
        s.settings = s.settings || {};
        s.settings.skipTransactionSeeding = true;
        return s;
      });

      closeModal(modalDelete);
      renderAjustes();
    });
  }

  if (btnOpenDeleteAccount)
    btnOpenDeleteAccount.addEventListener("click", (e) =>
      openModal(modalDeleteAccount, e),
    );
  if (btnCancelDeleteAccount)
    btnCancelDeleteAccount.addEventListener("click", () =>
      closeModal(modalDeleteAccount),
    );
  if (modalDeleteAccount) {
    modalDeleteAccount.addEventListener("click", (e) => {
      if (e.target === modalDeleteAccount) closeModal(modalDeleteAccount);
    });
  }

  if (btnConfirmDeleteAccount) {
    btnConfirmDeleteAccount.addEventListener("click", () => {
      const adapter = window.ClanLedgerStorageAdapter;
      if (adapter && typeof adapter.clearState === "function") {
        adapter.clearState();
      }

      clearSessionUser();
      closeModal(modalDeleteAccount);

      if (typeof window.navigateWithFade === "function") {
        window.navigateWithFade("../html/landing.html");
      } else {
        window.location.href = "../html/landing.html";
      }
    });
  }

  if (userMenuTrigger) {
    userMenuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userMenu) userMenu.classList.toggle("open");
    });
  }

  if (userMenuLogoutBtn) {
    userMenuLogoutBtn.addEventListener("click", () => {
      closeUserMenu();

      const session = readSessionUser();
      if (session?.memberId != null) {
        store.setState((s) => {
          s.members = (s.members || []).filter(
            (m) => Number(m.id) !== Number(session.memberId),
          );
          return s;
        });
      }
      clearSessionUser();

      if (typeof window.navigateWithFade === "function") {
        window.navigateWithFade("../html/landing.html");
      } else {
        window.location.href = "../html/landing.html";
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (!userMenu) return;
    if (!e.target.closest("#user-menu")) {
      closeUserMenu();
    }
  });

  ensureActiveSessionMember();
  renderAjustes();

  window.addEventListener("clanledger:mode-change", () => {
    if (typeof store.reloadForCurrentMode === "function") {
      store.reloadForCurrentMode();
    }
    ensureActiveSessionMember();
    renderAjustes();
  });
});
