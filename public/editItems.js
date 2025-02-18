// Function to enable editing of a row
function enableEditing(row) {
    const cells = row.querySelectorAll('td');
    // In the first cell, insert both the visible text input and a hidden input for item id
    cells[0].innerHTML = `
        <input type="text" value="${cells[0].textContent}">
        <input type="hidden" class="item-id" value="${row.dataset.id}">
    `;
    // Allow editing for price (index 3) and quantity (index 4)
    [3, 4].forEach(i => {
        const cell = cells[i];
        const value = cell.textContent;
        cell.innerHTML = `<input type="text" value="${value}">`;
    });
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = `<button onclick="saveChanges(this)">Save</button>`;
}

// Function to save changes made to a row
async function saveChanges(button) {
    const row = button.closest('tr');
    // Retrieve the id from the hidden input
    const itemId = row.querySelector('.item-id').value;
    const cells = row.querySelectorAll('td');
    const updatedItem = {
        id: itemId,
        name: cells[0].querySelector('input').value,
        // Use stored original date values (unchanged)
        date: row.dataset.date,
        bought_date: row.dataset.boughtdate || null,
        price: parseFloat(cells[3].querySelector('input').value),
        quantity: parseInt(cells[4].querySelector('input').value),
    };
    // Compute total on the server side (or here as price * quantity)
    updatedItem.total = updatedItem.price * updatedItem.quantity;
    await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
    });
    fetchItems();
}
