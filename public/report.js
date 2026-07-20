// Report page functionality

let currentUser = null;

// Initialize the page
async function init() {
    await checkAuthentication();
    setupEventListeners();
    await generateReport();
}

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/current-user');
        if (!response.ok) {
            window.location.href = '/login.html';
            return;
        }
        currentUser = await response.json();
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const startPeriod = document.getElementById('start-period');
    const endPeriod = document.getElementById('end-period');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', generateReport);
        startDateInput.addEventListener('input', formatDateInput);
    }
    if (endDateInput) {
        endDateInput.addEventListener('change', generateReport);
        endDateInput.addEventListener('input', formatDateInput);
    }
    if (startPeriod) {
        startPeriod.addEventListener('change', setPeriodDates);
    }
    if (endPeriod) {
        endPeriod.addEventListener('change', setPeriodDates);
    }
}

// Set default date range to current month
function setDefaultDateRange() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const startPeriod = document.getElementById('start-period');
    const endPeriod = document.getElementById('end-period');
    if (startDateInput && endDateInput && startPeriod && endPeriod) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDateInput.value = formatDate(firstDay);
        endDateInput.value = formatDate(lastDay);
        startPeriod.value = 'month';
        endPeriod.value = 'week';
    }
}

// Set period-based dates
function setPeriodDates() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const startPeriod = document.getElementById('start-period');
    const endPeriod = document.getElementById('end-period');
    
    if (!startDateInput || !endDateInput || !startPeriod || !endPeriod) return;
    
    const today = new Date();
    let startDate, endDate;
    
    // Start date based on start period
    const periodStart = startPeriod.value;
    if (periodStart === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (periodStart === 'week') {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    } else if (periodStart === 'year') {
        startDate = new Date(today.getFullYear(), 0, 1);
    } else {
        startDate = new Date(today);
    }
    
    // End date based on end period (use fresh date objects to avoid mutation)
    const periodEnd = endPeriod.value;
    if (periodEnd === 'month') {
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (periodEnd === 'week') {
        endDate = new Date(today);
    } else if (periodEnd === 'day') {
        endDate = new Date(today);
        endDate.setDate(today.getDate() + 30);
    } else if (periodEnd === 'year') {
        endDate = new Date(today.getFullYear() + 1, 0, 1);
    } else {
        endDate = new Date(today);
    }
    
    startDateInput.value = formatDate(startDate);
    endDateInput.value = formatDate(endDate);
    
    // Generate report after setting dates
    setTimeout(generateReport, 100);
}

// Format date input value to YYYY-MM-DD
function formatDateInput() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    if (startDateInput && startDateInput.value) {
        const d = new Date(startDateInput.value);
        if (!isNaN(d.getTime())) startDateInput.value = formatDate(d);
    }
    if (endDateInput && endDateInput.value) {
        const d = new Date(endDateInput.value);
        if (!isNaN(d.getTime())) endDateInput.value = formatDate(d);
    }
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate report based on date range and filters
async function generateReport() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    
    const params = new URLSearchParams({ includeArchived: 'true' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    try {
        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const items = await response.json();
        renderReportTable(items);
        calculateReportStats(items);
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Failed to generate report', 'error');
    }
}

// Render report table
function renderReportTable(items) {
    const tableBody = document.getElementById('report-list');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="no-data">No items found</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        const isBought = !!item.bought_date;
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${formatDate(item.date)}</td>
            <td>${item.bought_date ? formatDate(item.bought_date) : '-'}</td>
            <td>${item.category || '-'}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price * item.quantity)}</td>
            <td>${item.bought_by || '-'}</td>
            <td class="actions">
                <button class="action-button ${isBought ? 'bought-button bought' : 'bought-button'}" onclick="toggleBought(this)">${isBought ? 'Bought' : 'Not Bought'}</button>
                <button class="action-button delete-button" onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Calculate report statistics
function calculateReportStats(items) {
    let totalAmount = 0;
    const spendingByBuyer = {};
    const itemsByCategory = {};
    
    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        if (item.bought_by) {
            spendingByBuyer[item.bought_by] = (spendingByBuyer[item.bought_by] || 0) + itemTotal;
        }
        
        if (item.category) {
            itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + itemTotal;
        }
    });
    
    // Update total amount display
    const totalElement = document.getElementById('report-total');
    if (totalElement) {
        totalElement.textContent = `AZN ${totalAmount.toFixed(2)}`;
    }
    
    // Update buyer summary
    const buyerSummaryContainer = document.getElementById('buyer-summary');
    if (buyerSummaryContainer) {
        let buyerSummaryHTML = '<h2>Buyer Summary</h2><div class="buyer-items">';
        for (const [buyer, amount] of Object.entries(spendingByBuyer)) {
            buyerSummaryHTML += `
                <div class="buyer-item">
                    <div class="buyer-item-name">${buyer}</div>
                    <div class="buyer-item-total">AZN ${amount.toFixed(2)}</div>
                </div>
            `;
        }
        buyerSummaryHTML += '</div>';
        buyerSummaryContainer.innerHTML = buyerSummaryHTML;
        
        if (Object.keys(spendingByBuyer).length === 0) {
            buyerSummaryContainer.innerHTML = '<p>No buyer data available</p>';
        }
    }
}

// Toggle bought status
async function toggleBought(button) {
    const row = button.closest('tr');
    const itemId = row.dataset.id;
    const itemName = row.querySelector('td')?.textContent || 'Item';

    try {
        const response = await fetch(`/api/items/${itemId}/bought`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            const isBought = data.bought;
            button.classList.toggle('bought', isBought);
            button.textContent = isBought ? 'Bought' : 'Not Bought';
            showToast(`${itemName} marked as ${isBought ? 'bought' : 'not bought'}`, 'success');
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error toggling bought status:', error);
        showToast('Failed to update status', 'error');
    }
}

// Delete item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const row = document.querySelector(`tr[data-id="${itemId}"]`);
            if (row) row.remove();
            showToast('Item deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Failed to delete item', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
    setDefaultDateRange();
});