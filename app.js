// Finance Tracker Application
// ===========================

// Global variables
let transactions = [];
let incomeChart = null;
let expenseChart = null;
let comparisonChart = null;

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const categorySelect = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const transactionsList = document.getElementById('transactions-list');
const emptyState = document.getElementById('empty-state');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const netBalanceEl = document.getElementById('net-balance');
const clearAllBtn = document.getElementById('clear-all');
const emojiGrid = document.getElementById('emoji-grid');

// Chart color palettes
const incomeColors = [
    'rgba(56, 239, 125, 0.8)',
    'rgba(17, 153, 142, 0.8)',
    'rgba(0, 206, 201, 0.8)',
    'rgba(85, 239, 196, 0.8)',
    'rgba(129, 236, 236, 0.8)'
];

const expenseColors = [
    'rgba(244, 92, 67, 0.8)',
    'rgba(235, 51, 73, 0.8)',
    'rgba(255, 107, 129, 0.8)',
    'rgba(255, 159, 67, 0.8)',
    'rgba(253, 203, 110, 0.8)',
    'rgba(214, 48, 49, 0.8)',
    'rgba(225, 112, 85, 0.8)',
    'rgba(250, 177, 160, 0.8)',
    'rgba(255, 118, 117, 0.8)',
    'rgba(178, 190, 195, 0.8)'
];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setDefaultDate();
    initializeCharts();
    updateUI();
    setupEventListeners();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Setup event listeners
function setupEventListeners() {
    transactionForm.addEventListener('submit', handleFormSubmit);
    clearAllBtn.addEventListener('click', clearAllTransactions);
    
    // Emoji button clicks
    emojiGrid.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.textContent;
            const currentValue = descriptionInput.value;
            descriptionInput.value = currentValue + emoji;
            descriptionInput.focus();
        });
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const type = document.querySelector('input[name="type"]:checked').value;
    const description = descriptionInput.value.trim();
    const category = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    
    if (!description || !category || !amount || !date) {
        showNotification('Please fill in all fields! 📝', 'error');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        type,
        description,
        category,
        amount,
        date
    };
    
    transactions.unshift(transaction);
    saveTransactions();
    updateUI();
    
    // Reset form
    transactionForm.reset();
    setDefaultDate();
    document.getElementById('type-income').checked = true;
    
    showNotification(
        type === 'income' 
            ? `Income added: +$${amount.toFixed(2)} 💰` 
            : `Expense added: -$${amount.toFixed(2)} 💸`,
        'success'
    );
}

// Delete a transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
    showNotification('Transaction deleted! 🗑️', 'info');
}

