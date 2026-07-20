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

// Sort state
let sortState = { column: '', direction: 'asc' };

function sortItems(items) {
    if (!sortState.column) return items;
    const col = sortState.column;
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
        let va = a[col], vb = b[col];
        if (col === 'total') { va = a.price * a.quantity; vb = b.price * b.quantity; }
        if (va == null) va = '';
        if (vb == null) vb = '';
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
    });
}

async function fetchItems() {
    showLoading();
    try {
        const buttons = document.querySelectorAll('.filter-buttons button');
        let filterType = 'all';
        buttons.forEach(btn => {
            if (btn.classList.contains('active')) {
                const t = btn.dataset.filter;
                if (t) filterType = t;
            }
        });
        const isArchived = filterType === 'archived';
        const url = isArchived ? '/api/items?includeArchived=true' : '/api/items';
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

        items = sortItems(items);
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;
            tr.dataset.name = item.name;
            tr.dataset.date = item.date;
            tr.dataset.boughtdate = item.bought_date || '';
            tr.dataset.category = item.category || '';
            tr.dataset.price = item.price;
            tr.dataset.quantity = item.quantity;
            tr.dataset.notes = item.notes || '';
            const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false });
            const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : '';
            const totalPrice = item.price * item.quantity;
            totalAmount += totalPrice;
            totalItems++;
            if (item.bought_date) purchasedCount++;

            const category = item.category || 'All Categories';
            const matchesCategory = !activeCategory || category === activeCategory;
            const isBought = !!item.bought_date;
            const matchesFilter = filterType === 'all' ||
                (filterType === 'bought' && isBought) ||
                (filterType === 'not-bought' && !isBought) ||
                (filterType === 'archived' && item.archived);

            if (!matchesCategory || !matchesFilter) return;

            const tdCheck = document.createElement('td');
            tdCheck.className = 'select-col';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'item-checkbox';
            cb.dataset.id = item.id;
            cb.onchange = updateBulkBar;
            tdCheck.appendChild(cb);

            const tdName = document.createElement('td');
            tdName.dataset.label = 'Item';
            tdName.className = item.bought_date ? 'bought' : '';
            tdName.textContent = item.name;
            if (item.notes) {
                tdName.title = item.notes;
                const noteIcon = document.createElement('span');
                noteIcon.className = 'note-indicator';
                noteIcon.textContent = ' 📝';
                noteIcon.title = item.notes;
                tdName.appendChild(noteIcon);
            }
            
            const tdDate = document.createElement('td');
            tdDate.dataset.label = 'Date';
            tdDate.textContent = itemDate;
            
            const tdBoughtDate = document.createElement('td');
            tdBoughtDate.dataset.label = 'Bought';
            tdBoughtDate.textContent = boughtDate;
            
            const tdCategory = document.createElement('td');
            tdCategory.dataset.label = 'Category';
            tdCategory.textContent = item.category || 'N/A';
            
            const tdPrice = document.createElement('td');
            tdPrice.dataset.label = 'Price';
            if (isBought) {
                tdPrice.textContent = item.price;
            } else {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = item.price;
                input.step = '0.01';
                input.className = 'price-input';
                input.onchange = () => updatePrice(item.id, input.value);
                tdPrice.appendChild(input);
            }
            
            const tdQuantity = document.createElement('td');
            tdQuantity.dataset.label = 'Qty';
            if (isBought) {
                tdQuantity.textContent = item.quantity;
            } else {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = item.quantity;
                input.min = '1';
                input.step = '1';
                input.className = 'quantity-input';
                input.onchange = () => updateQuantity(item.id, input.value);
                tdQuantity.appendChild(input);
            }
            
            const tdTotalPrice = document.createElement('td');
            tdTotalPrice.dataset.label = 'Total';
            tdTotalPrice.textContent = totalPrice.toFixed(2);
            
            const tdBoughtBy = document.createElement('td');
            tdBoughtBy.dataset.label = 'Bought By';
            tdBoughtBy.textContent = item.bought_by || '';
            
            const tdActions = document.createElement('td');
            const actionButtons = [];
            if (!isBought) {
                const btnBought = document.createElement('button');
                btnBought.className = 'action-button bought-button';
                btnBought.textContent = 'Bought';
                btnBought.onclick = () => markAsBought(item.id);
                actionButtons.push(btnBought);
                
                const btnEdit = document.createElement('button');
                btnEdit.className = 'action-button edit-button';
                btnEdit.textContent = 'Edit';
                btnEdit.onclick = () => enableEditing(tr);
                actionButtons.push(btnEdit);
            }
            const btnArchive = document.createElement('button');
            btnArchive.className = 'action-button archive-button';
            btnArchive.textContent = 'Archive';
            btnArchive.onclick = () => archiveItem(item.id);
            actionButtons.push(btnArchive);
            actionButtons.forEach(btn => tdActions.appendChild(btn));
            
            tr.appendChild(tdCheck);
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
            list.innerHTML = '<tr><td colspan="10" class="empty-state">No items found</td></tr>';
        }
        hideLoading();
    } catch (error) {
        hideLoading();
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
    const itemName = cells[1].textContent;
    const itemPrice = cells[5].querySelector('input')?.value || 0;
    const itemQuantity = cells[6].querySelector('input')?.value || 1;
    const itemCategory = cells[4].textContent;
    
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
    
    cells[1].replaceWith(nameInput);
    cells[4].replaceWith(categoryInput);
    cells[5].replaceWith(priceInput);
    cells[6].replaceWith(quantityInput);
    
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
    
    const item = {
        id: itemId,
        name: row.querySelector('.item-input')?.value,
        category: row.querySelector('.edit-category-input')?.value,
        price: parseFloat(row.querySelector('.edit-price-input')?.value) || 0,
        quantity: parseInt(row.querySelector('.edit-quantity-input')?.value) || 1
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

// Function to add a new item to the list
async function addItem() {
    showLoading();
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Not logged in');
        }

        const itemName = document.getElementById('item-name').value.trim();
        const itemPrice = parseFloat(document.getElementById('item-price').value) || 0.00;
        const itemQuantity = parseInt(document.getElementById('item-quantity').value) || 1;
        const itemCategory = document.getElementById('item-category').value;
        const itemNotes = document.getElementById('item-notes').value.trim();

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
            notes: itemNotes || null,
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
        document.getElementById('item-notes').value = '';

        hideLoading();
        showToast('Item added successfully!', 'success');
        await fetchItems();
    } catch (error) {
        hideLoading();
        console.error('Error adding item:', error);
        showToast(error.message || 'Failed to add item', 'error');
    }
}

