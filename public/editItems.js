// Edit items functionality
let currentUser = null;

// Initialize the page
async function init() {
    await checkAuthentication();
    setupEventListeners();
}

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/current-user');
        if (!response.ok) {
            showToast('Please login first', 'error');
            window.location.href = '/login.html';
            return;
        }
        currentUser = await response.json();
    } catch (error) {
        console.error('Auth check error:', error);
        showToast('Authentication failed', 'error');
        window.location.href = '/login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Edit button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const row = e.target.closest('tr');
            if (row) {
                enableEditing(row);
            }
        }
        
        // Save button clicks
        if (e.target.classList.contains('save-btn')) {
            saveChanges(e.target);
        }
        
        // Cancel button clicks
        if (e.target.classList.contains('cancel-btn')) {
            cancelEditing(e.target);
        }
    });
    
    // Form submission
    const editForm = document.querySelector('.edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveFromForm();
        });
    }
}

// Enable editing for a row
function enableEditing(row) {
    const itemId = row.dataset.id;
    const itemName = row.dataset.name;
    const itemDate = row.dataset.date;
    const itemBoughtDate = row.dataset.boughtdate || '';
    
    // Create edit modal
    showModal('Edit Item', `
        <div class="edit-form">
            <input type="hidden" name="id" value="${itemId}">
            <input type="hidden" name="date" value="${itemDate}">
            <input type="hidden" name="bought_date" value="${itemBoughtDate}">
            
            <div class="form-group">
                <label for="edit-name">Item Name:</label>
                <input type="text" id="edit-name" name="name" class="form-control" value="${itemName}" required>
            </div>
            
            <div class="form-group">
                <label for="edit-category">Category:</label>
                <select id="edit-category" name="category" class="form-control">
                    <option value="">Select Category</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Produce">Produce</option>
                    <option value="Meat">Meat</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Household">Household</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="edit-price">Price:</label>
                <input type="number" id="edit-price" name="price" class="form-control" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="edit-quantity">Quantity:</label>
                <input type="number" id="edit-quantity" name="quantity" class="form-control" min="1" required>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
            </div>
        </div>
    `);
}

// Save changes from form
async function saveFromForm() {
    const form = document.querySelector('.edit-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const item = {
        id: formData.get('id'),
        name: formData.get('name'),
        date: formData.get('date'),
        bought_date: formData.get('bought_date') || null,
        category: formData.get('category') || '',
        price: parseFloat(formData.get('price')),
        quantity: parseInt(formData.get('quantity'))
    };
    
    try {
        const response = await fetch(`/api/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        
        if (response.ok) {
            showToast('Item updated successfully', 'success');
            closeModal();
            fetchItems();
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to update item', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update item', 'error');
    }
}

// Save changes from inline editing
async function saveChanges(button) {
    const row = button.closest('tr');
    const itemId = row.dataset.id;
    const itemName = row.querySelector('[data-field="name"]').value;
    const itemPrice = parseFloat(row.querySelector('[data-field="price"]').value);
    const itemQuantity = parseInt(row.querySelector('[data-field="quantity"]').value);
    
    const item = {
        id: itemId,
        name: itemName,
        date: row.dataset.date,
        bought_date: row.dataset.boughtdate || null,
        category: row.dataset.category || '',
        price: itemPrice,
        quantity: itemQuantity
    };
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        
        if (response.ok) {
            showToast('Item updated successfully', 'success');
            fetchItems();
        } else {
            showToast('Failed to update item', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update item', 'error');
    }
}

// Cancel editing
function cancelEditing(button) {
    const row = button.closest('tr');
    if (row) {
        // Restore original values
        row.querySelector('[data-field="name"]').value = row.dataset.name;
        row.querySelector('[data-field="price"]').value = row.dataset.price;
        row.querySelector('[data-field="quantity"]').value = row.dataset.quantity;
        row.dataset.category = row.dataset.category;
    }
    closeModal();
}

// Show modal
function showModal(title, content) {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-content').innerHTML = content;
        modal.classList.add('show');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);