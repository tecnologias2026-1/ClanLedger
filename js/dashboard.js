function renderDashboardPage() {
  const store = window.ClanLedgerStore;
  if (!store) return;
  let dashboardTrendHoverData = null;
  const MONTHS = store.MONTHS || [
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

  const state = store.getState();
  const monthName = store.getCurrentMonthName();
  const monthIndex = MONTHS.indexOf(monthName);
  const currentYear = new Date().getFullYear();
  const f = store.computeFinancials({ monthName });
  const expenseTx = state.transactions.filter((t) => t.tipo === "gasto");
  const memberPeriodSwitch = document.getElementById("member-period-switch");

  const fechaActual = document.getElementById("fecha-actual");
  if (fechaActual) {
    fechaActual.textContent = `${monthName} ${new Date().getFullYear()}`;
  }

  const kpis = document.querySelectorAll(".kpi-grid .kpi-card");
  if (kpis.length >= 4) {
    kpis[0].querySelector(".kpi-value").textContent =
      `$${store.formatCOP(f.ahorroAcumulado)}`;
    kpis[1].querySelector(".kpi-label").textContent = `Ingresos (${monthName})`;
    kpis[1].querySelector(".kpi-value").textContent =
      `$${store.formatCOP(f.ingresosMes)}`;
    kpis[2].querySelector(".kpi-label").textContent = `Gastos (${monthName})`;
    kpis[2].querySelector(".kpi-value").textContent =
      `$${store.formatCOP(f.gastosMes)}`;
    kpis[3].querySelector(".kpi-value").textContent =
      `$${store.formatCOP(f.balanceMensual)}`;
    kpis[3].querySelector(".kpi-note").textContent =
      `${state.members.length} miembros`;
  }

  const txContainer = document.querySelector(".transacciones-list");
  if (txContainer) {
    const last = [...state.transactions].slice(0, 5);
    txContainer.innerHTML = "";
    last.forEach((t) => {
      const isIngreso = t.tipo === "ingreso";
      const item = document.createElement("div");
      item.className = "tx-item";
      item.innerHTML = `
        <div class="tx-info">
          <span class="tx-nombre">${t.nombre}</span>
          <span class="tx-meta">${t.miembro} - ${t.categoria}</span>
        </div>
        <span class="tx-monto ${isIngreso ? "pos" : "neg"}">${isIngreso ? "+" : "-"}$${store.formatCOP(t.monto)}</span>
      `;
      txContainer.appendChild(item);
    });
  }

  const presContainer = document.querySelector(".presupuestos-list");
  if (presContainer) {
    presContainer.innerHTML = "";
    const cats = state.budgets.categories || [];
    cats.slice(0, 4).forEach((cat) => {
      const total = Number(cat.total) || 0;
      const current = Number(cat.current) || 0;
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      const item = document.createElement("div");
      item.className = "pres-item";
      item.innerHTML = `
        <div class="pres-header">
          <span class="pres-nombre">${cat.name}</span>
          <span class="pres-pct">${pct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>
        <div class="pres-amounts"><span>$${store.formatCOP(current)}</span><span>$${store.formatCOP(total)}</span></div>
      `;
      presContainer.appendChild(item);
    });
  }

  function renderCategoryChart(gastosTx) {
    const wrap = document.querySelector("#dashboard-category-chart .bars-wrap");
    const yAxis = document.querySelector(
      "#dashboard-category-chart .category-y-axis",
    );
    if (!wrap || !yAxis) return;

    const byCategory = {};
    gastosTx.forEach((tx) => {
      const category = tx.categoria || "Sin categoria";
      byCategory[category] =
        (byCategory[category] || 0) + (Number(tx.monto) || 0);
    });

    const entries = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const safeEntries = entries.length ? entries : [["Sin datos", 0]];
    const max = safeEntries.reduce((acc, [, value]) => Math.max(acc, value), 0);
    const colors = ["red", "blue", "orange", "green"];

    wrap.style.setProperty(
      "--bar-count",
      String(Math.max(1, safeEntries.length)),
    );
    wrap.innerHTML = "";
    safeEntries.forEach(([name, value], idx) => {
      const height = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `
        <div class="bar-track"><div class="bar ${colors[idx % colors.length]}" style="height:${height}%"></div></div>
        <span class="bar-label">${name}</span>
      `;
      wrap.appendChild(group);
    });

    const top = getNiceMax(max);
    const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0].map((v) =>
      Math.round(v),
    );
    yAxis.innerHTML = ticks
      .map((v) => `<span>${formatAxisValue(v)}</span>`)
      .join("");
  }

  renderCategoryChart(expenseTx);

  function monthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  function mapValueToY(value, maxValue) {
    const denom = Math.max(maxValue, 1);
    const y = 50 - (Math.max(0, value) / denom) * 48;
    return Math.max(2, Math.min(49, y));
  }

  function toPoints(values, maxValue) {
    if (!values.length) return "";
    return values
      .map((v, i) => {
        const x = values.length === 1 ? 50 : (i / (values.length - 1)) * 98;
        const y = mapValueToY(v, maxValue);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }

  function toSingleMonthLine(value, maxValue) {
    const y = mapValueToY(value, maxValue).toFixed(2);
    return `0,${y} 98,${y}`;
  }

  function getNiceMax(value) {
    if (value <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    let nice = 10;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    return nice * magnitude;
  }

  function formatAxisValue(v) {
    if (v <= 0) return "0";
    if (v >= 1000000) {
      const m = v / 1000000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
    }
    if (v >= 1000) {
      const k = v / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
    }
    return String(Math.round(v));
  }

  function computeDashboardTrend(tx) {
    const windowMonths = [-5, -4, -3, -2, -1, 0].map((offset) => {
      const d = new Date(currentYear, monthIndex + offset, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });

    const points = windowMonths.map((slot) => ({
      ...slot,
      monthName: MONTHS[slot.monthIndex],
      ingresos: 0,
      egresos: 0,
    }));
    const indexByKey = new Map(
      points.map((slot, idx) => [monthKey(slot.year, slot.monthIndex), idx]),
    );

    tx.forEach((item) => {
      const d = parseTxDate(item);
      if (!d) return;
      const idx = indexByKey.get(monthKey(d.getFullYear(), d.getMonth()));
      if (idx == null) return;
      const amount = Number(item.monto) || 0;
      if (item.tipo === "ingreso") points[idx].ingresos += amount;
      if (item.tipo === "gasto") points[idx].egresos += amount;
    });

    return {
      months: points.map((p) => ({ monthName: p.monthName })),
      ingresos: points.map((p) => p.ingresos),
      egresos: points.map((p) => p.egresos),
    };
  }

  function ensureDashboardTrendHover(lineSeries, svg) {
    let tooltip = document.getElementById("dashboard-trend-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "dashboard-trend-tooltip";
      tooltip.className = "trend-tooltip";
      document.body.appendChild(tooltip);
    }

    let inDot = lineSeries.querySelector(".trend-dot-income-ui");
    if (!inDot) {
      inDot = document.createElement("div");
      inDot.className = "trend-dot-ui trend-dot-income-ui";
      lineSeries.appendChild(inDot);
    }

    let outDot = lineSeries.querySelector(".trend-dot-expense-ui");
    if (!outDot) {
      outDot = document.createElement("div");
      outDot.className = "trend-dot-ui trend-dot-expense-ui";
      lineSeries.appendChild(outDot);
    }

    if (!svg.dataset.hoverBound) {
      svg.addEventListener("mousemove", (e) => {
        if (
          !dashboardTrendHoverData ||
          dashboardTrendHoverData.months.length === 0
        )
          return;

        const rect = svg.getBoundingClientRect();
        const relX = Math.max(
          0,
          Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
        );

        let idx = 0;
        let minDist = Number.POSITIVE_INFINITY;
        dashboardTrendHoverData.xValues.forEach((x, i) => {
          const dist = Math.abs(relX - x);
          if (dist < minDist) {
            minDist = dist;
            idx = i;
          }
        });

        const cx = dashboardTrendHoverData.xValues[idx];
        const cyIn = dashboardTrendHoverData.yIngresos[idx];
        const cyOut = dashboardTrendHoverData.yEgresos[idx];
        const xPx = (cx / 100) * lineSeries.clientWidth;
        const yInPx = (cyIn / 50) * lineSeries.clientHeight;
        const yOutPx = (cyOut / 50) * lineSeries.clientHeight;

        inDot.style.left = `${xPx}px`;
        inDot.style.top = `${yInPx}px`;
        inDot.style.display = "block";

        outDot.style.left = `${xPx}px`;
        outDot.style.top = `${yOutPx}px`;
        outDot.style.display = "block";

        const month = dashboardTrendHoverData.months[idx].monthName;
        const inValue = dashboardTrendHoverData.ingresos[idx];
        const outValue = dashboardTrendHoverData.egresos[idx];
        tooltip.textContent = `${month} | Ingresos: $${store.formatCOP(inValue)} | Egresos: $${store.formatCOP(outValue)}`;
        tooltip.style.display = "block";

        const tipHalf = Math.max(70, tooltip.offsetWidth / 2);
        const left = Math.max(
          tipHalf + 10,
          Math.min(window.innerWidth - tipHalf - 10, e.clientX),
        );
        const lineRect = lineSeries.getBoundingClientRect();
        const yMin = Math.min(yInPx, yOutPx);
        const top = Math.max(
          14,
          Math.min(window.innerHeight - 14, lineRect.top + yMin - 16),
        );
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });

      svg.addEventListener("mouseleave", () => {
        inDot.style.display = "none";
        outDot.style.display = "none";
        tooltip.style.display = "none";
      });

      svg.dataset.hoverBound = "1";
    }
  }

  function renderDashboardTrend(tx) {
    const root = document.getElementById("dashboard-trend");
    if (!root) return;
    const lineSeries = root.querySelector(".trend-line-series");
    const svg = lineSeries ? lineSeries.querySelector("svg") : null;
    const yAxis = root.querySelector(".trend-y-axis");
    const xAxis = root.querySelector(".trend-x-axis");
    if (!lineSeries || !svg || !yAxis || !xAxis) return;

    const { months, ingresos, egresos } = computeDashboardTrend(tx);
    const maxValue = Math.max(...ingresos, ...egresos, 0);
    const chartMax = getNiceMax(Math.max(1, maxValue * 1.1));

    const xValues = months.map((_, i) =>
      months.length === 1 ? 50 : (i / (months.length - 1)) * 98,
    );
    const yIngresos = ingresos.map((v) => mapValueToY(v, chartMax));
    const yEgresos = egresos.map((v) => mapValueToY(v, chartMax));
    dashboardTrendHoverData = {
      months,
      ingresos,
      egresos,
      xValues,
      yIngresos,
      yEgresos,
    };

    const lines = svg.querySelectorAll("polyline");
    if (lines.length >= 2) {
      if (months.length === 1) {
        lines[0].setAttribute(
          "points",
          toSingleMonthLine(ingresos[0], chartMax),
        );
        lines[1].setAttribute(
          "points",
          toSingleMonthLine(egresos[0], chartMax),
        );
      } else {
        lines[0].setAttribute("points", toPoints(ingresos, chartMax));
        lines[1].setAttribute("points", toPoints(egresos, chartMax));
      }
    }

    xAxis.innerHTML = months
      .map((m) => `<span>${m.monthName.slice(0, 3)}</span>`)
      .join("");

    const ticks = [
      chartMax,
      chartMax * 0.75,
      chartMax * 0.5,
      chartMax * 0.25,
      0,
    ].map((v) => Math.round(v));
    yAxis.innerHTML = ticks
      .map((v) => `<span>${formatAxisValue(v)}</span>`)
      .join("");

    ensureDashboardTrendHover(lineSeries, svg);
  }

  renderDashboardTrend(state.transactions || []);

  const memberLegendItems = document.querySelectorAll(".pie-legend-item");
  const pieSvg = document.querySelector(".pie-svg");

  function parseTxDate(tx) {
    if (tx.dateISO) {
      const d = new Date(tx.dateISO);
      if (!Number.isNaN(d.getTime())) return d;
    }
    if (tx.fecha && /^\d{2}\/\d{2}\/\d{2}$/.test(tx.fecha)) {
      const [dd, mm, yy] = tx.fecha.split("/").map(Number);
      return new Date(2000 + yy, mm - 1, dd);
    }
    return null;
  }

  function getPeriodWindow(periodKey) {
    if (periodKey === "anio") {
      return Array.from({ length: 12 }, (_, idx) => ({
        year: currentYear,
        monthIndex: idx,
      }));
    }
    if (periodKey === "3m") {
      return [-2, -1, 0].map((offset) => {
        const d = new Date(currentYear, monthIndex + offset, 1);
        return { year: d.getFullYear(), monthIndex: d.getMonth() };
      });
    }
    return [{ year: currentYear, monthIndex }];
  }

  function getMemberColor(memberName, idx) {
    const map = {
      Fernando: "#be3232",
      Ana: "#f59e0b",
      Sofia: "#3b82f6",
      Sofía: "#3b82f6",
      Alejandro: "#249a40",
      Familia: "#6d5ce7",
    };
    const fromState = (state.members || []).find((m) => m.name === memberName);
    return (
      fromState?.color ||
      map[memberName] ||
      ["#be3232", "#3b82f6", "#f59e0b", "#249a40"][idx % 4]
    );
  }

  function renderMemberPie(periodKey) {
    if (memberLegendItems.length < 4 || !pieSvg) return;

    const windowMonths = getPeriodWindow(periodKey);
    const allowed = new Set(
      windowMonths.map((w) => monthKey(w.year, w.monthIndex)),
    );
    const filtered = expenseTx.filter((tx) => {
      const d = parseTxDate(tx);
      if (!d) return false;
      return allowed.has(monthKey(d.getFullYear(), d.getMonth()));
    });

    const byMember = {};
    filtered.forEach((tx) => {
      byMember[tx.miembro] =
        (byMember[tx.miembro] || 0) + (Number(tx.monto) || 0);
    });

    const entries = Object.entries(byMember)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const total = entries.reduce((acc, [, value]) => acc + value, 0);

    memberLegendItems.forEach((item, idx) => {
      const data = entries[idx];
      if (!data) {
        item.style.display = "none";
        return;
      }
      item.style.display = "";
      const [name, value] = data;
      const pct = Math.round((value / total) * 100);
      const color = getMemberColor(name, idx);
      const nameEl = item.querySelector(".pie-legend-name");
      const valueEl = item.querySelector(".pie-legend-value");
      if (nameEl) {
        nameEl.style.color = color;
        nameEl.textContent = `${name} (${pct}%)`;
      }
      if (valueEl) valueEl.textContent = `$${store.formatCOP(value)}`;
    });

    const circles = Array.from(pieSvg.querySelectorAll("circle"));
    let offset = 0;
    circles.forEach((circle, idx) => {
      const data = entries[idx];
      if (!data || total <= 0) {
        circle.setAttribute("stroke", "transparent");
        circle.setAttribute("stroke-dasharray", "0 100");
        circle.setAttribute("stroke-dashoffset", "0");
        return;
      }
      const [name, value] = data;
      const pct = (value / total) * 100;
      circle.setAttribute("stroke", getMemberColor(name, idx));
      circle.setAttribute("stroke-dasharray", `${pct} ${100 - pct}`);
      circle.setAttribute("stroke-dashoffset", `${-offset}`);
      offset += pct;
    });
  }

  renderMemberPie("mes");

  if (memberPeriodSwitch && !memberPeriodSwitch.dataset.bound) {
    memberPeriodSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest(".period-btn");
      if (!btn) return;
      const period = btn.dataset.period || "mes";
      memberPeriodSwitch
        .querySelectorAll(".period-btn")
        .forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      renderMemberPie(period);
    });
    memberPeriodSwitch.dataset.bound = "1";
  }
}

document.addEventListener("DOMContentLoaded", renderDashboardPage);
window.addEventListener("clanledger:mode-change", () => {
  const store = window.ClanLedgerStore;
  if (store && typeof store.reloadForCurrentMode === "function") {
    store.reloadForCurrentMode();
  }
  renderDashboardPage();
});
