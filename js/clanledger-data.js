// ARCHIVO: clanledger-data.js
// DESCRIPCION: Logica y comportamiento de esta parte de ClanLedger.

(function () {
  // TEMP ADAPTER BRIDGE
  // Swap adapter implementation (local/backend) without touching store logic.
  const MODE_KEY = "clanledger_current_mode_v1";

  // FUNCION: getCurrentMode - explica su proposito, entradas y salida.
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

  // FUNCION: createFallbackAdapter - explica su proposito, entradas y salida.
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

  // FUNCION: createFamilyDefaultState - explica su proposito, entradas y salida.
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
          predeterminada: true,
        },
        {
          id: 2,
          nombre: "Mercado quincenal",
          tipo: "gasto",
          monto: 690000,
          categoria: "AlimentaciÃ³n",
          miembro: "Ana",
          metodo: "Checking",
          fecha: "24/02/26",
          predeterminada: true,
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
          predeterminada: true,
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
          predeterminada: true,
        },
        {
          id: 5,
          nombre: "Colegio",
          tipo: "gasto",
          monto: 780000,
          categoria: "EducaciÃ³n",
          miembro: "Familia",
          metodo: "Checking",
          fecha: "12/04/26",
          predeterminada: true,
        },
        {
          id: 6,
          nombre: "Bono anual",
          tipo: "ingreso",
          monto: 1300000,
          categoria: "Extras",
          miembro: "Fernando",
          metodo: "Ahorro",
          fecha: "09/05/26",
          predeterminada: true,
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
        objectiveAreas: ["Hogar", "EducaciÃ³n", "Viajes", "Salud"],
        categories: [
          {
            id: 1,
            name: "AlimentaciÃ³n",
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

  // FUNCION: createPersonalDefaultState - explica su proposito, entradas y salida.
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
          predeterminada: true,
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
          predeterminada: true,
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
          predeterminada: true,
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
          predeterminada: true,
        },
        {
          id: 5,
          nombre: "Gym",
          tipo: "gasto",
          monto: 140000,
          categoria: "Bienestar",
          miembro: "Usuario",
          metodo: "Personal Cash",
          fecha: "15/04/26",
          predeterminada: true,
        },
        {
          id: 6,
          nombre: "Ingreso freelance",
          tipo: "ingreso",
          monto: 820000,
          categoria: "Extras",
          miembro: "Usuario",
          metodo: "Cuenta Principal",
          fecha: "07/05/26",
          predeterminada: true,
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
        objectiveAreas: [
          "Desarrollo personal",
          "Hogar",
          "Viajes",
          "EducaciÃ³n",
        ],
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

  // FUNCION: getDefaultStateForMode - devuelve el estado base correcto para cada modo.
  function getDefaultStateForMode(mode) {
    return mode === "personal"
      ? createPersonalDefaultState()
      : createFamilyDefaultState();
  }

  // FUNCION: includesName - detecta coincidencias por nombre ignorando mayusculas y espacios.
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

  // FUNCION: normalizeModeBudgetState - evita que se mezclen objetivos y categorias entre modos.
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

      if (hasLeakedPersonalObjectives) {
        nextState.budgets.objectives = deepClone(defaults.budgets.objectives);
      }
      if (hasLeakedPersonalCategories) {
        nextState.budgets.categories = deepClone(defaults.budgets.categories);
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

  // FUNCION: deepClone - crea copias independientes para no mutar el estado base.
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // FUNCION: mergeDefaults - completa el estado guardado con campos nuevos de los defaults.
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

  // FUNCION: formatCOP - formatea numeros en estilo colombiano para mostrar montos.
  function formatCOP(value) {
    return (Number(value) || 0).toLocaleString("es-CO");
  }

  // FUNCION: parseTransactionDate - interpreta la fecha de una transaccion para calcular periodos.
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

  // FUNCION: applyDerivedData - recalcula totales de categorias a partir de las transacciones.
  function applyDerivedData(state) {
    const categories = state.budgets.categories || [];
    if (categories.length > 0) {
      // Solo las categorias existentes reciben el gasto acumulado del periodo.
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

  // FUNCION: loadState - carga el estado actual del almacenamiento segun el modo activo.
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

  // FUNCION: saveState - normaliza, recalcula derivados y persiste el estado final.
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

  // FUNCION: reloadForCurrentMode - recarga el estado cuando el usuario cambia de modo.
  function reloadForCurrentMode() {
    state = applyDerivedData(loadState());
    return getState();
  }

  // FUNCION: setState - aplica una mutacion controlada sobre una copia del estado.
  function setState(updater) {
    const draft = deepClone(state);
    const updated = updater(draft) || draft;
    return saveState(updated);
  }

  // FUNCION: getState - devuelve una copia segura del estado actual.
  function getState() {
    return deepClone(state);
  }

  // FUNCION: getCurrentMonthName - obtiene el mes actual como etiqueta en espanol.
  function getCurrentMonthName() {
    return MONTHS[new Date().getMonth()];
  }

  // FUNCION: computeFinancials - calcula ingresos, gastos, ahorro y balance por mes o miembro.
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

  // FUNCION: addCategoryIfMissing - agrega una categoria solo si aun no existe en el modo actual.
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
