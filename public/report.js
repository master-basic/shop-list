// Report page functionality
const config = require('../config');
const utils = require('../utils');

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
            utils.showToast('Please login first', 'error');
            window.location.href = '/login.html';
            return;
        }
        currentUser = await response.json();
    } catch (error) {
        console.error('Auth check error:', error);
        utils.showToast('Authentication failed', 'error');
        window.location.href = '/login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date range filter
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', generateReport);
    }
    if (endDateInput) {
        endDateInput.addEventListener('change', generateReport);
    }
}

// Set default date range to current month
function setDefaultDateRange() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    if (startDateInput && endDateInput) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDateInput.value = firstDay.toISOString().split('T')[0];
        endDateInput.value = lastDay.toISOString().split('T')[0];
    }
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
        utils.showToast('Failed to generate report', 'error');
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
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${utils.formatDate(item.date)}</td>
            <td>${item.bought_date ? utils.formatDate(item.bought_date) : '-'}</td>
            <td>${item.category || '-'}</td>
            <td>${utils.formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${utils.formatCurrency(item.price * item.quantity)}</td>
            <td>${item.bought_by || '-'}</td>
            <td class="actions">
                <button class="action-button bought-button" onclick="toggleBought(this)">Bought</button>
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
    const itemName = row.querySelector('.item-name').textContent;
    const itemTotal = row.querySelector('.item-total').textContent;
    
    const itemData = {
        id: row.dataset.id,
        bought: !button.classList.contains('bought')
    };
    
    try {
        const response = await fetch('/api/item/bought', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData)
        });
        
        if (response.ok) {
            button.classList.toggle('bought');
            button.textContent = button.classList.contains('bought') ? 'Bought' : 'Not Bought';
            utils.showToast(itemName + ' marked as ' + (button.classList.contains('bought') ? 'bought' : 'not bought'), 'success');
        }
    } catch (error) {
        console.error('Error toggling bought status:', error);
        utils.showToast('Failed to update status', 'error');
    }
}

// Delete item
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`/api/item/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const row = document.querySelector(`tr[data-id="${itemId}"]`);
            if (row) row.remove();
            utils.showToast('Item deleted successfully', 'success');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        utils.showToast('Failed to delete item', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
    setDefaultDateRange();
});