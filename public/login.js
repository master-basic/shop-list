async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const result = await response.json();
        if (result.success) {
            window.location.href = '/index2.html'; // Redirect to the main page
        } else {
            alert('Invalid username or password');
        }
    } else {
        alert('An error occurred. Please try again.');
    }
}

async function adminLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const result = await response.json();
        if (result.success) {
            if (result.isAdmin) {
                window.location.href = '/admin.html'; // Redirect to the admin page
            } else {
                alert('You do not have permission to access the admin page');
            }
        } else {
            alert('Invalid username or password');
        }
    } else {
        alert('An error occurred. Please try again.');
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
