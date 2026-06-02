// Admin page functionality
const config = require('../config');
const utils = require('../utils');

let currentUser = null;

// Initialize theme
async function initTheme() {
    await darkMode.init();
}

// Initialize the page
async function init() {
    // Check authentication
    await checkAuthentication();
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch users
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
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle logout
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        await fetch('/api/logout', { method: 'POST' });
        utils.showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '/login.html', 1000);
    } catch (error) {
        console.error('Logout error:', error);
        utils.showToast('Failed to logout', 'error');
    }
}

// Fetch users from database
async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        renderUserTable(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        utils.showToast('Failed to load users', 'error');
    }
}

// Render user table
function renderUserTable(users) {
    const tableBody = document.querySelector('.user-table tbody');
    if (!tableBody) return;
    
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
        
        // Show edit form
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
                utils.showToast('User updated successfully', 'success');
                await fetchUsers();
            } else {
                utils.showToast('Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            utils.showToast('Failed to update user', 'error');
        }
    } catch (error) {
        console.error('Edit error:', error);
        utils.showToast('Failed to edit user', 'error');
    }
}

// Delete user
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${username}`, { method: 'DELETE' });
        
        if (response.ok) {
            utils.showToast('User deleted successfully', 'success');
            await fetchUsers();
        } else {
            utils.showToast('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        utils.showToast('Failed to delete user', 'error');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
});