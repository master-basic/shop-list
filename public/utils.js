// Utility functions for the Shop-List application

// Browser-compatible module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { showToast, formatCurrency, formatDate, formatDateTime, isValidEmail, validateItemName, validatePrice, validateQuantity, validateDate, debounce, throttle, getCategoryColor, formatCategory, formatNumber, getCurrentISODate, getCurrentISODatetime, generateId, safeParseJSON, formatItemForDisplay };
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Inject toast styles once
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                color: white;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            .toast-warning { background: #f59e0b; }
            .toast-info { background: #3b82f6; }
            .toast-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                opacity: 0.8;
            }
            .toast-close:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;
    document.body.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // Close on button click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
function formatDateTime(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate item name
function validateItemName(name) {
    if (!name || name.trim() === '') {
        return { valid: false, message: 'Item name is required' };
    }
    if (name.trim().length > 100) {
        return { valid: false, message: 'Item name cannot exceed 100 characters' };
    }
    return { valid: true, message: '' };
}

// Validate price
function validatePrice(price) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
        return { valid: false, message: 'Please enter a valid price' };
    }
    if (numPrice < 0) {
        return { valid: false, message: 'Price cannot be negative' };
    }
    return { valid: true, message: '' };
}

// Validate quantity
function validateQuantity(quantity) {
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity)) {
        return { valid: false, message: 'Please enter a valid quantity' };
    }
    if (numQuantity <= 0) {
        return { valid: false, message: 'Quantity must be at least 1' };
    }
    return { valid: true, message: '' };
}

// Validate date
function validateDate(dateValue) {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Please select a valid date' };
    }
    return { valid: true, message: '' };
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Get category color
function getCategoryColor(category) {
    const colors = {
        'Dairy': '#60a5fa',
        'Produce': '#34d399',
        'Meat': '#f87171',
        'Bakery': '#fbbf24',
        'Beverages': '#60a5fa',
        'Pantry': '#a78bfa',
        'Frozen': '#f472b6',
        'Household': '#9ca3af'
    };
    return colors[category] || '#6b7280';
}

// Format category with icon
function formatCategory(category) {
    const icons = {
        'Dairy': '🥛',
        'Produce': '🥬',
        'Meat': '🥩',
        'Bakery': '🥖',
        'Beverages': '🥤',
        'Pantry': '📦',
        'Frozen': '❄️',
        'Household': '🏠'
    };
    return icons[category] || '🏷️';
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get current ISO date
function getCurrentISODate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Get current datetime ISO
function getCurrentISODatetime() {
    return new Date().toISOString();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Parse JSON with error handling
function safeParseJSON(str) {
    try {
        return JSON.parse(str);
    } catch (error) {
        console.error('JSON parse error:', error);
        return null;
    }
}

// Format item for display
function formatItemForDisplay(item) {
    return {
        ...item,
        formattedPrice: formatCurrency(item.price),
        formattedQuantity: formatNumber(item.quantity),
        formattedTotal: formatCurrency(item.price * item.quantity),
        formattedDate: formatDate(item.date),
        formattedBoughtDate: formatDate(item.bought_date),
        categoryName: formatCategory(item.category),
        categoryColor: getCategoryColor(item.category)
    };
}

