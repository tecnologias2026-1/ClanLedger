(function () {
  // TEMP ADAPTER BRIDGE
  // Swap adapter implementation (local/backend) without touching store logic.
  const MODE_KEY = "clanledger_current_mode_v1";

  function getCurrentMode() {
    try {
      const mode =
        window.ClanLedgerModeManager?.getMode?.() ||
        localStorage.getItem(MODE_KEY) ||
        "familiar";
      return mode === "personal" ? "personal" : "familiar";
    } catch {
      return "familiar";
    }
  }

  function createFallbackAdapter() {
    const STORAGE_KEY_PREFIX = "clanledger_state_v1";
    return {
      type: "fallback-local",
      getSessionId() {
        return "guest";
      },
      getState(defaultState) {
        try {
          const mode = getCurrentMode();
          const STORAGE_KEY =
            mode === "personal"
              ? `${STORAGE_KEY_PREFIX}__personal__guest`
              : `${STORAGE_KEY_PREFIX}__guest`;
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return JSON.parse(JSON.stringify(defaultState));
          return JSON.parse(raw);
        } catch {
          return JSON.parse(JSON.stringify(defaultState));
        }
      },
      saveState(nextState) {
        const mode = getCurrentMode();
        const STORAGE_KEY =
          mode === "personal"
            ? `${STORAGE_KEY_PREFIX}__personal__guest`
            : `${STORAGE_KEY_PREFIX}__guest`;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        return nextState;
      },
      clearState() {
        const mode = getCurrentMode();
        const STORAGE_KEY =
          mode === "personal"
            ? `${STORAGE_KEY_PREFIX}__personal__guest`
            : `${STORAGE_KEY_PREFIX}__guest`;
        localStorage.removeItem(STORAGE_KEY);
      },
    };
  }

  const storageAdapter =
    window.ClanLedgerStorageAdapter || createFallbackAdapter();

  function createFamilyDefaultState() {
    const monthNames = [
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
    const currentYear = String(new Date().getFullYear());
    const currentMonth = monthNames[new Date().getMonth()];

    return {
      members: [
        { id: 1, name: "Fernando", role: "Padre", color: "#be3232" },
        { id: 2, name: "Ana", role: "Madre - Admin", color: "#f59e0b" },
        { id: 3, name: "Sofia", role: "Hermana", color: "#3b82f6" },
        { id: 4, name: "Alejandro", role: "Tu - Admin", color: "#249a40" },
      ],
      accounts: [
        {
          id: 1,
          name: "Checking",
          type: "Cuenta Corriente",
          balance: 3200000,
        },
        {
          id: 2,
          name: "Ahorro",
          type: "Cuenta de Ahorros",
          balance: 4850000,
        },
        {
          id: 3,
          name: "Credito",
          type: "Tarjeta de Credito",
          balance: -1250000,
        },
        { id: 4, name: "Cash", type: "Efectivo", balance: 420000 },
      ],
      transactions: [
        {
          id: 1,
          nombre: "Salario familiar",
          tipo: "ingreso",
          monto: 5600000,
          categoria: "Salario",
          miembro: "Fernando",
          metodo: "Checking",
          fecha: "25/02/26",
        },
        {
          id: 2,
          nombre: "Mercado quincenal",
          tipo: "gasto",
          monto: 690000,
          categoria: "Alimentación",
          miembro: "Ana",
          metodo: "Checking",
          fecha: "24/02/26",
        },
        {
          id: 3,
          nombre: "Gasolina",
          tipo: "gasto",
          monto: 165000,
          categoria: "Transportes",
          miembro: "Alejandro",
          metodo: "Cash",
          fecha: "23/02/26",
        },
        {
          id: 4,
          nombre: "Servicios",
          tipo: "gasto",
          monto: 520000,
          categoria: "Vivienda",
          miembro: "Familia",
          metodo: "Ahorro",
          fecha: "22/02/26",
        },
      ],
      budgets: {
        monthlyBudgetByMonth: {},
        objectives: [
          {
            id: "obj-familiar-1",
            name: "Fondo de Emergencia Familiar",
            area: "Hogar",
            total: 12000000,
            year: currentYear,
            savings: {
              [currentMonth]: 4200000,
            },
          },
          {
            id: "obj-familiar-2",
            name: "Vacaciones Familiares",
            area: "Viajes",
            total: 9000000,
            year: currentYear,
            savings: {
              [currentMonth]: 2650000,
            },
          },
        ],
        objectiveAreas: ["Hogar", "Educación", "Viajes", "Salud"],
        categories: [
          {
            id: 1,
            name: "Alimentación",
            current: 690000,
            total: 1300000,
            period: "Mensual",
          },
          {
            id: 2,
            name: "Vivienda",
            current: 520000,
            total: 1800000,
            period: "Mensual",
          },
          {
            id: 3,
            name: "Transportes",
            current: 165000,
            total: 650000,
            period: "Mensual",
          },
        ],
      },
      settings: {
        notifications: true,
      },
    };
  }

  function createPersonalDefaultState() {
    const currentYear = String(new Date().getFullYear());
    return {
      members: [],
      accounts: [
        {
          id: 1,
          name: "Personal Cash",
          type: "Efectivo",
          balance: 850000,
          icon: "efectivo",
        },
        {
          id: 2,
          name: "Cuenta Principal",
          type: "Cuenta Corriente",
          balance: 2100000,
          icon: "checking",
        },
        {
          id: 3,
          name: "Ahorro Personal",
          type: "Cuenta de Ahorros",
          balance: 1250000,
          icon: "ahorro",
        },
      ],
      transactions: [
        {
          id: 1,
          nombre: "Salario personal",
          tipo: "ingreso",
          monto: 4200000,
          categoria: "Salario",
          miembro: "Usuario",
          metodo: "Cuenta Principal",
          fecha: "21/02/26",
        },
        {
          id: 2,
          nombre: "Mercado",
          tipo: "gasto",
          monto: 380000,
          categoria: "Bienestar",
          miembro: "Usuario",
          metodo: "Personal Cash",
          fecha: "20/02/26",
        },
        {
          id: 3,
          nombre: "Transporte",
          tipo: "gasto",
          monto: 95000,
          categoria: "Movilidad diaria",
          miembro: "Usuario",
          metodo: "Personal Cash",
          fecha: "19/02/26",
        },
        {
          id: 4,
          nombre: "Ahorro mensual",
          tipo: "gasto",
          monto: 450000,
          categoria: "Meta de ahorro",
          miembro: "Usuario",
          metodo: "Ahorro Personal",
          fecha: "18/02/26",
        },
      ],
      budgets: {
        monthlyBudgetByMonth: {},
        objectives: [
          {
            id: "obj-personal-1",
            name: "Fondo para estudio",
            total: 5000000,
            year: currentYear,
            savings: { Abril: 2100000 },
          },
          {
            id: "obj-personal-2",
            name: "Viaje personal",
            total: 3200000,
            year: currentYear,
            savings: { Abril: 1250000 },
          },
        ],
        objectiveAreas: ["Desarrollo personal", "Hogar", "Viajes", "Educación"],
        categories: [
          {
            id: 1,
            name: "Bienestar",
            current: 380000,
            total: 700000,
            period: "Mensual",
          },
          {
            id: 2,
            name: "Movilidad diaria",
            current: 95000,
            total: 280000,
            period: "Mensual",
          },
          {
            id: 3,
            name: "Meta de ahorro",
            current: 450000,
            total: 600000,
            period: "Mensual",
          },
        ],
      },
      settings: {
        notifications: true,
      },
    };
  }

  function getDefaultStateForMode(mode) {
    return mode === "personal"
      ? createPersonalDefaultState()
      : createFamilyDefaultState();
  }

  function includesName(items, name) {
    const target = String(name || "")
      .trim()
      .toLowerCase();
    return (items || []).some(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() === target,
    );
  }

  function normalizeModeBudgetState(nextState, mode, defaults) {
    const objectives = nextState?.budgets?.objectives || [];
    const categories = nextState?.budgets?.categories || [];

    if (mode === "personal") {
      const hasLeakedFamilyObjectives =
        includesName(objectives, "Fondo de Emergencia Familiar") ||
        includesName(objectives, "Vacaciones");
      const hasLeakedFamilyCategories =
        includesName(categories, "Vivienda") ||
        includesName(categories, "Transportes");

      if (hasLeakedFamilyObjectives) {
        nextState.budgets.objectives = deepClone(defaults.budgets.objectives);
      }
      if (hasLeakedFamilyCategories) {
        nextState.budgets.categories = deepClone(defaults.budgets.categories);
      }
    }

    if (mode === "familiar") {
      const hasLeakedPersonalObjectives =
        includesName(objectives, "Fondo para estudio") ||
        includesName(objectives, "Viaje personal");
      const hasLeakedPersonalCategories =
        includesName(categories, "Bienestar") ||
        includesName(categories, "Movilidad diaria") ||
        includesName(categories, "Meta de ahorro");
      const hasNoObjectives = objectives.length === 0;
      const hasNoCategories = categories.length === 0;
      const hasNoAreas =
        !Array.isArray(nextState?.budgets?.objectiveAreas) ||
        nextState.budgets.objectiveAreas.length === 0;

      if (hasLeakedPersonalObjectives || hasNoObjectives) {
        nextState.budgets.objectives = deepClone(defaults.budgets.objectives);
      }
      if (hasLeakedPersonalCategories || hasNoCategories) {
        nextState.budgets.categories = deepClone(defaults.budgets.categories);
      }
      if (hasNoAreas) {
        nextState.budgets.objectiveAreas = deepClone(
          defaults.budgets.objectiveAreas,
        );
      }
    }

    return nextState;
  }

  const DEFAULT_STATE = getDefaultStateForMode(getCurrentMode());

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

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDefaults(target, defaults) {
    Object.keys(defaults).forEach((key) => {
      const defVal = defaults[key];
      const curVal = target[key];
      if (Array.isArray(defVal)) {
        if (!Array.isArray(curVal)) target[key] = deepClone(defVal);
      } else if (defVal && typeof defVal === "object") {
        if (!curVal || typeof curVal !== "object" || Array.isArray(curVal)) {
          target[key] = deepClone(defVal);
        } else {
          mergeDefaults(curVal, defVal);
        }
      } else if (curVal == null) {
        target[key] = defVal;
      }
    });
    return target;
  }

  function formatCOP(value) {
    return (Number(value) || 0).toLocaleString("es-CO");
  }

  function parseTransactionDate(tx) {
    if (tx.dateISO) {
      const d = new Date(tx.dateISO);
      if (!Number.isNaN(d.getTime())) return d;
    }
    if (tx.fecha && /^\d{2}\/\d{2}\/\d{2}$/.test(tx.fecha)) {
      const [dd, mm, yy] = tx.fecha.split("/").map(Number);
      const y = 2000 + yy;
      return new Date(y, mm - 1, dd);
    }
    return null;
  }

  function applyDerivedData(state) {
    const categories = state.budgets.categories || [];
    if (categories.length > 0) {
      const spendingByCategory = {};
      state.transactions.forEach((tx) => {
        if (tx.tipo !== "gasto") return;
        const cat = tx.categoria || "Sin categoria";
        spendingByCategory[cat] =
          (spendingByCategory[cat] || 0) + (Number(tx.monto) || 0);
      });

      categories.forEach((cat) => {
        cat.current = spendingByCategory[cat.name] || 0;
      });
    }

    return state;
  }

  function loadState() {
    try {
      const currentMode = getCurrentMode();
      const defaults = getDefaultStateForMode(currentMode);
      const parsed = storageAdapter.getState(defaults);
      const merged = mergeDefaults(parsed, deepClone(defaults));
      return normalizeModeBudgetState(merged, currentMode, defaults);
    } catch {
      return deepClone(DEFAULT_STATE);
    }
  }

  let state = applyDerivedData(loadState());

  function saveState(nextState) {
    const currentMode = getCurrentMode();
    const defaults = getDefaultStateForMode(currentMode);
    const merged = mergeDefaults(nextState, deepClone(defaults));
    state = applyDerivedData(
      normalizeModeBudgetState(merged, currentMode, defaults),
    );
    storageAdapter.saveState(state);
    return state;
  }

  function reloadForCurrentMode() {
    state = applyDerivedData(loadState());
    return getState();
  }

  function setState(updater) {
    const draft = deepClone(state);
    const updated = updater(draft) || draft;
    return saveState(updated);
  }

  function getState() {
    return deepClone(state);
  }

  function getCurrentMonthName() {
    return MONTHS[new Date().getMonth()];
  }

  function computeFinancials(opts) {
    const options = opts || {};
    const monthName = options.monthName || getCurrentMonthName();
    const member = options.member || "Todos";

    const txList = state.transactions.filter((tx) => {
      if (member !== "Todos" && tx.miembro !== member) return false;
      return true;
    });

    let ingresosMes = 0;
    let gastosMes = 0;
    let ingresosTotales = 0;
    let gastosTotales = 0;

    txList.forEach((tx) => {
      const amount = Number(tx.monto) || 0;
      const d = parseTransactionDate(tx);
      const txMonth = d ? MONTHS[d.getMonth()] : null;

      if (tx.tipo === "ingreso") {
        ingresosTotales += amount;
        if (txMonth === monthName) ingresosMes += amount;
      }

      if (tx.tipo === "gasto") {
        gastosTotales += amount;
        if (txMonth === monthName) gastosMes += amount;
      }
    });

    const ahorroAcumulado = ingresosTotales - gastosTotales;
    const balanceMensual = ingresosMes - gastosMes;

    return {
      ingresosMes,
      gastosMes,
      ingresosTotales,
      gastosTotales,
      ahorroAcumulado,
      balanceMensual,
    };
  }

  function addCategoryIfMissing(name) {
    const clean = String(name || "").trim();
    if (!clean) return false;

    let added = false;
    setState((s) => {
      const exists = (s.budgets.categories || []).some(
        (c) => String(c.name || "").toLowerCase() === clean.toLowerCase(),
      );
      if (!exists) {
        const nextId =
          (s.budgets.categories || []).reduce(
            (max, c) => Math.max(max, Number(c.id) || 0),
            0,
          ) + 1;
        s.budgets.categories.push({
          id: nextId,
          name: clean,
          current: 0,
          total: 0,
          period: "Mensual",
        });
        added = true;
      }
      return s;
    });

    return added;
  }

  window.addEventListener("clanledger:mode-change", () => {
    reloadForCurrentMode();
  });

  window.ClanLedgerStore = {
    adapterType: storageAdapter.type,
    getMode: getCurrentMode,
    reloadForCurrentMode,
    MONTHS,
    formatCOP,
    getState,
    setState,
    saveState,
    getCurrentMonthName,
    computeFinancials,
    addCategoryIfMissing,
  };
})();
