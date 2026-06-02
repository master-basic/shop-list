// Admin page functionality (Browser-compatible)

let currentUser = null;

// Import utils functions from global scope
const utils = typeof window !== 'undefined' && window.utils ? window.utils : {
    showToast: function(msg, type) {
        console.log(`[${type.toUpperCase()}] ${msg}`);
    },
    formatDate: function(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
};

// Initialize theme
async function initTheme() {
    if (typeof darkMode !== 'undefined') {
        await darkMode.init();
    }
}

// Initialize the page
async function init() {
    await checkAuthentication();
    setupEventListeners();
    await fetchUsers();
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
        window.location.href = '/login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle logout
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        await fetch('/api/logout', { method: 'POST' });
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '/login.html', 1000);
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout', 'error');
    }
}

// Fetch users from database
async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        console.log('Users:', users);
        renderUserTable(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load users', 'error');
    }
}

// Render user table
function renderUserTable(users) {
    const tableBody = document.querySelector('#user-list');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="no-data">No users found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.username = user.username;
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.isAdmin ? '<span class="badge badge-primary">Admin</span>' : '<span class="badge badge-secondary">User</span>'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${user.username}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteUser('${user.username}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Edit user
async function editUser(username) {
    try {
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        
        const user = await response.json();
        
        const newUsername = prompt('Edit Username:', user.username);
        if (!newUsername) return;
        
        const newPassword = prompt('New Password (leave empty to keep current):', '');
        const newIsAdmin = prompt('Set Admin Access (y/n):', 'n')?.toLowerCase() === 'y';
        
        try {
            const response = await fetch(`/api/users/${username}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: newUsername,
                    password: newPassword || null,
                    isAdmin: newIsAdmin
                })
            });
            
            if (response.ok) {
                showToast('User updated successfully', 'success');
                await fetchUsers();
            } else {
                showToast('Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('Failed to update user', 'error');
        }
    } catch (error) {
        console.error('Edit error:', error);
        showToast('Failed to edit user', 'error');
    }
}

// Delete user
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    
    try {
        const response = await fetch(`/api/users/${username}`, { method: 'DELETE' });
        
        if (response.ok) {
            showToast('User deleted successfully', 'success');
            await fetchUsers();
        } else {
            showToast('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete user', 'error');
    }
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
});