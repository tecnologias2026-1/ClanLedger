document.addEventListener("DOMContentLoaded", () => {
  const store = window.ClanLedgerStore;
  if (!store) return;

  const periodSelect = document.getElementById("filter-periodo");
  const memberSelect = document.getElementById("filter-miembro");

  if (memberSelect) {
    const state = store.getState();
    memberSelect.innerHTML = "<option>Todos</option>";
    state.members.forEach((m) => {
      const op = document.createElement("option");
      op.textContent = m.name;
      memberSelect.appendChild(op);
    });
  }

  function getMonthFromPeriod() {
    if (!periodSelect) return store.getCurrentMonthName();
    const raw = (periodSelect.value || "").toLowerCase();
    if (raw.includes("mes")) return store.getCurrentMonthName();
    return store.getCurrentMonthName();
  }

  function render() {
    const state = store.getState();
    const monthName = getMonthFromPeriod();
    const member = memberSelect ? memberSelect.value : "Todos";
    const f = store.computeFinancials({ monthName, member });
    const tx = state.transactions.filter(
      (item) => member === "Todos" || item.miembro === member,
    );
    const gastos = tx.filter((item) => item.tipo === "gasto");

    const kpiAhorro = document.querySelector("#kpi-ahorro .kpi-value");
    const kpiIngresos = document.querySelector("#kpi-ingresos .kpi-value");
    const kpiBalanceNeto = document.querySelector(
      "#kpi-balance-neto .kpi-value",
    );
    const kpiBalanceMensual = document.querySelector(
      "#kpi-balance-mensual .kpi-value",
    );

    if (kpiAhorro)
      kpiAhorro.textContent = `$${store.formatCOP(f.ahorroAcumulado)}`;
    if (kpiIngresos)
      kpiIngresos.textContent = `$${store.formatCOP(f.ingresosMes)}`;
    if (kpiBalanceNeto)
      kpiBalanceNeto.textContent = `$${store.formatCOP(f.gastosMes)}`;
    if (kpiBalanceMensual)
      kpiBalanceMensual.textContent = `$${store.formatCOP(f.balanceMensual)}`;

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

    const categoryBarsWrap = document.querySelector(
      "#chart-top-categorias .bars-wrap",
    );
    if (categoryBarsWrap) {
      const byCategory = {};
      gastos.forEach((g) => {
        byCategory[g.categoria] =
          (byCategory[g.categoria] || 0) + (Number(g.monto) || 0);
      });
      const entries = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const max = entries.length ? entries[0][1] : 1;
      const colors = ["red", "blue", "orange", "green"];

      categoryBarsWrap.innerHTML = "";
      entries.forEach(([name, value], idx) => {
        const height = Math.max(8, Math.round((value / max) * 100));
        const row = document.createElement("div");
        row.className = "bar-group";
        row.innerHTML = `
          <div class="bar-track"><div class="bar ${colors[idx % colors.length]}" style="height:${height}%"></div></div>
          <span class="bar-label">${name}</span>
        `;
        categoryBarsWrap.appendChild(row);
      });
    }

    const memberBarsWrap = document.querySelector("#chart-miembros .bars-wrap");
    if (memberBarsWrap) {
      const byMember = {};
      gastos.forEach((g) => {
        byMember[g.miembro] =
          (byMember[g.miembro] || 0) + (Number(g.monto) || 0);
      });
      const entries = Object.entries(byMember)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const max = entries.length ? entries[0][1] : 1;
      const colors = ["red", "blue", "orange", "green"];

      memberBarsWrap.innerHTML = "";
      entries.forEach(([name, value], idx) => {
        const height = Math.max(8, Math.round((value / max) * 100));
        const row = document.createElement("div");
        row.className = "bar-group";
        row.innerHTML = `
          <div class="bar-track"><div class="bar ${colors[idx % colors.length]}" style="height:${height}%"></div></div>
          <span class="bar-label">${name}</span>
        `;
        memberBarsWrap.appendChild(row);
      });
    }

    const pieLegend = document.querySelector("#chart-distribucion .pie-legend");
    if (pieLegend) {
      const byCategory = {};
      gastos.forEach((g) => {
        byCategory[g.categoria] =
          (byCategory[g.categoria] || 0) + (Number(g.monto) || 0);
      });
      const entries = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      const total = entries.reduce((acc, [, value]) => acc + value, 0) || 1;

      pieLegend.innerHTML = "";
      entries.forEach(([name, value]) => {
        const span = document.createElement("span");
        const pct = Math.round((value / total) * 100);
        span.textContent = `${name} (${pct}%)`;
        pieLegend.appendChild(span);
      });
    }
  }

  if (periodSelect) periodSelect.addEventListener("change", render);
  if (memberSelect) memberSelect.addEventListener("change", render);
  render();
});
