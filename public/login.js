// Login functionality

// Import showToast from utils
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;
    
    // Add styles
    const toastStyles = `
        <style>
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
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
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
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', toastStyles);
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

// Validate input fields
function validateInput(input, fieldName) {
    const trimmed = input.trim();
    
    if (!trimmed) {
        showToast(`${fieldName} is required`, 'error');
        return null;
    }
    
    if (trimmed.length > 100) {
        showToast(`${fieldName} cannot exceed 100 characters`, 'error');
        return null;
    }
    
    return trimmed;
}

// Validate login form
function validateLoginForm() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    const username = validateInput(usernameInput ? usernameInput.value : '', 'Username');
    const password = validateInput(passwordInput ? passwordInput.value : '', 'Password');
    
    return { username, password };
}

// Login handler
function handleLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { username, password } = validateLoginForm();
        
        if (!username || !password) return;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success && data.isAdmin) {
                showToast('Logged in as Admin', 'success');
                setTimeout(() => window.location.href = '/admin.html', 1500);
            } else if (data.success) {
                showToast('Logged in successfully', 'success');
                setTimeout(() => window.location.href = 'index2.html', 1500);
            } else {
                showToast('Invalid username or password', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Login failed. Please try again.', 'error');
        }
    });
}

// Admin login handler
function handleAdminLogin() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        const username = usernameInput ? usernameInput.value : '';
        const password = passwordInput ? passwordInput.value : '';
        
        if (!username || !password) {
            showToast('Please enter username and password', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success && data.isAdmin) {
                showToast('Logged in as Admin', 'success');
                setTimeout(() => window.location.href = '/admin.html', 1500);
            } else if (data.success) {
                showToast('Logged in successfully', 'success');
                setTimeout(() => window.location.href = 'index2.html', 1500);
            } else {
                showToast('Invalid username or password', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showToast('Login failed. Please try again.', 'error');
        }
    });
}

// Admin login button handler (for when there's no form)
async function adminLogin() {
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    
    const username = usernameInput ? usernameInput.value : '';
    const password = passwordInput ? passwordInput.value : '';
    
    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.isAdmin) {
            showToast('Logged in as Admin', 'success');
            setTimeout(() => window.location.href = '/admin.html', 1500);
        } else if (data.success) {
            showToast('Logged in successfully', 'success');
            setTimeout(() => window.location.href = 'index2.html', 1500);
        } else {
            showToast('Invalid username or password', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    handleLogin();
    handleAdminLogin();
});