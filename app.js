// Expense Tracker - External JS
(function() {
  const STORAGE_KEY = 'et_transactions_v1';

  /** @typedef {{ id: string, title: string, amount: number }} Transaction */

  /** @type {Transaction[]} */
  let transactions = [];

  // DOM Elements
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const listEl = document.getElementById('list');
  const undoBar = document.getElementById('undo');
  const undoBtn = document.getElementById('undo-btn');
  const form = document.getElementById('transaction-form');
  const titleInput = document.getElementById('title');
  // radios for type
  const typeIncome = document.getElementById('type-income');
  const typeExpense = document.getElementById('type-expense');
  const amountInput = document.getElementById('amount');
  const errorEl = document.getElementById('form-error');
  const resetBtn = document.getElementById('reset-btn');

  // Utilities
  const nf = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const formatCurrency = (num) => nf.format(num);

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); } catch (_) {}
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data.filter(x => typeof x?.title === 'string' && typeof x?.amount === 'number' && typeof x?.id === 'string');
      }
    } catch (_) {}
    return [];
  };

  const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const computeTotals = (list) => {
    let income = 0, expense = 0;
    for (const t of list) {
      if (t.amount >= 0) income += t.amount; else expense += Math.abs(t.amount);
    }
    return { income, expense, balance: income - expense };
  };

  const renderSummary = () => {
    const { income, expense, balance } = computeTotals(transactions);
    balanceEl.textContent = formatCurrency(balance);
    incomeEl.textContent = `+${formatCurrency(income).replace('-', '')}`;
    expenseEl.textContent = `-${formatCurrency(expense).replace('-', '')}`;
  };

  const createItemElement = (tx) => {
    const row = document.createElement('div');
    row.className = 'item adding';
    row.dataset.id = tx.id;

    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = tx.title;

    const amount = document.createElement('div');
    amount.className = `amount ${tx.amount >= 0 ? 'positive' : 'negative'}`;
    amount.textContent = formatCurrency(tx.amount);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.type = 'button';
    del.setAttribute('aria-label', `Delete ${tx.title}`);
    del.textContent = 'Delete';
    del.addEventListener('click', () => removeTransaction(tx.id, row));

    row.appendChild(title);
    row.appendChild(amount);
    row.appendChild(del);

    row.addEventListener('animationend', (e) => {
      if (e.animationName === 'slideIn') row.classList.remove('adding');
    }, { once: true });

    return row;
  };

  const renderList = () => {
    listEl.innerHTML = '';
    if (transactions.length === 0) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const tx of transactions) fragment.appendChild(createItemElement(tx));
    listEl.appendChild(fragment);
  };

  const addTransaction = (title, amount) => {
    /** @type {Transaction} */
    const tx = { id: uid(), title: title.trim(), amount };
    transactions.unshift(tx);
    save();
    renderSummary();
    if (transactions.length === 1) {}
    const node = createItemElement(tx);
    listEl.prepend(node);
  };

  let undoTimer = null;
  let lastDeleted = null;

  const removeTransaction = (id, node) => {
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return;
    node.classList.add('removing');
    node.addEventListener('animationend', () => {
      lastDeleted = { item: transactions[index], index };
      transactions.splice(index, 1);
      save();
      renderSummary();
      node.remove();
      if (undoBar) {
        undoBar.style.display = '';
        clearTimeout(undoTimer);
        undoTimer = setTimeout(() => { undoBar.style.display = 'none'; lastDeleted = null; }, 5000);
      }
    }, { once: true });
  };

  undoBtn?.addEventListener('click', () => {
    if (!lastDeleted) return;
    const { item, index } = lastDeleted;
    transactions.splice(Math.min(index, transactions.length), 0, item);
    save();
    renderSummary();
    renderList();
    if (undoBar) undoBar.style.display = 'none';
    clearTimeout(undoTimer);
    lastDeleted = null;
  });

  const setError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = msg ? '' : 'none';
  };

  // Add a subtle bump animation to the selected segment when toggling
  const bumpSelectedSegment = () => {
    const selectedLabel = (typeExpense?.checked
      ? document.querySelector('label[for="type-expense"]')
      : document.querySelector('label[for="type-income"]'));
    if (!selectedLabel) return;
    selectedLabel.classList.remove('seg-bump');
    void selectedLabel.offsetWidth; // restart animation
    selectedLabel.classList.add('seg-bump');
  };

  typeIncome?.addEventListener('change', bumpSelectedSegment);
  typeExpense?.addEventListener('change', bumpSelectedSegment);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setError('');
    const title = String(titleInput.value || '').trim();
    const amountRaw = String(amountInput.value || '').trim();
    if (!title) return setError('Please enter a transaction title.');
    if (amountRaw === '') return setError('Please enter an amount.');
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount)) return setError('Amount must be a valid number.');
    if (amount < 0) return setError('Please enter a positive amount.');
    if (amount > 1000000) return setError('Amount is too large.');
    const type = (typeExpense?.checked ? 'expense' : 'income');
    const signedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    addTransaction(title, signedAmount);
    form.reset();
    titleInput.focus();
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('This will clear all transactions. Continue?')) return;
    transactions = [];
    save();
    renderSummary();
    listEl.innerHTML = '';
    
    setError('');
  });

  // Init
  transactions = load();
  renderSummary();
  renderList();
})();

// Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

