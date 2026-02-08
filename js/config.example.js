// Dird Plesk Memorial - Configuration Example
// Copy this file to config.js and fill in your values
// DO NOT commit config.js to version control

const APP_CONFIG = {
    // Firebase Configuration
    // Get these values from Firebase Console > Project Settings > Your Apps
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT",
        storageBucket: "YOUR_PROJECT.firebasestorage.app",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    },

    // Site Access Password (for site-wide gate)
    // Users must enter this to access the site
    sitePassword: 'your-site-password',

    // Admin Password (for admin login)
    // Required to access admin features
    adminPassword: 'your-admin-password'
};
