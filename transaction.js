const TXN_KEY = 'mova_transactions';

function loadTransactions() {
  return JSON.parse(localStorage.getItem(TXN_KEY) || '[]');
}

function saveTransactions(txns) {
  localStorage.setItem(TXN_KEY, JSON.stringify(txns));
}

function addTransactionToList(e) {
  e.preventDefault();
  const txns = loadTransactions();
  txns.unshift({
    id: Date.now(),
    type: document.getElementById('txnType').value,
    amount: parseFloat(document.getElementById('txnAmount').value) || 0,
    category: document.getElementById('txnCategory').value,
    account: document.getElementById('txnAccount').value,
    note: document.getElementById('txnNote').value,
    date: new Date().toISOString()
  });
  saveTransactions(txns);
  document.getElementById('txnForm').reset();
  renderTransactions();
  renderChart();
}

function deleteTransaction(id) {
  const txns = loadTransactions().filter(t => t.id !== id);
  saveTransactions(txns);
  renderTransactions();
  renderChart();
}

function renderTransactions() {
  const txns = loadTransactions();
  const list = document.getElementById('txnList');
  list.innerHTML = '';

  if (txns.length === 0) {
    list.innerHTML = '<li>No transactions yet.</li>';
    return;
  }

  txns.slice(0, 20).forEach(t => {
    const li = document.createElement('li');
    const sign = t.type === 'expense' ? '-' : '+';
    const dateStr = new Date(t.date).toLocaleDateString();
    li.innerHTML = `
      <div>
        <div>${t.category} — ${t.account}</div>
        <div class="txn-meta">${t.note || ''} · ${dateStr}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="txn-amount ${t.type}">${sign}$${t.amount.toFixed(2)}</span>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})">✕</button>
      </div>`;
    list.appendChild(li);
  });
}

let chartInstance = null;
function renderChart() {
  const txns = loadTransactions().filter(t => t.type === 'expense');
  const totals = {};
  txns.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const ctx = document.getElementById('spendChart');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: 'Spending ($)',
        data: Object.values(totals),
        backgroundColor: '#22c55e'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' } }
      }
    }
  });
}

document.getElementById('txnForm').addEventListener('submit', addTransactionToList);

window.addEventListener('DOMContentLoaded', () => {
  renderTransactions();
  renderChart();
});
