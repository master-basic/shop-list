// Function to get the current month name
function getMonthName() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const now = new Date();
    return monthNames[now.getMonth()]; // Return the current month name
}

// Set the month name in the HTML element with id 'month-name'
document.getElementById('month-name').textContent = getMonthName();

// Function to fetch items from the server and display them in the table
async function fetchItems() {
    const response = await fetch('/api/items'); // Fetch items from the server
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('shopping-list'); // Get the shopping list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount
    items.forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
        tr.dataset.id = item.id;
        // Store original ISO date values for later use in editing
        tr.dataset.date = item.date;
        tr.dataset.boughtdate = item.bought_date || '';
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false }); // Format the item date to EU standard with 24-hour time format
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : ''; // Format the bought date if available
        const totalPrice = item.price * item.quantity; // Calculate the total price
        totalAmount += totalPrice; // Add to the total amount

        // Modify price and quantity fields to be readonly when item is bought
        const priceField = item.bought_date ? 
            item.price : 
            `<input type="number" value="${item.price}" step="0.01">`;
        const quantityField = item.bought_date ? 
            item.quantity : 
            `<input type="number" value="${item.quantity}" min="1" step="1">`;

        tr.innerHTML = `
            <td class="${item.bought_date ? 'bought' : ''}">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${priceField}</td>
            <td>${quantityField}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td>${item.created_by || ''}</td>
            <td>
                ${!item.bought_date ? `<button class="button" onclick="markAsBought(${item.id})">Bought</button>` : ''}
                <button class="button" onclick="archiveItem(${item.id})">Archive</button>
                ${!item.bought_date ? `<button class="button" onclick="enableEditing(this.closest('tr'))">Edit</button>` : ''}
            </td>
        `; // Set the inner HTML of the row
        list.appendChild(tr); // Append the row to the list
    });
    document.getElementById('total-amount').textContent = `Total: AZN ${totalAmount.toFixed(2)}`; // Display the total amount
    populateItemSelect(items); // Populate the item select dropdown
}

// Function to enable editing of a row
function enableEditing(row) {
    const cells = row.querySelectorAll('td');
    for (let i = 0; i < cells.length - 1; i++) {
        const cell = cells[i];
        const value = cell.textContent;
        cell.innerHTML = `<input type="text" value="${value}">`;
    }
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = `
        <button class="button" onclick="saveChanges(this)">Save</button>
        <button class="button" onclick="cancelEditing(this)">Cancel</button>
    `;
}

// Function to save changes made to a row
async function saveChanges(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');
    const item = {
        id: row.dataset.id,
        name: cells[0].querySelector('input').value,
        date: new Date(cells[1].querySelector('input').value).toISOString(),
        bought_date: cells[2].querySelector('input').value ? new Date(cells[2].querySelector('input').value).toISOString() : null,
        price: parseFloat(cells[3].querySelector('input').value),
        quantity: parseInt(cells[4].querySelector('input').value),
        total: parseFloat(cells[5].querySelector('input').value)
    };

    await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    });

    fetchItems();
}

// Function to cancel editing of a row
function cancelEditing(button) {
    fetchItems(); // Refresh the list to discard changes
}

// Function to populate the item select dropdown
function populateItemSelect(items) {
    const select = document.getElementById('item-select');
    if (!select) return; // Exit if element is not found
    select.innerHTML = ''; // Clear the current options
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

        if (!itemName) {
            alert('Please enter an item name');
            return;
        }

        const itemData = {
            name: itemName,
            price: itemPrice,
            quantity: itemQuantity,
            date: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        console.log('Sending request:', itemData);

        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });

        const text = await response.text();
        console.log('Raw response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid JSON response from server: ' + text);
        }

        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }

        // Clear form
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        document.getElementById('item-quantity').value = '';

        await fetchItems();
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

// Function to mark an item as bought
async function markAsBought(itemId) {
    try {
        // Get the current user first
        const userResponse = await fetch('/api/current-user');
        if (!userResponse.ok) {
            throw new Error('Please log in to mark items as bought');
        }
        const currentUser = await userResponse.json();

        const response = await fetch(`/api/items/${itemId}/bought`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bought_by: currentUser.username
            })
        });

        if (!response.ok) {
            throw new Error('Failed to mark item as bought');
        }

        await fetchItems();
    } catch (error) {
        alert(error.message);
    }
}

