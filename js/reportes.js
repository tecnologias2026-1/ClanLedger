function renderReportesPage() {
  const store = window.ClanLedgerStore;
  if (!store) return;
  let trendHoverData = null;

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
  const PIE_PALETTE = [
    "#395bd6",
    "#1f8f49",
    "#8d62eb",
    "#e17b3c",
    "#d8374a",
    "#f0be2a",
    "#2b8aa5",
    "#b45f9f",
  ];
  const pieColorByCategory = {};
  let piePaletteIndex = 0;

  const periodSelect = document.getElementById("filter-periodo");
  const monthAnalysisSelect = document.getElementById("filter-mes-analisis");
  const memberSelect = document.getElementById("filter-miembro");
  const memberFilterGroup = memberSelect
    ? memberSelect.closest(".filter-group")
    : null;
  const CUSTOM_FILTER_IDS = [
    "filter-periodo",
    "filter-mes-analisis",
    "filter-miembro",
  ];
  const zoomInBtn = document.getElementById("trend-zoom-in");
  const zoomOutBtn = document.getElementById("trend-zoom-out");
  const zoomValueLabel = document.getElementById("trend-zoom-value");
  const TREND_ZOOM_LEVELS = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24];
  let trendZoomIndex = 0;

  function closeAllCustomSelects() {
    document.querySelectorAll(".report-custom-select.open").forEach((el) => {
      el.classList.remove("open");
    });
  }

  function refreshCustomSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const existing = select.parentElement.querySelector(
      `.report-custom-select[data-select-id="${selectId}"]`,
    );
    if (existing) existing.remove();

    select.classList.add("native-select-hidden");

    const wrapper = document.createElement("div");
    wrapper.className = "report-custom-select";
    wrapper.dataset.selectId = selectId;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "report-custom-select-header";

    const display = document.createElement("span");
    display.className = "report-custom-select-display";

    const arrow = document.createElement("img");
    arrow.src = "../assets/imagenes/keyboard_arrow_down_gris.png";
    arrow.alt = "";
    arrow.className = "report-custom-select-arrow";

    header.appendChild(display);
    header.appendChild(arrow);

    const dropdown = document.createElement("div");
    dropdown.className = "report-custom-select-dropdown";

    const options = Array.from(select.options);
    const selectedOption =
      options.find((opt) => opt.selected) ||
      options[select.selectedIndex] ||
      null;
    display.textContent = selectedOption
      ? selectedOption.textContent
      : "Selecciona";

    options.forEach((opt) => {
      const optEl = document.createElement("div");
      optEl.className = "report-custom-select-option";
      optEl.dataset.value = opt.value;
      optEl.innerHTML = `<span>${opt.textContent}</span><span class="check">✓</span>`;

      if (opt.disabled) optEl.classList.add("disabled");
      if (opt.selected) optEl.classList.add("selected");

      optEl.addEventListener("click", () => {
        if (opt.disabled) return;
        select.value = opt.value;
        display.textContent = opt.textContent;

        dropdown
          .querySelectorAll(".report-custom-select-option")
          .forEach((node) => node.classList.remove("selected"));
        optEl.classList.add("selected");

        closeAllCustomSelects();
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      dropdown.appendChild(optEl);
    });

    header.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = wrapper.classList.contains("open");
      closeAllCustomSelects();
      if (!wasOpen) wrapper.classList.add("open");
    });

    wrapper.appendChild(header);
    wrapper.appendChild(dropdown);
    select.parentElement.appendChild(wrapper);
  }

  function initializeCustomSelects() {
    CUSTOM_FILTER_IDS.forEach((id) => refreshCustomSelect(id));
  }

  function applyMemberFilterVisibility() {
    const mode = window.ClanLedgerModeManager?.getMode?.() || "familiar";
    const isPersonal = mode === "personal";
    if (memberFilterGroup) {
      memberFilterGroup.style.display = isPersonal ? "none" : "";
    }
    if (memberSelect && isPersonal) {
      memberSelect.value = "Todos";
      refreshCustomSelect("filter-miembro");
    }
  }

  if (memberSelect) {
    const state = store.getState();
    const mode = window.ClanLedgerModeManager?.getMode?.() || "familiar";
    memberSelect.innerHTML = "<option>Todos</option>";
    const members =
      mode === "personal" || state.members.length === 0
        ? ["Usuario"]
        : state.members.map((m) => m.name);
    members.forEach((name) => {
      const op = document.createElement("option");
      op.textContent = name;
      memberSelect.appendChild(op);
    });
    refreshCustomSelect("filter-miembro");
  }

  applyMemberFilterVisibility();

  if (monthAnalysisSelect) {
    const currentMonth = new Date().getMonth();
    monthAnalysisSelect.innerHTML = "";
    MONTHS.forEach((month, idx) => {
      const op = document.createElement("option");
      op.value = String(idx);
      op.textContent = month;
      if (idx === currentMonth) op.selected = true;
      monthAnalysisSelect.appendChild(op);
    });
    refreshCustomSelect("filter-mes-analisis");
  }

  function normalizePeriodKey(value) {
    const raw = String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (raw.includes("3")) return "ultimos-3-meses";
    if (raw.includes("ano") || raw.includes("anio")) return "este-anio";
    return "este-mes";
  }

  function getSelectedMonthIndex() {
    const fallback = new Date().getMonth();
    if (!monthAnalysisSelect) return fallback;
    const value = Number(monthAnalysisSelect.value);
    if (Number.isNaN(value) || value < 0 || value > 11) return fallback;
    return value;
  }

  function addMonthOffset(year, monthIndex, offset) {
    const d = new Date(year, monthIndex + offset, 1);
    return { year: d.getFullYear(), monthIndex: d.getMonth() };
  }

  function monthKey(year, monthIndex) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  }

  function getTrendWindow(periodKey, selectedMonthIndex) {
    const currentYear = new Date().getFullYear();

    if (periodKey === "ultimos-3-meses") {
      return [-2, -1, 0].map((offset) =>
        addMonthOffset(currentYear, selectedMonthIndex, offset),
      );
    }

    if (periodKey === "este-anio") {
      return Array.from({ length: 12 }, (_, monthIndex) => ({
        year: currentYear,
        monthIndex,
      }));
    }

    return [{ year: currentYear, monthIndex: selectedMonthIndex }];
  }

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

  function computeMonthlyTrend(tx, windowMonths, keepAllMonths) {
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

    const active = points.filter(
      (slot) => slot.ingresos !== 0 || slot.egresos !== 0,
    );
    const selected = keepAllMonths
      ? points
      : active.length
        ? active
        : [points[points.length - 1]];

    const months = selected.map(({ monthIndex, monthName }) => ({
      monthIndex,
      monthName,
    }));
    const ingresos = selected.map((slot) => slot.ingresos);
    const egresos = selected.map((slot) => slot.egresos);

    if (!active.length && !keepAllMonths) {
      ingresos[0] = 0;
      egresos[0] = 0;
    }

    return { months, ingresos, egresos };
  }

  function getMonthSummary(tx, year, monthIndex) {
    let ingresos = 0;
    let gastos = 0;
    tx.forEach((item) => {
      const d = parseTxDate(item);
      if (!d) return;
      if (d.getFullYear() !== year || d.getMonth() !== monthIndex) return;
      const amount = Number(item.monto) || 0;
      if (item.tipo === "ingreso") ingresos += amount;
      if (item.tipo === "gasto") gastos += amount;
    });
    return { ingresos, gastos, balance: ingresos - gastos };
  }

  function getVariationText(currentValue, previousValue) {
    if (previousValue === 0) {
      if (currentValue === 0) return "0% vs mes anterior";
      return "Sin base comparativa";
    }
    const diffPct =
      ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    const rounded = Math.round(diffPct * 10) / 10;
    const sign = rounded > 0 ? "+" : "";
    return `${sign}${rounded}% vs mes anterior`;
  }

  function formatCurrency(value) {
    const amount = Math.round(Math.abs(Number(value) || 0));
    return `${value < 0 ? "-$" : "$"}${store.formatCOP(amount)}`;
  }

  function setKpiTone(valueEl, value) {
    if (!valueEl) return;
    valueEl.classList.remove("green", "red", "primary");
    if (value > 0) valueEl.classList.add("green");
    else if (value < 0) valueEl.classList.add("red");
    else valueEl.classList.add("primary");
  }

  function getTrendZoom() {
    return TREND_ZOOM_LEVELS[trendZoomIndex];
  }

  function updateZoomUI() {
    const trendZoom = getTrendZoom();
    if (zoomValueLabel)
      zoomValueLabel.textContent = `${Math.round(trendZoom * 100)}%`;
    if (zoomOutBtn) zoomOutBtn.disabled = trendZoomIndex <= 0;
    if (zoomInBtn) {
      zoomInBtn.disabled = trendZoomIndex >= TREND_ZOOM_LEVELS.length - 1;
    }
  }

  function syncTrendScroll(lineSeries, xAxis) {
    if (!lineSeries || !xAxis || lineSeries.dataset.scrollBound) return;

    lineSeries.addEventListener("scroll", () => {
      xAxis.scrollLeft = lineSeries.scrollLeft;
    });

    xAxis.addEventListener("scroll", () => {
      lineSeries.scrollLeft = xAxis.scrollLeft;
    });

    lineSeries.dataset.scrollBound = "1";
  }

  function getTrendDotRadiusPx() {
    const zoom = getTrendZoom();
    return Math.max(6, 8 - Math.log2(zoom + 1) * 0.45);
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

  function mapValueToY(value, maxValue) {
    const denom = Math.max(maxValue, 1);
    const y = 50 - (Math.max(0, value) / denom) * 48;
    return Math.max(2, Math.min(49, y));
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

  function setBarChartYAxis(chartId, maxValue) {
    const yAxis = document.querySelector(`${chartId} .y-axis-labels`);
    if (!yAxis) return;
    const top = getNiceMax(maxValue);
    const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0].map((v) =>
      Math.round(v),
    );
    yAxis.innerHTML = ticks
      .map((v) => `<span>${formatAxisValue(v)}</span>`)
      .join("");
  }

  function renderBarsChart(chartId, entries) {
    const wrap = document.querySelector(`${chartId} .bars-wrap`);
    if (!wrap) return;

    const colors = ["red", "blue", "orange", "green"];
    const safeEntries = entries.length ? entries : [["Sin datos", 0]];
    const max = safeEntries.reduce((acc, [, value]) => Math.max(acc, value), 0);

    wrap.style.setProperty(
      "--bar-count",
      String(Math.max(1, safeEntries.length)),
    );
    wrap.innerHTML = "";
    safeEntries.forEach(([name, value], idx) => {
      const height = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
      const row = document.createElement("div");
      row.className = "bar-group";
      row.innerHTML = `
        <div class="bar-track"><div class="bar ${colors[idx % colors.length]}" style="height:${height}%"></div></div>
        <span class="bar-label">${name}</span>
      `;
      wrap.appendChild(row);
    });

    requestAnimationFrame(() => {
      wrap.querySelectorAll(".bar-label").forEach((label) => {
        const style = window.getComputedStyle(label);
        const lineHeight = parseFloat(style.lineHeight) || 14;
        const lines = Math.round(label.scrollHeight / lineHeight);
        label.classList.toggle("is-multiline", lines > 1);
      });
    });

    setBarChartYAxis(chartId, max);
  }

  function getPieColorForCategory(category) {
    if (!pieColorByCategory[category]) {
      pieColorByCategory[category] =
        PIE_PALETTE[piePaletteIndex % PIE_PALETTE.length];
      piePaletteIndex += 1;
    }
    return pieColorByCategory[category];
  }

  function renderPieChart(gastos) {
    const pieChart = document.querySelector("#chart-distribucion .pie-chart");
    const pieLegend = document.querySelector("#chart-distribucion .pie-legend");
    if (!pieChart || !pieLegend) return;

    const byCategory = {};
    gastos.forEach((g) => {
      const categoria = g.categoria || "Sin categoria";
      byCategory[categoria] =
        (byCategory[categoria] || 0) + Math.max(0, Number(g.monto) || 0);
    });

    const entries = Object.entries(byCategory)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
      pieChart.classList.add("pie-empty");
      pieChart.style.background = "none";
      pieLegend.classList.add("empty");
      pieLegend.classList.remove("single");
      pieLegend.innerHTML = "<span>sin gastos en ninguna categoria</span>";
      return;
    }

    pieChart.classList.remove("pie-empty");
    pieLegend.classList.remove("empty");
    pieLegend.classList.remove("single");

    const total = entries.reduce((acc, [, value]) => acc + value, 0);
    let cursor = 0;
    const segments = entries.map(([name, value], idx) => {
      const color = getPieColorForCategory(name);
      const start = cursor;
      cursor =
        idx === entries.length - 1 ? 100 : cursor + (value / total) * 100;
      return `${color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    pieChart.style.background = `conic-gradient(${segments.join(", ")})`;

    pieLegend.innerHTML = "";
    entries.forEach(([name, value]) => {
      const pct = Math.round((value / total) * 100);
      if (pct <= 0) return;

      const span = document.createElement("span");
      span.style.color = getPieColorForCategory(name);
      span.textContent = `${name} (${pct}%)`;
      pieLegend.appendChild(span);
    });

    if (pieLegend.children.length === 1) {
      pieLegend.classList.add("single");
    }
  }

  function ensureTrendHoverElements(lineSeries, svg) {
    let tooltip = document.getElementById("trend-tooltip-floating");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "trend-tooltip-floating";
      tooltip.className = "trend-tooltip";
      tooltip.classList.add("floating");
      document.body.appendChild(tooltip);
    }

    const staleTooltip = lineSeries.querySelector(".trend-tooltip");
    if (staleTooltip) staleTooltip.remove();

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

    const oldInSvgDot = svg.querySelector(".trend-dot-income");
    const oldOutSvgDot = svg.querySelector(".trend-dot-expense");
    if (oldInSvgDot) oldInSvgDot.remove();
    if (oldOutSvgDot) oldOutSvgDot.remove();

    if (!svg.dataset.hoverBound) {
      svg.addEventListener("mousemove", (e) => {
        if (!trendHoverData || trendHoverData.months.length === 0) return;

        const rect = svg.getBoundingClientRect();
        const relX = Math.max(
          0,
          Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
        );

        let idx = 0;
        let minDist = Number.POSITIVE_INFINITY;
        trendHoverData.xValues.forEach((x, i) => {
          const dist = Math.abs(relX - x);
          if (dist < minDist) {
            minDist = dist;
            idx = i;
          }
        });

        const cx = trendHoverData.xValues[idx];
        const cyIn = trendHoverData.yIngresos[idx];
        const cyOut = trendHoverData.yEgresos[idx];

        const dotRadius = getTrendDotRadiusPx();
        const dotSize = dotRadius * 2;
        const contentX = (cx / 100) * svg.clientWidth;
        const inYPx = (cyIn / 50) * lineSeries.clientHeight;
        const outYPx = (cyOut / 50) * lineSeries.clientHeight;
        const leftPx = contentX - lineSeries.scrollLeft;
        const clampedLeft = Math.max(
          dotRadius,
          Math.min(lineSeries.clientWidth - dotRadius, leftPx),
        );

        inDot.style.width = `${dotSize}px`;
        inDot.style.height = `${dotSize}px`;
        inDot.style.left = `${clampedLeft}px`;
        inDot.style.top = `${Math.max(dotRadius, Math.min(lineSeries.clientHeight - dotRadius, inYPx))}px`;
        inDot.style.display = "block";

        outDot.style.width = `${dotSize}px`;
        outDot.style.height = `${dotSize}px`;
        outDot.style.left = `${clampedLeft}px`;
        outDot.style.top = `${Math.max(dotRadius, Math.min(lineSeries.clientHeight - dotRadius, outYPx))}px`;
        outDot.style.display = "block";

        const month = trendHoverData.months[idx].monthName;
        const inValue = trendHoverData.ingresos[idx];
        const outValue = trendHoverData.egresos[idx];
        tooltip.textContent = `${month} | Ingresos: $${store.formatCOP(inValue)} | Egresos: $${store.formatCOP(outValue)}`;
        tooltip.style.display = "block";

        const xPx = contentX - lineSeries.scrollLeft;
        const yPx =
          ((Math.min(cyIn, cyOut) + 1) / 50) * lineSeries.clientHeight;
        const tipHalf = Math.max(70, tooltip.offsetWidth / 2);
        const left = Math.max(
          tipHalf + 10,
          Math.min(window.innerWidth - tipHalf - 10, e.clientX),
        );
        const lineRect = lineSeries.getBoundingClientRect();
        const top = Math.max(
          14,
          Math.min(window.innerHeight - 14, lineRect.top + yPx - 16),
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

  function renderTrendChart(tx, windowMonths) {
    const trendRoot = document.querySelector("#chart-tendencia");
    if (!trendRoot) return;
    const lineSeries = trendRoot.querySelector(".line-series");
    const svg = lineSeries ? lineSeries.querySelector("svg") : null;
    const xAxis = trendRoot.querySelector(".x-axis-labels-line");
    const xAxisTrack = xAxis ? xAxis.querySelector(".x-axis-track") : null;
    if (!lineSeries || !svg) return;

    if (xAxis) syncTrendScroll(lineSeries, xAxis);

    const keepAllMonths =
      normalizePeriodKey(periodSelect ? periodSelect.value : "") ===
      "este-anio";
    const { months, ingresos, egresos } = computeMonthlyTrend(
      tx,
      windowMonths,
      keepAllMonths,
    );
    const trendZoom = getTrendZoom();
    const horizontalZoom = 1 + (trendZoom - 1) * 0.65;
    const viewportWidth = Math.max(lineSeries.clientWidth, 1);
    const contentWidth = Math.max(
      viewportWidth,
      Math.round(viewportWidth * horizontalZoom),
    );
    svg.style.width = `${contentWidth}px`;
    svg.style.minWidth = `${contentWidth}px`;
    if (xAxisTrack) {
      xAxisTrack.style.width = `${contentWidth}px`;
      xAxisTrack.style.minWidth = `${contentWidth}px`;
    }
    const maxValue = Math.max(...ingresos, ...egresos, 0);
    const chartMax = getNiceMax(Math.max(1, (maxValue * 1.1) / trendZoom));
    const xValues = months.map((_, i) =>
      months.length === 1 ? 50 : (i / (months.length - 1)) * 98,
    );
    const yIngresos = ingresos.map((v) => mapValueToY(v, chartMax));
    const yEgresos = egresos.map((v) => mapValueToY(v, chartMax));
    trendHoverData = {
      months,
      ingresos,
      egresos,
      xValues,
      yIngresos,
      yEgresos,
    };

    ensureTrendHoverElements(lineSeries, svg);

    const lines = trendRoot.querySelectorAll("svg polyline");
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

    if (xAxisTrack) {
      xAxisTrack.innerHTML = months
        .map((m) => `<span>${m.monthName.slice(0, 3)}</span>`)
        .join("");
      xAxis.classList.toggle("single-point", months.length === 1);
      if (trendZoom <= 1.01) {
        lineSeries.scrollLeft = 0;
        xAxis.scrollLeft = 0;
      }
    }

    const yAxis = trendRoot.querySelector(".y-axis-labels");
    if (yAxis) {
      const top = chartMax;
      const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0].map((v) =>
        Math.round(v),
      );
      yAxis.innerHTML = ticks
        .map((v) => `<span>${formatAxisValue(v)}</span>`)
        .join("");
    }
  }

  function render() {
    const state = store.getState();
    const selectedMonthIndex = getSelectedMonthIndex();
    const selectedMonthName = MONTHS[selectedMonthIndex];
    const selectedYear = new Date().getFullYear();
    const periodKey = normalizePeriodKey(
      periodSelect ? periodSelect.value : "",
    );
    const periodLabel = periodSelect ? periodSelect.value : "Este mes";
    const windowMonths = getTrendWindow(periodKey, selectedMonthIndex);
    const windowKeys = new Set(
      windowMonths.map((slot) => monthKey(slot.year, slot.monthIndex)),
    );
    const mode = window.ClanLedgerModeManager?.getMode?.() || "familiar";
    const memberChartArticle = document
      .querySelector("#chart-miembros")
      ?.closest("article");
    if (memberChartArticle) {
      memberChartArticle.style.display = mode === "personal" ? "none" : "";
    }
    const member =
      mode === "personal"
        ? "Todos"
        : memberSelect
          ? memberSelect.value
          : "Todos";
    const tx = state.transactions.filter(
      (item) => member === "Todos" || item.miembro === member,
    );
    const txInWindow = tx.filter((item) => {
      const d = parseTxDate(item);
      if (!d) return false;
      return windowKeys.has(monthKey(d.getFullYear(), d.getMonth()));
    });
    const gastos = tx.filter((item) => item.tipo === "gasto");
    const periodIngresos = txInWindow
      .filter((item) => item.tipo === "ingreso")
      .reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
    const periodGastos = txInWindow
      .filter((item) => item.tipo === "gasto")
      .reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
    const monthCurrent = getMonthSummary(tx, selectedYear, selectedMonthIndex);
    const previousMonth = addMonthOffset(selectedYear, selectedMonthIndex, -1);
    const monthPrev = getMonthSummary(
      tx,
      previousMonth.year,
      previousMonth.monthIndex,
    );
    const accountSavings = (state.accounts || []).reduce(
      (acc, account) => acc + (Number(account.balance) || 0),
      0,
    );

    renderTrendChart(tx, windowMonths);

    const kpiAhorro = document.querySelector("#kpi-ahorro .kpi-value");
    const kpiIngresos = document.querySelector("#kpi-ingresos .kpi-value");
    const kpiBalanceNeto = document.querySelector(
      "#kpi-balance-neto .kpi-value",
    );
    const kpiBalanceMensual = document.querySelector(
      "#kpi-balance-mensual .kpi-value",
    );
    const kpiIngresosLabel = document.querySelector("#kpi-ingresos .kpi-label");
    const kpiIngresosNote = document.querySelector("#kpi-ingresos .kpi-note");
    const kpiBalanceNetoNote = document.querySelector(
      "#kpi-balance-neto .kpi-note",
    );
    const kpiBalanceMensualNote = document.querySelector(
      "#kpi-balance-mensual .kpi-note",
    );

    if (kpiAhorro) kpiAhorro.textContent = formatCurrency(accountSavings);
    if (kpiIngresosLabel)
      kpiIngresosLabel.textContent = `Ingresos (${selectedMonthName})`;
    if (kpiIngresos) {
      kpiIngresos.textContent = formatCurrency(monthCurrent.ingresos);
      setKpiTone(kpiIngresos, monthCurrent.ingresos);
    }
    if (kpiIngresosNote) {
      kpiIngresosNote.textContent = getVariationText(
        monthCurrent.ingresos,
        monthPrev.ingresos,
      );
    }
    if (kpiBalanceNeto) {
      const netoPeriodo = periodIngresos - periodGastos;
      kpiBalanceNeto.textContent = formatCurrency(netoPeriodo);
      setKpiTone(kpiBalanceNeto, netoPeriodo);
    }
    if (kpiBalanceNetoNote)
      kpiBalanceNetoNote.textContent = `Periodo seleccionado: ${periodLabel}`;
    if (kpiBalanceMensual) {
      kpiBalanceMensual.textContent = formatCurrency(monthCurrent.balance);
      setKpiTone(kpiBalanceMensual, monthCurrent.balance);
    }
    if (kpiBalanceMensualNote) {
      kpiBalanceMensualNote.textContent = getVariationText(
        monthCurrent.balance,
        monthPrev.balance,
      );
    }

    const ingresosCount = tx.filter((item) => item.tipo === "ingreso").length;
    const gastosCount = tx.filter((item) => item.tipo === "gasto").length;

    const totalTxEl = document.querySelector(
      "#kpi-total-transacciones .stat-value",
    );
    const ingresoTxEl = document.querySelector(
      "#kpi-transacciones-ingreso .stat-value",
    );
    const gastoTxEl = document.querySelector(
      "#kpi-transacciones-gasto .stat-value",
    );
    if (totalTxEl) totalTxEl.textContent = String(tx.length);
    if (ingresoTxEl) ingresoTxEl.textContent = String(ingresosCount);
    if (gastoTxEl) gastoTxEl.textContent = String(gastosCount);

    const byCategory = {};
    gastos.forEach((g) => {
      byCategory[g.categoria] =
        (byCategory[g.categoria] || 0) + (Number(g.monto) || 0);
    });
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    renderBarsChart("#chart-top-categorias", topCategories);

    if (mode !== "personal") {
      const gastosAllMembers = state.transactions.filter(
        (item) => item.tipo === "gasto",
      );
      const byMember = {};
      gastosAllMembers.forEach((g) => {
        byMember[g.miembro] =
          (byMember[g.miembro] || 0) + (Number(g.monto) || 0);
      });
      const topMembers = Object.entries(byMember)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      renderBarsChart("#chart-miembros", topMembers);
    }

    renderPieChart(gastos);
  }

  if (!window.__clanledgerReportesBound) {
    if (periodSelect) periodSelect.addEventListener("change", render);
    if (monthAnalysisSelect)
      monthAnalysisSelect.addEventListener("change", render);
    if (memberSelect) memberSelect.addEventListener("change", render);
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => {
        trendZoomIndex = Math.max(0, trendZoomIndex - 1);
        updateZoomUI();
        render();
      });
    }
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => {
        trendZoomIndex = Math.min(
          TREND_ZOOM_LEVELS.length - 1,
          trendZoomIndex + 1,
        );
        updateZoomUI();
        render();
      });
    }
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".report-custom-select")) {
        closeAllCustomSelects();
      }
    });
    window.__clanledgerReportesBound = true;
  }
  initializeCustomSelects();
  updateZoomUI();
  render();
}

document.addEventListener("DOMContentLoaded", renderReportesPage);
window.addEventListener("clanledger:mode-change", () => {
  const store = window.ClanLedgerStore;
  if (store && typeof store.reloadForCurrentMode === "function") {
    store.reloadForCurrentMode();
  }
  renderReportesPage();
});
