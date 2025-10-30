// Enhanced Expense Tracker with Dashboard System
(function() {
  const STORAGE_KEY = 'et_transactions_v1';
  const CATEGORIES_KEY = 'et_categories_v1';
  const SETTINGS_KEY = 'et_settings_v1';

  /** @typedef {{ id: string, title: string, amount: number, category: string, date: string }} Transaction */

  /** @type {Transaction[]} */
  let transactions = [];
  let currentRoute = 'dashboard';

  // Default categories
  const defaultCategories = {
    food: { name: 'Food & Dining', icon: '🍽️', color: '#f59e0b' },
    transport: { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    shopping: { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    entertainment: { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
    bills: { name: 'Bills & Utilities', icon: '💡', color: '#ef4444' },
    health: { name: 'Health & Fitness', icon: '🏥', color: '#10b981' },
    salary: { name: 'Salary', icon: '💰', color: '#059669' },
    freelance: { name: 'Freelance', icon: '💼', color: '#0891b2' },
    investment: { name: 'Investment', icon: '📈', color: '#7c3aed' },
    other: { name: 'Other', icon: '📝', color: '#6b7280' }
  };

  // DOM Elements
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const listEl = document.getElementById('list');
  const undoBar = document.getElementById('undo');
  const undoBtn = document.getElementById('undo-btn');
  const form = document.getElementById('transaction-form');
  const titleInput = document.getElementById('title');
  const categoryInput = document.getElementById('category');
  const typeIncome = document.getElementById('type-income');
  const typeExpense = document.getElementById('type-expense');
  const amountInput = document.getElementById('amount');
  const errorEl = document.getElementById('form-error');
  const resetBtn = document.getElementById('reset-btn');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-item');
  const screens = document.querySelectorAll('.screen');

  // Dashboard elements
  const recentTransactionsEl = document.getElementById('recent-transactions');
  const categoryChartEl = document.getElementById('category-chart');
  const trendChartEl = document.getElementById('trend-chart');
  const monthTotalEl = document.getElementById('month-total');
  const avgTransactionEl = document.getElementById('avg-transaction');
  const totalCountEl = document.getElementById('total-count');
  const categoriesListEl = document.getElementById('categories-list');

  // Settings elements
  const themeToggle = document.getElementById('theme-toggle');
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');

  // Modal elements
  const deleteModalOverlay = document.getElementById('delete-modal-overlay');
  const deleteModal = document.getElementById('delete-modal');
  const deleteModalTitle = document.getElementById('delete-modal-title');
  const deleteModalMessage = document.getElementById('delete-modal-message');
  const deleteModalCancel = document.getElementById('delete-modal-cancel');
  const deleteModalConfirm = document.getElementById('delete-modal-confirm');
  
  const resetModalOverlay = document.getElementById('reset-modal-overlay');
  const resetModal = document.getElementById('reset-modal');
  const resetModalCancel = document.getElementById('reset-modal-cancel');
  const resetModalConfirm = document.getElementById('reset-modal-confirm');

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

  const saveSettings = (settings) => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
  };

  const loadSettings = () => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { theme: 'light', currency: 'USD' };
  };

  const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const computeTotals = (list) => {
    let income = 0, expense = 0;
    for (const t of list) {
      if (t.amount >= 0) income += t.amount; else expense += Math.abs(t.amount);
    }
    return { income, expense, balance: income - expense };
  };

  // Modal utilities
  const showModal = (overlay, modal) => {
    overlay.classList.add('show');
    modal.classList.add('fade-in');
    modal.classList.remove('fade-out');
    document.body.style.overflow = 'hidden';
  };

  const hideModal = (overlay, modal) => {
    modal.classList.add('fade-out');
    modal.classList.remove('fade-in');
    setTimeout(() => {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }, 360); // Match transition duration
  };

  const showDeleteModal = (title, message, onConfirm) => {
    if (deleteModalTitle) deleteModalTitle.textContent = title;
    if (deleteModalMessage) deleteModalMessage.textContent = message;
    
    const handleConfirm = () => {
      hideModal(deleteModalOverlay, deleteModal);
      onConfirm();
      cleanup();
    };
    
    const handleCancel = () => {
      hideModal(deleteModalOverlay, deleteModal);
      cleanup();
    };
    
    const handleOverlayClick = (e) => {
      if (e.target === deleteModalOverlay) {
        handleCancel();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    const cleanup = () => {
      deleteModalConfirm?.removeEventListener('click', handleConfirm);
      deleteModalCancel?.removeEventListener('click', handleCancel);
      deleteModalOverlay?.removeEventListener('click', handleOverlayClick);
      document.removeEventListener('keydown', handleEscape);
    };
    
    deleteModalConfirm?.addEventListener('click', handleConfirm);
    deleteModalCancel?.addEventListener('click', handleCancel);
    deleteModalOverlay?.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleEscape);
    
    showModal(deleteModalOverlay, deleteModal);
  };

  const showResetModal = (onConfirm) => {
    const handleConfirm = () => {
      hideModal(resetModalOverlay, resetModal);
      onConfirm();
      cleanup();
    };
    
    const handleCancel = () => {
      hideModal(resetModalOverlay, resetModal);
      cleanup();
    };
    
    const handleOverlayClick = (e) => {
      if (e.target === resetModalOverlay) {
        handleCancel();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    const cleanup = () => {
      resetModalConfirm?.removeEventListener('click', handleConfirm);
      resetModalCancel?.removeEventListener('click', handleCancel);
      resetModalOverlay?.removeEventListener('click', handleOverlayClick);
      document.removeEventListener('keydown', handleEscape);
    };
    
    resetModalConfirm?.addEventListener('click', handleConfirm);
    resetModalCancel?.addEventListener('click', handleCancel);
    resetModalOverlay?.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleEscape);
    
    showModal(resetModalOverlay, resetModal);
  };

  // Routing System
  const router = {
    navigate: (route) => {
      if (currentRoute === route) return;
      
      // Update active states
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.route === route);
      });

      // Show/hide screens
      screens.forEach(screen => {
        screen.classList.toggle('active', screen.id === `${route}-screen`);
      });

      currentRoute = route;
      
      // Update content based on route
      switch (route) {
        case 'dashboard':
          renderDashboard();
          break;
        case 'transactions':
          renderTransactions();
          break;
        case 'categories':
          renderCategories();
          break;
        case 'budgets':
          renderBudgets();
          break;
        case 'reports':
          renderReports();
          break;
        case 'settings':
          renderSettings();
          break;
      }

      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 768) {
        sidebar?.classList.remove('open');
      }
    }
  };

  // Render Functions
  const renderSummary = () => {
    const { income, expense, balance } = computeTotals(transactions);
    if (balanceEl) balanceEl.textContent = formatCurrency(balance);
    if (incomeEl) incomeEl.textContent = `+${formatCurrency(income).replace('-', '')}`;
    if (expenseEl) expenseEl.textContent = `-${formatCurrency(expense).replace('-', '')}`;
  };

  const renderDashboard = () => {
    renderSummary();
    renderRecentTransactions();
    renderCategoryChart();
    renderTrendChart();
    renderQuickStats();
  };

  const renderRecentTransactions = () => {
    if (!recentTransactionsEl) return;
    
    const recent = transactions.slice(0, 5);
    if (recent.length === 0) {
      recentTransactionsEl.innerHTML = '<div class="chart-placeholder">No transactions yet</div>';
      return;
    }

    const html = recent.map(tx => `
      <div class="recent-item">
        <div class="recent-item-title">${tx.title}</div>
        <div class="recent-item-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(tx.amount)}
        </div>
      </div>
    `).join('');

    recentTransactionsEl.innerHTML = html;
  };

  const renderCategoryChart = () => {
    if (!categoryChartEl) return;
    
    const categoryTotals = {};
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only expenses
        const category = tx.category || 'other';
        categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(tx.amount);
      }
    });

    const categories = Object.entries(categoryTotals);
    if (categories.length === 0) {
      categoryChartEl.innerHTML = '<div class="chart-placeholder">Add expenses to see category breakdown</div>';
      return;
    }

    const total = categories.reduce((sum, [, amount]) => sum + amount, 0);
    const html = categories
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        const categoryInfo = defaultCategories[category] || defaultCategories.other;
        return `
          <div class="category-item" style="border-left: 4px solid ${categoryInfo.color}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>${categoryInfo.icon} ${categoryInfo.name}</span>
              <span>${formatCurrency(amount)} (${percentage}%)</span>
            </div>
          </div>
        `;
      }).join('');

    categoryChartEl.innerHTML = html;
  };

  const renderTrendChart = () => {
    if (!trendChartEl) return;
    
    if (transactions.length === 0) {
      trendChartEl.innerHTML = '<div class="chart-placeholder">Add transactions to see trends</div>';
      return;
    }

    // Simple trend visualization
    const last7Days = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = 0;
    }

    transactions.forEach(tx => {
      const txDate = tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0];
      if (last7Days.hasOwnProperty(txDate) && tx.amount < 0) {
        last7Days[txDate] += Math.abs(tx.amount);
      }
    });

    const maxAmount = Math.max(...Object.values(last7Days), 1);
    const html = Object.entries(last7Days).map(([date, amount]) => {
      const height = (amount / maxAmount) * 100;
      const dayName = new Date(date).toLocaleDateString('en', { weekday: 'short' });
      return `
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <div style="height: 60px; display: flex; align-items: end;">
            <div style="width: 20px; background: var(--accent); height: ${height}%; min-height: 2px; border-radius: 2px;"></div>
          </div>
          <small style="margin-top: 4px; font-size: 11px;">${dayName}</small>
        </div>
      `;
    }).join('');

    trendChartEl.innerHTML = `<div style="display: flex; gap: 8px; height: 80px;">${html}</div>`;
  };

  const renderQuickStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date || Date.now());
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const monthTotal = monthTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const avgTransaction = transactions.length > 0 ? 
      transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length : 0;

    if (monthTotalEl) monthTotalEl.textContent = formatCurrency(monthTotal);
    if (avgTransactionEl) avgTransactionEl.textContent = formatCurrency(avgTransaction);
    if (totalCountEl) totalCountEl.textContent = transactions.length.toString();
  };

  const renderTransactions = () => {
    renderSummary();
    renderList();
  };

  const renderCategories = () => {
    if (!categoriesListEl) return;
    
    const categoryTotals = {};
    transactions.forEach(tx => {
      const category = tx.category || 'other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { income: 0, expense: 0, count: 0 };
      }
      if (tx.amount >= 0) {
        categoryTotals[category].income += tx.amount;
      } else {
        categoryTotals[category].expense += Math.abs(tx.amount);
      }
      categoryTotals[category].count++;
    });

    const html = Object.entries(defaultCategories).map(([key, category]) => {
      const totals = categoryTotals[key] || { income: 0, expense: 0, count: 0 };
      return `
        <div class="category-item">
          <div style="font-size: 24px; margin-bottom: 8px;">${category.icon}</div>
          <h4 style="margin: 0 0 8px 0;">${category.name}</h4>
          <div style="font-size: 12px; color: var(--muted);">
            <div>Income: ${formatCurrency(totals.income)}</div>
            <div>Expenses: ${formatCurrency(totals.expense)}</div>
            <div>Transactions: ${totals.count}</div>
          </div>
        </div>
      `;
    }).join('');

    categoriesListEl.innerHTML = html;
  };

  const renderBudgets = () => {
    // Placeholder for budget functionality
  };

  const renderReports = () => {
    // Placeholder for reports functionality
  };

  const renderSettings = () => {
    const settings = loadSettings();
    if (themeToggle) {
      themeToggle.checked = settings.theme === 'dark';
    }
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
    del.addEventListener('click', () => {
      showDeleteModal(
        'Delete Transaction?',
        `Are you sure you want to delete "${tx.title}"? This action cannot be undone.`,
        () => removeTransaction(tx.id, row)
      );
    });

    row.appendChild(title);
    row.appendChild(amount);
    row.appendChild(del);

    row.addEventListener('animationend', (e) => {
      if (e.animationName === 'slideIn') row.classList.remove('adding');
    }, { once: true });

    return row;
  };

  const renderList = () => {
    if (!listEl) return;
    
    listEl.innerHTML = '';
    if (transactions.length === 0) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const tx of transactions) fragment.appendChild(createItemElement(tx));
    listEl.appendChild(fragment);
  };

  const addTransaction = (title, amount, category = 'other') => {
    /** @type {Transaction} */
    const tx = { 
      id: uid(), 
      title: title.trim(), 
      amount, 
      category,
      date: new Date().toISOString()
    };
    transactions.unshift(tx);
    save();
    
    // Update current screen
    if (currentRoute === 'dashboard') {
      renderDashboard();
    } else if (currentRoute === 'transactions') {
      renderTransactions();
    }
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
      
      // Update current screen
      if (currentRoute === 'dashboard') {
        renderDashboard();
      } else if (currentRoute === 'transactions') {
        renderSummary();
      }
      
      node.remove();
      if (undoBar) {
        undoBar.style.display = '';
        clearTimeout(undoTimer);
        undoTimer = setTimeout(() => { undoBar.style.display = 'none'; lastDeleted = null; }, 5000);
      }
    }, { once: true });
  };

  const setError = (msg) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = msg ? '' : 'none';
  };

  // Event Listeners
  
  // Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      if (route) {
        router.navigate(route);
        window.location.hash = route;
      }
    });
  });

  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
      if (!sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Undo functionality
  undoBtn?.addEventListener('click', () => {
    if (!lastDeleted) return;
    const { item, index } = lastDeleted;
    transactions.splice(Math.min(index, transactions.length), 0, item);
    save();
    
    // Update current screen
    if (currentRoute === 'dashboard') {
      renderDashboard();
    } else if (currentRoute === 'transactions') {
      renderTransactions();
    }
    
    if (undoBar) undoBar.style.display = 'none';
    clearTimeout(undoTimer);
    lastDeleted = null;
  });

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

  // Form submission
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    setError('');
    const title = String(titleInput?.value || '').trim();
    const amountRaw = String(amountInput?.value || '').trim();
    const category = categoryInput?.value || 'other';
    
    if (!title) return setError('Please enter a transaction title.');
    if (amountRaw === '') return setError('Please enter an amount.');
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount)) return setError('Amount must be a valid number.');
    if (amount < 0) return setError('Please enter a positive amount.');
    if (amount > 1000000) return setError('Amount is too large.');
    const type = (typeExpense?.checked ? 'expense' : 'income');
    const signedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    addTransaction(title, signedAmount, category);
    form.reset();
    titleInput?.focus();
  });

  // Reset button
  resetBtn?.addEventListener('click', () => {
    showResetModal(() => {
      transactions = [];
      save();
      
      // Update current screen
      if (currentRoute === 'dashboard') {
        renderDashboard();
      } else if (currentRoute === 'transactions') {
        renderTransactions();
      }
      
      if (listEl) listEl.innerHTML = '';
      setError('');
    });
  });

  // Theme toggle
  themeToggle?.addEventListener('change', () => {
    const isDark = themeToggle.checked;
    document.body.classList.toggle('theme-light', !isDark);
    document.body.classList.toggle('theme-dark', isDark);
    
    const settings = loadSettings();
    settings.theme = isDark ? 'dark' : 'light';
    saveSettings(settings);
  });

  // Data export
  exportDataBtn?.addEventListener('click', () => {
    const data = {
      transactions,
      categories: defaultCategories,
      settings: loadSettings(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Data import
  importDataBtn?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.transactions && Array.isArray(data.transactions)) {
            showDeleteModal(
              'Import Data?',
              'This will replace all current data with the imported backup. This action cannot be undone. Consider exporting your current data first.',
              () => {
                transactions = data.transactions;
                save();
                if (data.settings) {
                  saveSettings(data.settings);
                }
                // Refresh current screen
                router.navigate(currentRoute);
                // Show success message (you could create a success modal here too)
                setTimeout(() => alert('Data imported successfully!'), 100);
              }
            );
          } else {
            alert('Invalid backup file format.');
          }
        } catch (error) {
          alert('Error reading backup file.');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const route = hash || 'dashboard';
    router.navigate(route);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar?.classList.remove('open');
    }
  });

  // Initialize app
  const init = () => {
    transactions = load();
    
    // Set initial route from URL hash
    const hash = window.location.hash.slice(1);
    const initialRoute = hash || 'dashboard';
    router.navigate(initialRoute);
    
    // Apply saved theme
    const settings = loadSettings();
    if (settings.theme === 'dark') {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (themeToggle) themeToggle.checked = true;
    }
  };

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Service Worker for PWA
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