// Clear all transactions
function clearAllTransactions() {
    if (transactions.length === 0) {
        showNotification('No transactions to clear! 📋', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to delete all transactions? This cannot be undone!')) {
        transactions = [];
        saveTransactions();
        updateUI();
        showNotification('All transactions cleared! 🧹', 'success');
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('finance-tracker-transactions', JSON.stringify(transactions));
}

// Load transactions from localStorage
function loadTransactions() {
    const saved = localStorage.getItem('finance-tracker-transactions');
    transactions = saved ? JSON.parse(saved) : [];
}

// Update all UI elements
function updateUI() {
    updateSummary();
    updateTransactionsList();
    updateCharts();
}

// Update summary cards
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    // Animate the values
    animateValue(totalIncomeEl, income);
    animateValue(totalExpenseEl, expense);
    animateValue(netBalanceEl, balance, true);
}

// Animate number values
function animateValue(element, value, showSign = false) {
    const prefix = showSign && value >= 0 ? '+' : '';
    const color = showSign ? (value >= 0 ? '#38ef7d' : '#f45c43') : null;
    
    element.textContent = `${prefix}$${value.toFixed(2)}`;
    if (color) element.style.color = color;
    
    // Add a quick pulse animation
    element.style.transform = 'scale(1.05)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 150);
}

// Update transactions list
function updateTransactionsList() {
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <p class="empty-state" id="empty-state">
                <span class="empty-icon">📝</span>
                <span>No transactions yet. Start by adding one above!</span>
            </p>
        `;
        return;
    }
    
    const html = transactions.map(transaction => {
        const emoji = transaction.category.split(' ')[0] || '💰';
        const sign = transaction.type === 'income' ? '+' : '-';
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="transaction-item ${transaction.type}" data-id="${transaction.id}">
                <div class="transaction-icon">${emoji}</div>
                <div class="transaction-details">
                    <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                    <div class="transaction-meta">
                        <span>${transaction.category}</span>
                        <span>•</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <div class="transaction-amount">${sign}$${transaction.amount.toFixed(2)}</div>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Delete">🗑️</button>
            </div>
        `;
    }).join('');
    
    transactionsList.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    padding: 16,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(18, 18, 26, 0.95)',
                titleColor: '#fff',
                bodyColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return ` $${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    };
    
    // Income pie chart
    const incomeCtx = document.getElementById('income-chart').getContext('2d');
    incomeChart = new Chart(incomeCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: incomeColors,
                borderColor: 'rgba(10, 10, 15, 0.8)',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            ...chartOptions,
            cutout: '60%'
        }
    });
    
    // Expense pie chart
    const expenseCtx = document.getElementById('expense-chart').getContext('2d');
    expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: expenseColors,
                borderColor: 'rgba(10, 10, 15, 0.8)',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            ...chartOptions,
            cutout: '60%'
        }
    });
    
    // Comparison chart
    const comparisonCtx = document.getElementById('comparison-chart').getContext('2d');
    comparisonChart = new Chart(comparisonCtx, {
        type: 'pie',
        data: {
            labels: ['💵 Total Income', '💸 Total Expenses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(56, 239, 125, 0.8)',
                    'rgba(244, 92, 67, 0.8)'
                ],
                borderColor: 'rgba(10, 10, 15, 0.8)',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed || 0;
                            return ` $${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Update charts with current data
function updateCharts() {
    updateIncomeChart();
    updateExpenseChart();
    updateComparisonChart();
}

// Update income chart
function updateIncomeChart() {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const incomeEmpty = document.getElementById('income-empty');
    const incomeCanvas = document.getElementById('income-chart');
    
    if (incomeTransactions.length === 0) {
        incomeEmpty.classList.add('show');
        incomeCanvas.style.display = 'none';
        return;
    }
    
    incomeEmpty.classList.remove('show');
    incomeCanvas.style.display = 'block';
    
    const categoryData = getCategoryData(incomeTransactions);
    
    incomeChart.data.labels = categoryData.labels;
    incomeChart.data.datasets[0].data = categoryData.values;
    incomeChart.update('active');
}

// Update expense chart
function updateExpenseChart() {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const expenseEmpty = document.getElementById('expense-empty');
    const expenseCanvas = document.getElementById('expense-chart');
    
    if (expenseTransactions.length === 0) {
        expenseEmpty.classList.add('show');
        expenseCanvas.style.display = 'none';
        return;
    }
    
    expenseEmpty.classList.remove('show');
    expenseCanvas.style.display = 'block';
    
    const categoryData = getCategoryData(expenseTransactions);
    
    expenseChart.data.labels = categoryData.labels;
    expenseChart.data.datasets[0].data = categoryData.values;
    expenseChart.update('active');
}

// Update comparison chart
function updateComparisonChart() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const comparisonEmpty = document.getElementById('comparison-empty');
    const comparisonCanvas = document.getElementById('comparison-chart');
    
    if (totalIncome === 0 && totalExpense === 0) {
        comparisonEmpty.classList.add('show');
        comparisonCanvas.style.display = 'none';
        return;
    }
    
    comparisonEmpty.classList.remove('show');
    comparisonCanvas.style.display = 'block';
    
    comparisonChart.data.datasets[0].data = [totalIncome, totalExpense];
    comparisonChart.update('active');
}

// Get category data for charts
function getCategoryData(transactions) {
    const categoryMap = new Map();
    
    transactions.forEach(t => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
    });
    
    // Sort by value descending
    const sorted = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1]);
    
    return {
        labels: sorted.map(([label]) => label),
        values: sorted.map(([, value]) => value)
    };
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '24px',
        right: '24px',
        padding: '16px 24px',
        borderRadius: '12px',
        color: '#fff',
        fontWeight: '600',
        fontSize: '14px',
        zIndex: '1000',
        animation: 'slideInRight 0.3s ease',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    });
    
    // Type-specific colors
    const colors = {
        success: 'rgba(17, 153, 142, 0.9)',
        error: 'rgba(235, 51, 73, 0.9)',
        info: 'rgba(102, 126, 234, 0.9)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    // Add animation keyframes if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Expose deleteTransaction to global scope for onclick
window.deleteTransaction = deleteTransaction;
