// Login functionality
// showToast is provided by utils.js (loaded before this script)

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
    
    const submitButton = form.querySelector('button');
    if (!submitButton) return;
    
    submitButton.addEventListener('click', async (e) => {
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