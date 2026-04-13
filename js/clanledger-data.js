(function () {
  const STORAGE_KEY = "clanledger_state_v1";

  const DEFAULT_STATE = {
    members: [
      { id: 1, name: "Fernando", role: "Padre", color: "#be3232" },
      { id: 2, name: "Ana", role: "Madre - Admin", color: "#f59e0b" },
      { id: 3, name: "Sofia", role: "Hermana", color: "#3b82f6" },
      { id: 4, name: "Alejandro", role: "Tu - Admin", color: "#249a40" },
    ],
    accounts: [
      { id: 1, name: "Checking", type: "Cuenta Corriente", balance: 3200000 },
      { id: 2, name: "Ahorro", type: "Cuenta de Ahorros", balance: 4850000 },
      { id: 3, name: "Credito", type: "Tarjeta de Credito", balance: -1250000 },
      { id: 4, name: "Cash", type: "Efectivo", balance: 420000 },
    ],
    transactions: [],
    budgets: {
      monthlyBudgetByMonth: {},
      objectives: [],
      categories: [],
    },
    settings: {
      notifications: true,
    },
  };

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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return mergeDefaults(parsed, deepClone(DEFAULT_STATE));
    } catch {
      return deepClone(DEFAULT_STATE);
    }
  }

  let state = applyDerivedData(loadState());

  function saveState(nextState) {
    state = applyDerivedData(
      mergeDefaults(nextState, deepClone(DEFAULT_STATE)),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
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

  window.ClanLedgerStore = {
    MONTHS,
    formatCOP,
    getState,
    setState,
    saveState,
    getCurrentMonthName,
    computeFinancials,
  };
})();
