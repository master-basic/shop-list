// Function to set default date range to the current month
function setDefaultDateRange() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDateInput.value = firstDay.toISOString().split('T')[0];
    endDateInput.value = lastDay.toISOString().split('T')[0];
}

// Function to enable editing of a row
function enableEditing(row) {
    const cells = row.querySelectorAll('td');
    for (let i = 1; i < cells.length - 1; i++) {
        const cell = cells[i];
        const value = cell.textContent;
        cell.innerHTML = `<input type="text" value="${value}">`;
    }
    const actionsCell = cells[cells.length - 1];
    actionsCell.innerHTML = `<button onclick="saveChanges(this)">Save</button>`;
}

// Function to save changes made to a row
async function saveChanges(button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');
    const item = {
        name: cells[0].textContent,
        date: new Date(cells[1].querySelector('input').value).toISOString(),
        bought_date: cells[2].querySelector('input').value ? new Date(cells[2].querySelector('input').value).toISOString() : null,
        price: parseFloat(cells[3].querySelector('input').value),
        quantity: parseInt(cells[4].querySelector('input').value),
        total: parseFloat(cells[5].querySelector('input').value)
    };

    await fetch(`/api/items/${item.name}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    });

    generateReport();
}

// Function to generate a report based on the selected date range
async function generateReport() {
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    endDate.setHours(23, 59, 59, 999); // Set the end date to the end of the day

    const response = await fetch('/api/items?includeArchived=true'); // Fetch items from the server, including archived items
    const items = await response.json(); // Parse the JSON response
    const list = document.getElementById('report-list'); // Get the report list element
    list.innerHTML = ''; // Clear the current list
    let totalAmount = 0; // Initialize total amount

    const filteredItems = items.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
    });

    const itemMap = new Map();

    filteredItems.forEach(item => {
        const key = `${item.name}-${item.price}`;
        if (itemMap.has(key)) {
            const existingItem = itemMap.get(key);
            existingItem.quantity += item.quantity;
            existingItem.totalPrice += item.price * item.quantity;
        } else {
            itemMap.set(key, {
                ...item,
                totalPrice: item.price * item.quantity
            });
        }
    });

    itemMap.forEach(item => {
        const tr = document.createElement('tr'); // Create a new table row
        const itemDate = new Date(item.date).toLocaleString('en-GB', { hour12: false }); // Format the item date to EU standard with 24-hour time format
        const boughtDate = item.bought_date ? new Date(item.bought_date).toLocaleString('en-GB', { hour12: false }) : ''; // Format the bought date if available
        totalAmount += item.totalPrice; // Add to the total amount
        // Updated row to include a cell for "Bought By"
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${itemDate}</td>
            <td>${boughtDate}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
            <td>${item.totalPrice.toFixed(2)}</td>
            <td>${item.bought_by || ''}</td>
            <td><button onclick="enableEditing(this.closest('tr'))">Edit</button></td>
        `; // Set the inner HTML of the row
        list.appendChild(tr); // Append the row to the list
    });

    // Display the total amount using the correct element id
    document.getElementById('report-total').textContent = `Total: ${totalAmount.toFixed(2)} AZN`; // Display the total amount

    // Compute spending per buyer from filtered items having a buyer
    const spendingByBuyer = {};
    filteredItems.forEach(item => {
        if (item.bought_by) {
            spendingByBuyer[item.bought_by] = (spendingByBuyer[item.bought_by] || 0) + item.price * item.quantity;
        }
    });
    // Update buyer summary container if it exists
    const buyerSummaryContainer = document.getElementById('buyer-summary');
    if (buyerSummaryContainer) {
        let buyerSummaryHTML = '<h3>Buyer Totals</h3><ul>';
        for (const buyer in spendingByBuyer) {
            buyerSummaryHTML += `<li>${buyer}: ${spendingByBuyer[buyer].toFixed(2)} AZN</li>`;
        }
        buyerSummaryHTML += '</ul>';
        buyerSummaryContainer.innerHTML = buyerSummaryHTML;
    }
}

// Function to log out the user
async function logout() {
    await fetch('/api/logout', {
        method: 'POST'
    });
    window.location.href = 'login.html'; // Redirect to the login page
}

// Set default date range when the page loads
window.onload = setDefaultDateRange;

// Initial load of report after DOM is loaded
document.addEventListener('DOMContentLoaded', generateReport);