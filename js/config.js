// Dird Plesk Memorial - Configuration
// This file contains sensitive configuration values
// IMPORTANT: This file should be added to .gitignore for production use

const APP_CONFIG = {
    // Firebase Configuration
    firebase: {
        apiKey: "AIzaSyD-bbGBqC58dvjqJhdFLHaTBfp1FGpuPHM",
        authDomain: "bp-games-tracker.firebaseapp.com",
        databaseURL: "https://bp-games-tracker-default-rtdb.firebaseio.com",
        projectId: "bp-games-tracker",
        storageBucket: "bp-games-tracker.firebasestorage.app",
        messagingSenderId: "983654017455",
        appId: "1:983654017455:web:81ff968449c7320d1fe75a"
    },

    // Site Access Password (for site-wide gate)
    sitePassword: 'austin',

    // Admin Password (for admin login)
    adminPassword: '1816'
};
