// Admin page functionality

let currentUser = null;

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
        logoutBtn.addEventListener('click', logout);
    }
}

// Handle logout
async function logout() {
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
    showLoading();
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        renderUserTable(users);
        hideLoading();
    } catch (error) {
        hideLoading();
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
        
        const tdUsername = document.createElement('td');
        tdUsername.textContent = user.username;
        
        const tdRole = document.createElement('td');
        tdRole.innerHTML = user.isAdmin ? '<span class="badge badge-primary">Admin</span>' : '<span class="badge badge-secondary">User</span>';
        
        const tdActions = document.createElement('td');
        const btnEdit = document.createElement('button');
        btnEdit.className = 'action-btn edit-btn';
        btnEdit.textContent = 'Edit';
        btnEdit.onclick = () => editUser(user.username);
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'action-btn delete-btn';
        btnDelete.textContent = 'Delete';
        btnDelete.onclick = () => deleteUser(user.username);
        
        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);
        
        row.appendChild(tdUsername);
        row.appendChild(tdRole);
        row.appendChild(tdActions);
        
        tableBody.appendChild(row);
    });
}

// Edit user
async function editUser(username) {
    try {
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        
        const user = await response.json();
        
        // Create edit modal
        const safeUsername = user.username.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        showModal('Edit User', `
            <div class="edit-form">
                <div class="form-group">
                    <label for="edit-username">Username:</label>
                    <input type="text" id="edit-username" name="username" class="form-control" value="${safeUsername}" required>
                </div>
                <div class="form-group">
                    <label for="edit-password">Password (leave empty to keep current):</label>
                    <input type="password" id="edit-password" name="password" class="form-control">
                </div>
                <div class="form-group checkbox-group">
                    <label for="edit-isadmin">
                        <input type="checkbox" id="edit-isadmin" name="isAdmin" ${user.isAdmin ? 'checked' : ''}>
                        Set Admin Access
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="saveEditForm()">Save Changes</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error editing user:', error);
        showToast('Failed to load user data', 'error');
    }
}

// Save changes from edit form
async function saveEditForm() {
    const editUsername = document.getElementById('edit-username');
    if (!editUsername) return;
    
    const user = {
        username: editUsername.value,
        password: document.getElementById('edit-password')?.value || null,
        isAdmin: document.getElementById('edit-isadmin')?.checked || false
    };
    
    showLoading();
    try {
        const response = await fetch(`/api/users/${user.username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        hideLoading();
        if (!response.ok) throw new Error('Failed to update user');
        
        closeModal();
        await loadUsers();
        showToast('User updated successfully', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error saving user:', error);
        showToast('Failed to update user', 'error');
    }
}

// Delete user
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    showLoading();
    try {
        const response = await fetch(`/api/users/${username}`, { method: 'DELETE' });
        
        hideLoading();
        if (response.ok) {
            showToast('User deleted successfully', 'success');
            await fetchUsers();
        } else {
            showToast('Failed to delete user', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Delete error:', error);
        showToast('Failed to delete user', 'error');
    }
}

// Create user
async function createUser() {
    const username = document.getElementById('new-username')?.value.trim();
    const password = document.getElementById('new-password')?.value;
    const isAdmin = document.getElementById('new-isAdmin')?.checked || false;

    if (!username || !password) {
        showToast('Username and password are required', 'error');
        return;
    }

    showLoading();
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, isAdmin })
        });

        hideLoading();
        if (response.ok) {
            showToast('User created successfully', 'success');
            document.getElementById('new-username').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('new-isAdmin').checked = false;
            await fetchUsers();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Create user error:', error);
        showToast('Failed to create user', 'error');
    }
}

function showModal(title, content) {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        const titleEl = modal.querySelector('.modal-title');
        const bodyEl = modal.querySelector('.modal-body');
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.innerHTML = content;
        modal.classList.add('show');
    }
}

function closeModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
});