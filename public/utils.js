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
