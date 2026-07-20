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

// Toast notification system - removed duplicate, using utils.js
// Import showToast from utils.js

async function fetchItems() {
    try {
        const showArchived = document.querySelector('.filter-buttons button[onclick*="showArchivedItems"]')?.classList.contains('active');
        const url = showArchived ? '/api/items?includeArchived=true' : '/api/items';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        const items = await response.json();
        if (!Array.isArray(items)) {
            console.error('Expected items to be an array, got:', typeof items);
            showToast('Invalid data format from server', 'error');
            return;
        }
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
            tr.dataset.name = item.name;
            tr.dataset.date = item.date;
            tr.dataset.boughtdate = item.bought_date || '';
            tr.dataset.category = item.category || '';
            tr.dataset.price = item.price;
            tr.dataset.quantity = item.quantity;
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

            const tdName = document.createElement('td');
            tdName.className = item.bought_date ? 'bought' : '';
            tdName.textContent = item.name;
            
            const tdDate = document.createElement('td');
            tdDate.textContent = itemDate;
            
            const tdBoughtDate = document.createElement('td');
            tdBoughtDate.textContent = boughtDate;
            
            const tdCategory = document.createElement('td');
            tdCategory.textContent = item.category || 'N/A';
            
            const tdPrice = document.createElement('td');
            tdPrice.innerHTML = priceField;
            
            const tdQuantity = document.createElement('td');
            tdQuantity.innerHTML = quantityField;
            
            const tdTotalPrice = document.createElement('td');
            tdTotalPrice.textContent = totalPrice.toFixed(2);
            
            const tdBoughtBy = document.createElement('td');
            tdBoughtBy.textContent = item.bought_by || '';
            
            const tdActions = document.createElement('td');
            tdActions.innerHTML = `
                ${!item.bought_date ? `<button class="action-button bought-button" onclick="markAsBought(${item.id})">Bought</button>` : ''}
                <button class="action-button archive-button" onclick="archiveItem(${item.id})">Archive</button>
                ${!item.bought_date ? `<button class="action-button edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>` : ''}
            `;
            
            tdActions.addEventListener('click', (e) => {
                if (e.target.classList.contains('archive-button')) {
                    if (!confirm('Are you sure you want to archive this item?')) {
                        e.preventDefault();
                        return;
                    }
                }
            }, true);
            
            tr.appendChild(tdName);
            tr.appendChild(tdDate);
            tr.appendChild(tdBoughtDate);
            tr.appendChild(tdCategory);
            tr.appendChild(tdPrice);
            tr.appendChild(tdQuantity);
            tr.appendChild(tdTotalPrice);
            tr.appendChild(tdBoughtBy);
            tr.appendChild(tdActions);
            
            list.appendChild(tr);
        });
        
        document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('purchased-count').textContent = purchasedCount;

        if (list.children.length === 0) {
            list.innerHTML = '<tr><td colspan="9" class="empty-state">No items found</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        showToast('Failed to load items. Please refresh the page.', 'error');
    }
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
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update price');
        }
        showToast('Price updated successfully', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error updating price:', error);
        showToast(error.message || 'Failed to update price', 'error');
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
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update quantity');
        }
        showToast('Quantity updated successfully', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast(error.message || 'Failed to update quantity', 'error');
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
    
    cells[0].replaceWith(nameInput);
    cells[3].replaceWith(categoryInput);
    cells[4].replaceWith(priceInput);
    cells[5].replaceWith(quantityInput);
    
    const actionsCell = cells[cells.length - 1];
    const btnBought = document.createElement('button');
    btnBought.className = 'action-button bought-button';
    btnBought.textContent = 'Save';
    btnBought.onclick = () => saveEditing(row.dataset.id);
    
    const btnCancel = document.createElement('button');
    btnCancel.className = 'action-button archive-button';
    btnCancel.textContent = 'Cancel';
    btnCancel.onclick = () => cancelEditing(row.dataset.id);
    
    actionsCell.replaceWith(btnBought);
    actionsCell.appendChild(btnCancel);
}

// Function to cancel editing of a row
async function cancelEditing(itemId) {
    try {
        await fetchItems();
    } catch (error) {
        console.error('Error canceling edit:', error);
    }
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
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update item');
        }
        showToast('Item updated successfully', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error saving edit:', error);
        showToast(error.message || 'Failed to update item', 'error');
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

        const now = new Date();
        const itemData = {
            name: itemName,
            price: itemPrice,
            quantity: itemQuantity,
            category: itemCategory,
            date: now.toISOString().slice(0, 19).replace('T', ' '),
            bought_date: null
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
        console.error('Error adding item:', error);
        showToast(error.message || 'Failed to add item', 'error');
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
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark item as bought');
        }

        showToast('Item marked as bought', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error marking item as bought:', error);
        showToast(error.message || 'Failed to mark item as bought', 'error');
    }
}

// Function to archive an item from the list
async function archiveItem(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to archive item');
        }
        showToast('Item archived', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error archiving item:', error);
        showToast(error.message || 'Failed to archive item', 'error');
    }
}

// Function to restore an archived item
async function restoreItem(itemId) {
    try {
        const response = await fetch(`/api/items/${itemId}/restore`, {
            method: 'PUT'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restore item');
        }
        showToast('Item restored', 'success');
        await fetchItems();
    } catch (error) {
        console.error('Error restoring item:', error);
        showToast(error.message || 'Failed to restore item', 'error');
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
        console.error('Error logging out:', error);
        showToast(error.message || 'Failed to log out', 'error');
    }
}

// Function to show bought items
async function showBoughtItems(event) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    (event.target || event.srcElement).classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    try {
        const response = await fetch('/api/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        const list = document.getElementById('shopping-list');
        list.innerHTML = '';
        let totalAmount = 0;
        items.filter(item => item.bought_date).forEach(item => {
            if (activeCategory && item.category !== activeCategory) return;
            
            const tr = document.createElement('tr');
            const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
            const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
            const totalPrice = item.price * item.quantity;
            totalAmount += totalPrice;
            
            const tdName = document.createElement('td');
            tdName.className = 'bought';
            tdName.textContent = item.name;
            
            const tdDate = document.createElement('td');
            tdDate.textContent = itemDate;
            
            const tdBoughtDate = document.createElement('td');
            tdBoughtDate.textContent = boughtDate;
            
            const tdCategory = document.createElement('td');
            tdCategory.textContent = item.category || 'N/A';
            
            const tdPrice = document.createElement('td');
            tdPrice.textContent = item.price;
            
            const tdQuantity = document.createElement('td');
            tdQuantity.textContent = item.quantity;
            
            const tdTotalPrice = document.createElement('td');
            tdTotalPrice.textContent = totalPrice.toFixed(2);
            
            const tdBoughtBy = document.createElement('td');
            tdBoughtBy.textContent = item.bought_by || '';
            
            const tdActions = document.createElement('td');
            const btnArchive = document.createElement('button');
            btnArchive.className = 'action-button archive-button';
            btnArchive.textContent = 'Archive';
            btnArchive.onclick = () => archiveItem(item.id);
            tdActions.appendChild(btnArchive);
            
            tr.appendChild(tdName);
            tr.appendChild(tdDate);
            tr.appendChild(tdBoughtDate);
            tr.appendChild(tdCategory);
            tr.appendChild(tdPrice);
            tr.appendChild(tdQuantity);
            tr.appendChild(tdTotalPrice);
            tr.appendChild(tdBoughtBy);
            tr.appendChild(tdActions);
            
            list.appendChild(tr);
        });
        document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
        document.getElementById('total-items').textContent = list.children.length;
        document.getElementById('purchased-count').textContent = '—';
        if (list.children.length === 0) {
            list.innerHTML = '<tr><td colspan="9" class="empty-state">No bought items found</td></tr>';
        }
    } catch (error) {
        console.error('Error showing bought items:', error);
        showToast('Failed to load bought items', 'error');
    }
}

// Function to show not bought items
async function showNotBoughtItems(event) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    (event.target || event.srcElement).classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    try {
        const response = await fetch('/api/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        const list = document.getElementById('shopping-list');
        list.innerHTML = '';
        let totalAmount = 0;
        items.filter(item => !item.bought_date).forEach(item => {
            if (activeCategory && item.category !== activeCategory) return;
            
            const tr = document.createElement('tr');
            const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
            const totalPrice = item.price * item.quantity;
            totalAmount += totalPrice;
            
            const tdName = document.createElement('td');
            tdName.textContent = item.name;
            
            const tdDate = document.createElement('td');
            tdDate.textContent = itemDate;
            
            const tdBoughtDate = document.createElement('td');
            tdBoughtDate.textContent = '';
            
            const tdCategory = document.createElement('td');
            tdCategory.textContent = item.category || 'N/A';
            
            const tdPrice = document.createElement('td');
            tdPrice.textContent = item.price;
            
            const tdQuantity = document.createElement('td');
            tdQuantity.textContent = item.quantity;
            
            const tdTotalPrice = document.createElement('td');
            tdTotalPrice.textContent = totalPrice.toFixed(2);
            
            const tdBoughtBy = document.createElement('td');
            tdBoughtBy.textContent = '';
            
            const tdActions = document.createElement('td');
            const btnBought = document.createElement('button');
            btnBought.className = 'action-button bought-button';
            btnBought.textContent = 'Bought';
            btnBought.onclick = () => markAsBought(item.id);
            
            const btnArchive = document.createElement('button');
            btnArchive.className = 'action-button archive-button';
            btnArchive.textContent = 'Archive';
            btnArchive.onclick = () => archiveItem(item.id);
            
            const btnEdit = document.createElement('button');
            btnEdit.className = 'action-button edit-button';
            btnEdit.textContent = 'Edit';
            btnEdit.onclick = () => enableEditing(tr);
            
            tdActions.appendChild(btnBought);
            tdActions.appendChild(btnArchive);
            tdActions.appendChild(btnEdit);
            
            tr.appendChild(tdName);
            tr.appendChild(tdDate);
            tr.appendChild(tdBoughtDate);
            tr.appendChild(tdCategory);
            tr.appendChild(tdPrice);
            tr.appendChild(tdQuantity);
            tr.appendChild(tdTotalPrice);
            tr.appendChild(tdBoughtBy);
            tr.appendChild(tdActions);
            
            list.appendChild(tr);
        });
        document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
        document.getElementById('total-items').textContent = list.children.length;
        document.getElementById('purchased-count').textContent = '—';
        if (list.children.length === 0) {
            list.innerHTML = '<tr><td colspan="9" class="empty-state">No unbought items found</td></tr>';
        }
    } catch (error) {
        console.error('Error showing not bought items:', error);
        showToast('Failed to load not bought items', 'error');
    }
}

// Function to show archived items
async function showArchivedItems(event) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    (event.target || event.srcElement).classList.add('active');
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    try {
        const response = await fetch('/api/items?includeArchived=true');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        const list = document.getElementById('shopping-list');
        list.innerHTML = '';
        let totalAmount = 0;
        items.filter(item => item.archived).forEach(item => {
            if (activeCategory && item.category !== activeCategory) return;
            
            const tr = document.createElement('tr');
            const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
            const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
            const totalPrice = item.price * item.quantity;
            totalAmount += totalPrice;
            
            const tdName = document.createElement('td');
            tdName.className = 'bought';
            tdName.textContent = item.name;
            
            const tdDate = document.createElement('td');
            tdDate.textContent = itemDate;
            
            const tdBoughtDate = document.createElement('td');
            tdBoughtDate.textContent = boughtDate;
            
            const tdCategory = document.createElement('td');
            tdCategory.textContent = item.category || 'N/A';
            
            const tdPrice = document.createElement('td');
            tdPrice.textContent = item.price;
            
            const tdQuantity = document.createElement('td');
            tdQuantity.textContent = item.quantity;
            
            const tdTotalPrice = document.createElement('td');
            tdTotalPrice.textContent = totalPrice.toFixed(2);
            
            const tdBoughtBy = document.createElement('td');
            tdBoughtBy.textContent = item.bought_by || '';
            
            const tdActions = document.createElement('td');
            tdActions.className = 'actions';
            const btnRestore = document.createElement('button');
            btnRestore.className = 'action-button bought-button';
            btnRestore.textContent = 'Restore';
            btnRestore.onclick = () => restoreItem(item.id);
            tdActions.appendChild(btnRestore);
            const btnEdit = document.createElement('button');
            btnEdit.className = 'action-button edit-button';
            btnEdit.textContent = 'Edit';
            btnEdit.onclick = () => enableEditing(tr);
            tdActions.appendChild(btnEdit);
            
            tr.appendChild(tdName);
            tr.appendChild(tdDate);
            tr.appendChild(tdBoughtDate);
            tr.appendChild(tdCategory);
            tr.appendChild(tdPrice);
            tr.appendChild(tdQuantity);
            tr.appendChild(tdTotalPrice);
            tr.appendChild(tdBoughtBy);
            tr.appendChild(tdActions);
            
            list.appendChild(tr);
        });
        document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
        document.getElementById('total-items').textContent = list.children.length;
        document.getElementById('purchased-count').textContent = '—';
        if (list.children.length === 0) {
            list.innerHTML = '<tr><td colspan="9" class="empty-state">No archived items found</td></tr>';
        }
    } catch (error) {
        console.error('Error showing archived items:', error);
        showToast('Failed to load archived items', 'error');
    }
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