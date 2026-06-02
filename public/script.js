// Function to get the current month name
function getMonthName() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    return monthNames[now.getMonth()];
}

// Set the month name in the HTML element with id 'month-name'
document.getElementById('month-name').textContent = getMonthName();

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize category filter chips
let isDarkMode = false;

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        isDarkMode = false;
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Function to fetch items from the server and display them in the table
async function fetchItems() {
    const response = await fetch('/api/items');
    const items = await response.json();
    const list = document.getElementById('shopping-list');
    list.innerHTML = '';
    let totalAmount = 0;
    let totalItems = 0;
    let purchasedCount = 0;
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    const showBought = document.querySelector('.filter-buttons button[onclick*="showBoughtItems"]')?.classList.contains('active');
    const showNotBought = document.querySelector('.filter-buttons button[onclick*="showNotBoughtItems"]')?.classList.contains('active');
    const showArchived = document.querySelector('.filter-buttons button[onclick*="showArchivedItems"]')?.classList.contains('active');

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        tr.dataset.date = item.date;
        tr.dataset.boughtdate = item.bought_date || '';
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
        const totalPrice = item.price * item.quantity;
        totalAmount += totalPrice;
        totalItems++;
        if (item.bought_date) purchasedCount++;

        const category = item.category || 'All Categories';
        const matchesCategory = !activeCategory || category === activeCategory;
        const isBought = !!item.bought_date;
        const matchesBoughtStatus = !showBought && !showNotBought || (showBought && isBought) || (showNotBought && !isBought);
        const isArchived = item.archived ? true : false;
        const matchesArchived = !showArchived || isArchived;

        if (!matchesCategory || !matchesBoughtStatus || !matchesArchived) return;

        const priceField = item.bought_date ? 
            item.price : 
            `<input type="number" value="${item.price}" step="0.01" onchange="updatePrice(${item.id}, this.value)" class="price-input">`;
        const quantityField = item.bought_date ? 
            item.quantity : 
            `<input type="number" value="${item.quantity}" min="1" step="1" onchange="updateQuantity(${item.id}, this.value)" class="quantity-input">`;

        tr.innerHTML = `
            <td class="${item.bought_date ? 'bought' : ''}">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${priceField}</td>
            <td>${quantityField}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>
                ${!item.bought_date ? `<button class="action-button bought-button" onclick="markAsBought(${item.id})">Bought</button>` : ''}
                <button class="action-button archive-button" onclick="archiveItem(${item.id})">Archive</button>
                ${!item.bought_date ? `<button class="action-button edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>` : ''}
            </td>
        `;
        list.appendChild(tr);
    });
    
    document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('purchased-count').textContent = purchasedCount;
}

// Function to update price for an item
async function updatePrice(itemId, newPrice) {
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Not logged in');
        }
        const item = { id: itemId, price: parseFloat(newPrice) || 0 };
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to update price');
        showToast('Price updated successfully', 'success');
        fetchItems();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to update quantity for an item
async function updateQuantity(itemId, newQuantity) {
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Not logged in');
        }
        const item = { id: itemId, quantity: parseInt(newQuantity) || 1 };
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to update quantity');
        showToast('Quantity updated successfully', 'success');
        fetchItems();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to toggle category filter
function toggleCategoryFilter(category) {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.category === category);
    });
    fetchItems();
}

// Function to enable editing of a row
function enableEditing(row) {
    const cells = row.querySelectorAll('td');
    const itemName = cells[0].textContent;
    const itemPrice = cells[4].querySelector('input')?.value || 0;
    const itemQuantity = cells[5].querySelector('input')?.value || 1;
    const itemCategory = cells[3].textContent;
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = itemName;
    nameInput.className = 'item-input';
    nameInput.placeholder = 'Item name';
    
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.value = itemCategory;
    categoryInput.className = 'edit-category-input';
    categoryInput.placeholder = 'Category';
    
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.value = itemPrice;
    priceInput.className = 'edit-price-input';
    priceInput.placeholder = 'Price';
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.value = itemQuantity;
    quantityInput.className = 'edit-quantity-input';
    quantityInput.placeholder = 'Quantity';
    
    cells[0].innerHTML = nameInput;
    cells[3].innerHTML = categoryInput;
    cells[4].innerHTML = priceInput;
    cells[5].innerHTML = quantityInput;
    
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = `
        <button class="action-button bought-button" onclick="saveEditing(${row.dataset.id})">Save</button>
        <button class="action-button archive-button" onclick="cancelEditing(${row.dataset.id})">Cancel</button>
    `;
}

// Function to cancel editing of a row
async function cancelEditing(itemId) {
    fetchItems();
}

// Function to save changes made to a row
async function saveEditing(itemId) {
    const row = document.querySelector(`tr[data-id="${itemId}"]`);
    if (!row) return;
    
    const cells = row.querySelectorAll('td');
    const item = {
        id: itemId,
        name: cells[0].querySelector('.item-input')?.value,
        category: cells[3].querySelector('.edit-category-input')?.value,
        price: parseFloat(cells[4].querySelector('.edit-price-input')?.value) || 0,
        quantity: parseInt(cells[5].querySelector('.edit-quantity-input')?.value) || 1
    };
    
    try {
        await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        showToast('Item updated successfully', 'success');
        fetchItems();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to populate the item select dropdown
function populateItemSelect(items) {
    const select = document.getElementById('item-select');
    if (!select) return;
    select.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        select.appendChild(option);
    });
}

// Function to filter items in the dropdown based on user input
function filterItems() {
    const input = document.getElementById('item-name').value.toLowerCase();
    const select = document.getElementById('item-select');
    const options = select.options;
    let matchFound = false;
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value.toLowerCase().includes(input)) {
            option.style.display = '';
            matchFound = true;
        } else {
            option.style.display = 'none';
        }
    }
    select.style.display = matchFound ? 'block' : 'none';
}

// Function to select an item from the dropdown
function selectItem() {
    const select = document.getElementById('item-select');
    const input = document.getElementById('item-name');
    input.value = select.value;
    select.style.display = 'none';
}

// Function to format date to SQL datetime format using moment.js
function formatDateToSQL(datetime) {
    if (!datetime) return null;
    return moment(datetime).format('YYYY-MM-DD HH:mm:ss');
}

// Function to add a new item to the list
async function addItem() {
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Not logged in');
        }

        const itemName = document.getElementById('item-name').value.trim();
        const itemPrice = parseFloat(document.getElementById('item-price').value) || 0.00;
        const itemQuantity = parseInt(document.getElementById('item-quantity').value) || 1;
        const itemCategory = document.getElementById('item-category').value;

        if (!itemName) {
            showToast('Please enter an item name', 'error');
            return;
        }

        const itemData = {
            name: itemName,
            price: itemPrice,
            quantity: itemQuantity,
            category: itemCategory,
            date: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        const response = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add item');
        }

        // Clear form
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        document.getElementById('item-quantity').value = '';
        document.getElementById('item-category').value = '';

        showToast('Item added successfully!', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message, 'error');
    }
}

// Function to mark an item as bought
async function markAsBought(itemId) {
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Please log in to mark items as bought');
        }
        const currentUser = await userResponse.json();

        const response = await fetch(`/api/items/${itemId}/bought`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bought_by: currentUser.username })
        });

        if (!response.ok) {
            throw new Error('Failed to mark item as bought');
        }

        showToast('Item marked as bought', 'success');
        await fetchItems();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to archive an item from the list
async function archiveItem(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            showToast('Failed to archive item', 'error');
            return;
        }
        showToast('Item archived successfully', 'success');
        fetchItems();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to provide autocomplete suggestions based on the user's input
async function autocomplete() {
    const input = document.getElementById('item-name');
    const val = input.value;
    const list = document.getElementById('autocomplete-list');
    if (!val || !list) {
        list.innerHTML = '';
        return;
    }

    try {
        const response = await fetch('/api/items');
        if (!response.ok) {
            showToast('Failed to fetch items', 'error');
            return;
        }
        const items = await response.json();
        const matches = items.filter(item => item.name.toLowerCase().includes(val.toLowerCase()));
        const limitedMatches = matches.slice(0, 10);
        
        list.innerHTML = '';
        if (limitedMatches.length === 0) {
            const div = document.createElement('div');
            div.textContent = 'No matches found';
            div.className = 'autocomplete-items';
            div.style.color = 'var(--text-secondary)';
            div.style.textAlign = 'center';
            list.appendChild(div);
        } else {
            limitedMatches.forEach(match => {
                const div = document.createElement('div');
                div.textContent = `${match.category || 'N/A'} - ${match.name}`;
                div.classList.add('autocomplete-items');
                div.onclick = () => {
                    input.value = match.name;
                    document.getElementById('item-category').value = match.category || '';
                    list.innerHTML = '';
                };
                list.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
        list.innerHTML = '';
    }
}

// Function to generate a report
function generateReport() {
    window.location.href = 'report.html';
}

// Function to log out the user
async function logout() {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (!response.ok) {
            throw new Error('Failed to log out');
        }
        showToast('Logged out successfully', 'success');
        window.location.href = 'login.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Function to show bought items
async function showBoughtItems() {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    const response = await fetch('/api/items');
    if (!response.ok) {
        showToast('Failed to fetch items', 'error');
        return;
    }
    const items = await response.json();
    const list = document.getElementById('shopping-list');
    list.innerHTML = '';
    let totalAmount = 0;
    items.filter(item => item.bought_date).forEach(item => {
        // Apply category filter
        if (activeCategory && item.category !== activeCategory) return;
        
        const tr = document.createElement('tr');
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
        const totalPrice = item.price * item.quantity;
        totalAmount += totalPrice;
        tr.innerHTML = `
            <td class="bought">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>
                <button class="action-button archive-button" onclick="archiveItem(${item.id})">Archive</button>
            </td>
        `;
        list.appendChild(tr);
    });
    document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
}

// Function to show not bought items
async function showNotBoughtItems() {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    const response = await fetch('/api/items');
    if (!response.ok) {
        showToast('Failed to fetch items', 'error');
        return;
    }
    const items = await response.json();
    const list = document.getElementById('shopping-list');
    list.innerHTML = '';
    let totalAmount = 0;
    items.filter(item => !item.bought_date).forEach(item => {
        // Apply category filter
        if (activeCategory && item.category !== activeCategory) return;
        
        const tr = document.createElement('tr');
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
        const totalPrice = item.price * item.quantity;
        totalAmount += totalPrice;
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${itemDate}</td>
            <td></td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td></td>
            <td>
                <button class="action-button bought-button" onclick="markAsBought(${item.id})">Bought</button>
                <button class="action-button archive-button" onclick="archiveItem(${item.id})">Archive</button>
                <button class="action-button edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>
            </td>
        `;
        list.appendChild(tr);
    });
    document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
}

// Function to show archived items
async function showArchivedItems() {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    const response = await fetch('/api/items');
    if (!response.ok) {
        showToast('Failed to fetch items', 'error');
        return;
    }
    const items = await response.json();
    const list = document.getElementById('shopping-list');
    list.innerHTML = '';
    let totalAmount = 0;
    items.filter(item => item.archived).forEach(item => {
        // Apply category filter
        if (activeCategory && item.category !== activeCategory) return;
        
        const tr = document.createElement('tr');
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
        const totalPrice = item.price * item.quantity;
        totalAmount += totalPrice;
        tr.innerHTML = `
            <td class="bought">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>
                <button class="action-button edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>
            </td>
        `;
        list.appendChild(tr);
    });
    document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
}

// Initialize category filter chips
document.addEventListener('DOMContentLoaded', () => {
    initCategoryFilter();
});

function initCategoryFilter() {
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            toggleCategoryFilter(chip.dataset.category);
        });
    });
}

// Initialize theme
initTheme();

// Fetch and display the items when the page loads
fetchItems();

function updateItemList(htmlContent) {
    const container = document.getElementById('itemList');
    if (container) {
        container.innerHTML = htmlContent;
    } else {
        console.error("Container with id 'itemList' not found.");
    }
}