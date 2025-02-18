// Function to fetch items from the server and display them in the table
async function fetchItems() {
    const response = await fetch('/api/items'); // Fetch items from the server
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('shopping-list'); // Get the shopping list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount
    items.forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
        tr.dataset.id = item.id; // Set the item id
        // Add these two lines to store date values
        tr.dataset.date = item.date;
        tr.dataset.boughtdate = item.bought_date || '';
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false }); // Format the item date to EU standard with 24-hour time format
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : ''; // Format the bought date if available
        const totalPrice = item.price * item.quantity; // Calculate the total price
        totalAmount += totalPrice; // Add to the total amount
        tr.innerHTML = `
            <td class="${item.bought_date ? 'bought' : ''}">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>${item.created_by}</td>
            <td>
                <button class="bought-button" onclick="markAsBought(${item.id})">Bought</button>
                <button class="delete-button" onclick="archiveItem(${item.id})">Hide</button>
                <button class="edit-button" onclick="enableEditing(this.closest('tr'))">Edit</button>
            </td>
        `; // Set the inner HTML of the row
        list.appendChild(tr); // Append the row to the list
    });
    document.getElementById('total-amount').textContent = `Total: AZN ${totalAmount.toFixed(2)}`; // Display the total amount
    populateItemSelect(items); // Populate the item select dropdown
}

// Fetch and display the items when the page loads
fetchItems();