// Function to mark an item as bought
async function markAsBought(itemId) {
    showLoading();
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

        hideLoading();
        showToast('Item marked as bought', 'success');
        await fetchItems();
    } catch (error) {
        hideLoading();
        console.error('Error marking item as bought:', error);
        showToast(error.message || 'Failed to mark item as bought', 'error');
    }
}

// Undo state for archive
let pendingUndo = null;

// Function to archive an item from the list
async function archiveItem(itemId) {
    if (!confirm('Are you sure you want to archive this item?')) return;
    if (pendingUndo) {
        clearTimeout(pendingUndo.timeout);
        pendingUndo = null;
    }
    showLoading();
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to archive item');
        }
        hideLoading();

        const undoTimeout = setTimeout(() => {
            pendingUndo = null;
        }, 10000);

        pendingUndo = { itemId, timeout: undoTimeout };

        showToast('Item archived', 'info', 10000, {
            label: 'Undo',
            callback: async () => {
                clearTimeout(undoTimeout);
                pendingUndo = null;
                showLoading();
                try {
                    const restoreResponse = await fetch(`/api/items/${itemId}/restore`, {
                        method: 'PUT'
                    });
                    if (!restoreResponse.ok) {
                        const err = await restoreResponse.json();
                        throw new Error(err.error || 'Failed to restore item');
                    }
                    hideLoading();
                    showToast('Item restored', 'success');
                    await fetchItems();
                } catch (error) {
                    hideLoading();
                    console.error('Error restoring item:', error);
                    showToast(error.message || 'Failed to restore item', 'error');
                }
            }
        });

        await fetchItems();
    } catch (error) {
        hideLoading();
        console.error('Error archiving item:', error);
        showToast(error.message || 'Failed to archive item', 'error');
    }
}

