// Dark Mode — single source of truth for theme management

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (typeof showToast === 'function') {
        showToast(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

// Run immediately (non-blocking, just sets data-theme attribute)
initTheme();

// Also add click listener to .theme-toggle buttons (for pages without inline onclick)
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        // Remove any existing listeners to avoid double-triggering with inline onclick
        toggleBtn.addEventListener('click', (e) => {
            // Only handle if no inline onclick fired first
            if (!e.defaultPrevented) {
                toggleTheme();
            }
        });
    }
});
