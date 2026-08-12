const form = document.getElementById('moneyForm');
const fields = ['bank', 'ecocash', 'innbucks', 'cash', 'savings', 'debt', 'bills'];

// Load saved data on page open
window.addEventListener('DOMContentLoaded', () => {
  fields.forEach(id => {
    const saved = localStorage.getItem('mova_' + id);
    if (saved) document.getElementById(id).value = saved;
  });
  calculate();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  fields.forEach(id => {
    const val = document.getElementById(id).value || 0;
    localStorage.setItem('mova_' + id, val);
  });
  calculate();
});

function calculate() {
  const num = id => parseFloat(document.getElementById(id).value) || 0;

  const totalAvailable = num('bank') + num('ecocash') + num('innbucks') + num('cash');
  const safeToSpend = totalAvailable - num('bills') - num('debt');

  document.getElementById('totalAvailable').textContent = `$${totalAvailable.toFixed(2)}`;
  document.getElementById('safeToSpend').textContent = `$${Math.max(safeToSpend, 0).toFixed(2)}`;
  document.getElementById('obligationsOut').textContent = `$${num('bills').toFixed(2)}`;
  document.getElementById('savingsOut').textContent = `$${num('savings').toFixed(2)}`;
  document.getElementById('debtOut').textContent = `$${num('debt').toFixed(2)}`;
}
