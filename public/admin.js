async function createUser() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const isAdmin = document.getElementById('new-isAdmin').checked;

    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, isAdmin: isAdmin ? 1 : 0 })
    });

    if (response.ok) {
        alert('User created successfully');
        fetchUsers();
    } else {
        alert('Failed to create user');
    }
}

async function deleteUser(username) {
    const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        alert('User deleted successfully');
        fetchUsers();
    } else {
        alert('Failed to delete user');
    }
}

async function updateUser(username) {
    const newPassword = prompt('Enter new password:');
    const isAdmin = document.getElementById(`isAdmin-${username}`).checked ? 1 : 0;
    if (newPassword) {
        const response = await fetch(`/api/users/${username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword, isAdmin })
        });

        if (response.ok) {
            alert('Password updated successfully');
            fetchUsers();
        } else {
            alert('Failed to update password');
        }
    }
}

async function fetchUsers() {
    const response = await fetch('/api/users');
    const users = await response.json();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>
                <input type="checkbox" id="isAdmin-${user.username}" ${user.isAdmin ? 'checked' : ''}> Admin
                <button class="edit-button" onclick="updateUser('${user.username}')">Edit</button>
                <button class="delete-button" onclick="deleteUser('${user.username}')">Delete</button>
            </td>
        `;
        userList.appendChild(tr);
    });
}

async function checkLogin() {
    const response = await fetch('/api/current-user');
    if (response.status !== 200) {
        window.location.href = '/login.html'; // Redirect to the login page if not authenticated
    }
}

async function logout() {
    const response = await fetch('/api/logout', {
        method: 'POST'
    });

    if (response.ok) {
        window.location.href = '/login.html'; // Redirect to the login page
    } else {
        alert('Failed to log out. Please try again.');
    }
}

checkLogin();
fetchUsers();
