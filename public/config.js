// Application configuration
module.exports = {
    // App settings
    appTitle: 'Shop-List',
    appDescription: 'Your personal shopping list manager',
    
    // Theme colors
    colors: {
        primary: '#059669', // green-600
        primaryDark: '#047857', // green-700
        secondary: '#3b82f6', // blue-500
        accent: '#f59e0b', // amber-500
        danger: '#ef4444', // red-500
        warning: '#f59e0b', // amber-500
        success: '#10b981', // green-500
        info: '#3b82f6', // blue-500
    },
    
    // Predefined categories
    categories: ['Dairy', 'Produce', 'Meat', 'Bakery', 'Beverages', 'Pantry', 'Frozen', 'Household'],
    
    // Date format
    dateFormat: 'YYYY-MM-DD',
    datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
    
    // Session settings
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    
    // Toast notification settings
    toastDuration: 3000, // ms
};