// Function to archive an item from the list
async function archiveItem(itemId) {
    const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
    }); // Send a DELETE request to archive the item
    if (!response.ok) {
        alert('Failed to archive item');
        return;
    }
    fetchItems(); // Refresh the list
}

// Function to provide autocomplete suggestions based on the user's input
async function autocomplete() {
    const input = document.getElementById('item-name'); // Get the input field
    const val = input.value; // Get the input value
    if (!val) {
        document.getElementById('autocomplete-list').innerHTML = ''; // Clear the autocomplete list if input is empty
        return;
    }

    const response = await fetch('/api/items'); // Fetch items from the server
    if (!response.ok) {
        alert('Failed to fetch items');
        return;
    }
    const items = await response.json(); // Parse the JSON response
    const matches = items.filter(item => item.name.toLowerCase().includes(val.toLowerCase())); // Filter items based on the input value
    const list = document.getElementById('autocomplete-list'); // Get the autocomplete list element
    list.innerHTML = ''; // Clear the current list
    matches.forEach(match => {
        const div = document.createElement('div'); // Create a new div for each match
        div.textContent = match.name; // Set the text content to the item name
        div.classList.add('autocomplete-items'); // Add the autocomplete-items class
        div.onclick = () => {
            input.value = match.name; // Set the input value to the selected item name
            list.innerHTML = ''; // Clear the autocomplete list
        };
        list.appendChild(div); // Append the div to the list
    });
}

// Function to generate a report
function generateReport() {
    window.location.href = 'report.html'; // Redirect to the report page
}

// Function to log out the user
async function logout() {
    const response = await fetch('/api/logout', {
        method: 'POST'
    });
    if (!response.ok) {
        alert('Failed to log out');
        return;
    }
    window.location.href = 'login.html'; // Redirect to the login page
}

// Function to show bought items
async function showBoughtItems() {
    const response = await fetch('/api/items'); // Fetch items from the server
    if (!response.ok) {
        alert('Failed to fetch items');
        return;
    }
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('shopping-list'); // Get the shopping list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount
    items.filter(item => item.bought).forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false }); // Format the item date to EU standard with 24-hour time format
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : ''; // Format the bought date if available
        const totalPrice = item.price * item.quantity; // Calculate the total price
        totalAmount += totalPrice; // Add to the total amount
        tr.innerHTML = `
            <td class="${item.bought ? 'bought' : ''}">${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>
                <button class="button" onclick="archiveItem(${item.id})">Archive</button>
            </td>
        `; // Set the inner HTML of the row
        list.appendChild(tr); // Append the row to the list
    });
    document.getElementById('total-amount').textContent = `Total: AZN ${totalAmount.toFixed(2)}`; // Display the total amount
}

// Function to show not bought items
async function showNotBoughtItems() {
    const response = await fetch('/api/items'); // Fetch items from the server
    if (!response.ok) {
        alert('Failed to fetch items');
        return;
    }
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('shopping-list'); // Get the shopping list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount
    items.filter(item => !item.bought).forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false }); // Format the item date to EU standard with 24-hour time format
        const totalPrice = item.price * item.quantity; // Calculate the total price
        totalAmount += totalPrice; // Add to the total amount
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${itemDate}</td>
            <td></td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${totalPrice.toFixed(2)}</td>
            <td>
                <button class="button" onclick="markAsBought(${item.id})">Bought</button>
                <button class="button" onclick="archiveItem(${item.id})">Archive</button>
                <button class="button" onclick="enableEditing(this.closest('tr'))">Edit</button>
            </td>
        `; // Set the inner HTML of the row
        list.appendChild(tr); // Append the row to the list
    });
    document.getElementById('total-amount').textContent = `Total: AZN ${totalAmount.toFixed(2)}`; // Display the total amount
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

// Example usage after adding an item:
// updateItemList("<p>New item added</p>");