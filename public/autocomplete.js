// Function to provide autocomplete suggestions based on the user's input
async function autocomplete() {
    const input = document.getElementById('item-name'); // Get the input field
    const val = input.value; // Get the input value
    if (!val) {
        document.getElementById('autocomplete-list').innerHTML = ''; // Clear the autocomplete list if input is empty
        return;
    }

    const response = await fetch('/api/items'); // Fetch items from the server
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
