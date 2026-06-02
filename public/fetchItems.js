// Function to fetch items from the server and display them in the table
async function fetchItems() {
    const response = await fetch('/api/items'); // Fetch items from the server
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('shopping-list'); // Get the shopping list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount
    let totalItems = 0;
    let purchasedCount = 0;
    
    const activeCategory = document.querySelector('.category-chip.active')?.dataset.category || '';
    const showBought = document.querySelector('.filter-buttons button[onclick*="showBoughtItems"]')?.classList.contains('active');
    const showNotBought = document.querySelector('.filter-buttons button[onclick*="showNotBoughtItems"]')?.classList.contains('active');
    const showArchived = document.querySelector('.filter-buttons button[onclick*="showArchivedItems"]')?.classList.contains('active');

    items.forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
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

        tr.innerHTML = `
            <td class="${item.bought_date ? 'bought' : ''}">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>
                <button class="action-button bought-button" onclick="markAsBought(${item.id})">Bought</button>
                <button class="action-button archive-button" onclick="archiveItem(${item.id})">Archive</button>
                <button class="action-button edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>
            </td>
        `;
        list.appendChild(tr);
    });
    
    document.getElementById('total-amount').textContent = `AZN ${totalAmount.toFixed(2)}`;
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('purchased-count').textContent = purchasedCount;
}

// Fetch and display the items when the page loads
fetchItems();
