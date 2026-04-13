document.addEventListener("DOMContentLoaded", () => {
  const store = window.ClanLedgerStore;
  if (!store) return;

  const state = store.getState();
  const monthName = store.getCurrentMonthName();
  const f = store.computeFinancials({ monthName });
  const expenseTx = state.transactions.filter((t) => t.tipo === "gasto");

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

  const categoryBarsWrap = document.querySelector(".bar-chart .bars-wrap");
  if (categoryBarsWrap) {
    const byCategory = {};
    expenseTx.forEach((tx) => {
      byCategory[tx.categoria] =
        (byCategory[tx.categoria] || 0) + (Number(tx.monto) || 0);
    });
    const entries = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const max = entries.length ? entries[0][1] : 1;
    const colors = ["red", "blue", "orange", "green"];

    categoryBarsWrap.innerHTML = "";
    entries.forEach(([name, value], idx) => {
      const pct = Math.max(8, Math.round((value / max) * 100));
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `
        <div class="bar-track"><div class="bar ${colors[idx % colors.length]}" style="height:${pct}%"></div></div>
        <span class="bar-label">${name}</span>
      `;
      categoryBarsWrap.appendChild(group);
    });
  }

  const memberLegendItems = document.querySelectorAll(".pie-legend-item");
  if (memberLegendItems.length >= 4) {
    const byMember = {};
    expenseTx.forEach((tx) => {
      byMember[tx.miembro] =
        (byMember[tx.miembro] || 0) + (Number(tx.monto) || 0);
    });
    const entries = Object.entries(byMember)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

    memberLegendItems.forEach((item, idx) => {
      const data = entries[idx];
      if (!data) {
        item.style.display = "none";
        return;
      }
      item.style.display = "";
      const [name, value] = data;
      const pct = Math.round((value / total) * 100);
      const nameEl = item.querySelector(".pie-legend-name");
      const valueEl = item.querySelector(".pie-legend-value");
      if (nameEl) nameEl.textContent = `${name} (${pct}%)`;
      if (valueEl) valueEl.textContent = `$${store.formatCOP(value)}`;
    });
  }
});
