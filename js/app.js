// Dird Plesk Memorial Open Invitational of Champions - Main Application
// UI rendering and page-specific logic
// Depends on: utils.js, firebase.js, auth.js

// Render player grid on homepage (sorted alphabetically by display name)
function renderPlayerGrid() {
    const grid = document.getElementById('playerGrid');
    if (!grid) return;

    const players = getPlayers();
    grid.innerHTML = '';

    // Convert to array and sort alphabetically by name
    const playerArray = Object.entries(players)
        .map(([slot, data]) => ({ slot: parseInt(slot), ...data }))
        .sort((a, b) => a.name.localeCompare(b.name));

    playerArray.forEach(player => {
        const btn = document.createElement('button');
        btn.className = player.isAdmin ? 'player-btn admin-btn' : 'player-btn';
        btn.textContent = player.name;
        btn.onclick = () => loginAsPlayer(player.slot);
        grid.appendChild(btn);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initData();
    updateUI();

    const path = window.location.pathname;

    // Apply site settings to hero on all pages
    applyHeroSettings();

    if (path === '/' || path === '/index.html') {
        renderPlayerGrid();
    }

    if (path === '/admin' || path === '/admin.html') {
        renderPlayerList();
        renderSiteSettings();
        renderCustomEventsAdmin();
        renderTriviaQuestionAdmin();
        renderTriviaGameControls();
        renderPredictionsAdmin();
    }

    if (path === '/leaderboard' || path === '/leaderboard.html') {
        renderLeaderboards();
    }

    if (path === '/golf' || path === '/golf.html') {
        renderGolfScorecard();
    }

    if (path === '/events' || path === '/events.html') {
        renderEventsPage();
    }

    if (path === '/trivia' || path === '/trivia.html') {
        renderTriviaPage();
        // Admin controls are rendered if admin
        if (isAdmin()) {
            renderTriviaQuestionAdmin();
            renderTriviaGameControls();
        }
    }

    if (path === '/predictions' || path === '/predictions.html') {
        renderPredictionsPage();
    }

    if (path === '/profile' || path === '/profile.html') {
        renderProfile();
    }

    // Check for unanswered predictions banner
    setTimeout(updatePredictionsBanner, 500);

    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitPassword();
            }
        });
    }

    // Firebase handles real-time updates automatically via listeners
});