// Function to restore an archived item
async function restoreItem(itemId) {
    showLoading();
    try {
        const response = await fetch(`/api/items/${itemId}/restore`, {
            method: 'PUT'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restore item');
        }
        hideLoading();
        showToast('Item restored', 'success');
        await fetchItems();
    } catch (error) {
        hideLoading();
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

// Function to show filtered items (bought/not-bought/archived)
async function showFilteredItems(type) {
    const buttons = document.querySelectorAll('.filter-buttons button');
    buttons.forEach(btn => btn.classList.remove('active'));
    buttons.forEach(btn => {
        if (btn.dataset.filter === type) btn.classList.add('active');
    });
    
    await fetchItems();
}

function exportCSV() {
    const buttons = document.querySelectorAll('.filter-buttons button');
    let includeArchived = false;
    buttons.forEach(btn => {
        if (btn.classList.contains('active') && btn.dataset.filter === 'archived') includeArchived = true;
    });
    window.open(`/api/items/export/csv?includeArchived=${includeArchived}`, '_blank');
}

// ===== BULK SELECT =====
function toggleSelectAll(cb) {
    document.querySelectorAll('.item-checkbox').forEach(c => c.checked = cb.checked);
    updateBulkBar();
}

function updateBulkBar() {
    const checked = document.querySelectorAll('.item-checkbox:checked');
    const bar = document.getElementById('bulk-bar');
    const label = document.getElementById('bulk-label');
    if (checked.length === 0) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';
    label.textContent = `${checked.length} selected`;
}

function clearSelection() {
    document.querySelectorAll('.item-checkbox').forEach(c => c.checked = false);
    document.getElementById('select-all').checked = false;
    updateBulkBar();
}

function getSelectedIds() {
    return Array.from(document.querySelectorAll('.item-checkbox:checked')).map(c => c.dataset.id);
}

async function bulkBought() {
    const ids = getSelectedIds();
    if (!ids.length) return;
    if (!confirm(`Mark ${ids.length} item(s) as bought?`)) return;
    showLoading();
    try {
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) throw new Error('Not logged in');
        const user = await userResponse.json();
        for (const id of ids) {
            await fetch(`/api/items/${id}/bought`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bought_by: user.username })
            });
        }
        hideLoading();
        showToast(`${ids.length} item(s) marked as bought`, 'success');
        clearSelection();
        await fetchItems();
    } catch (error) {
        hideLoading();
        showToast(error.message || 'Bulk buy failed', 'error');
    }
}

async function bulkArchive() {
    const ids = getSelectedIds();
    if (!ids.length) return;
    if (!confirm(`Archive ${ids.length} item(s)?`)) return;
    showLoading();
    try {
        for (const id of ids) {
            await fetch(`/api/items/${id}`, { method: 'DELETE' });
        }
        hideLoading();
        showToast(`${ids.length} item(s) archived`, 'success');
        clearSelection();
        await fetchItems();
    } catch (error) {
        hideLoading();
        showToast(error.message || 'Bulk archive failed', 'error');
    }
}

async function bulkDelete() {
    const ids = getSelectedIds();
    if (!ids.length) return;
    if (!confirm(`Permanently delete ${ids.length} item(s)? This cannot be undone.`)) return;
    if (!confirm(`Are you sure? This will permanently remove ${ids.length} item(s) from the database.`)) return;
    showLoading();
    try {
        for (const id of ids) {
            await fetch(`/api/items/${id}/hard-delete`, { method: 'DELETE' });
        }
        hideLoading();
        showToast(`${ids.length} item(s) deleted permanently`, 'success');
        clearSelection();
        await fetchItems();
    } catch (error) {
        hideLoading();
        showToast(error.message || 'Bulk delete failed', 'error');
    }
}

// ===== FREQUENT ITEMS =====
async function loadFrequentItems() {
    try {
        const response = await fetch('/api/items/frequent');
        if (!response.ok) return;
        const items = await response.json();
        const container = document.getElementById('frequent-items');
        const section = document.getElementById('frequent-section');
        if (!container || !items.length) {
            if (section) section.style.display = 'none';
            return;
        }
        container.innerHTML = '';
        items.forEach(item => {
            const chip = document.createElement('span');
            chip.className = 'frequent-chip';
            chip.innerHTML = `${item.name} <small>(${item.freq})</small>`;
            chip.title = `${item.category || ''} — AZN ${parseFloat(item.price).toFixed(2)}`;
            chip.onclick = () => {
                document.getElementById('item-name').value = item.name;
                if (item.category) document.getElementById('item-category').value = item.category;
                document.getElementById('item-name').focus();
            };
            container.appendChild(chip);
        });
        if (section) section.style.display = 'block';
    } catch (_) { /* ignore */ }
}

// Initialize category filter chips, sortable columns, and quick-add keyboard
document.addEventListener('DOMContentLoaded', () => {
    initCategoryFilter();
    initSortableColumns();
    initQuickAddKeyboard();
    loadFrequentItems();
});

function initQuickAddKeyboard() {
    const fields = ['item-name', 'item-category', 'item-price', 'item-quantity'];
    fields.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (i < fields.length - 1) {
                    const next = document.getElementById(fields[i + 1]);
                    if (next) next.focus();
                } else {
                    addItem();
                }
            }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addItem();
            }
        });
    });

    // Ctrl+Enter on notes textarea submits
    const notesEl = document.getElementById('item-notes');
    if (notesEl) {
        notesEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addItem();
            }
        });
    }
}

function initSortableColumns() {
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortState.column === col) {
                sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortState.column = col;
                sortState.direction = 'asc';
            }
            document.querySelectorAll('th.sortable').forEach(h => {
                h.classList.remove('asc', 'desc');
            });
            th.classList.add(sortState.direction);
            fetchItems();
        });
    });
}

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