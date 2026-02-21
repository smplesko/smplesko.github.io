// Dird Plesk Memorial Open Invitational of Champions - Main Application
// UI rendering and page-specific logic
// Depends on: utils.js, firebase.js, auth.js

// ===== WEEKEND SCHEDULE =====

// Note: Date formatting now uses formatDateTime() from utils.js

// Render dynamic weekend schedule from all events
function renderWeekendSchedule() {
    const container = document.getElementById('weekendSchedule');
    if (!container) return;

    const events = [];
    const settings = getSiteSettings();
    const golfSettings = settings.golfSettings || {};

    // Add golf event
    events.push({
        type: 'golf',
        name: 'Golf',
        description: golfSettings.description || `${golfSettings.format || 'Scramble'} - ${golfSettings.scoringType || 'Stableford'} scoring`,
        scheduledDate: golfSettings.scheduledDate || '',
        scheduledTime: golfSettings.scheduledTime || '',
        link: '/golf'
    });

    // Add trivia event
    const triviaGame = getTriviaGame();
    events.push({
        type: 'trivia',
        name: 'Trivia',
        description: triviaGame.description || 'Individual competition - test your knowledge!',
        scheduledDate: triviaGame.scheduledDate || '',
        scheduledTime: triviaGame.scheduledTime || '',
        link: '/trivia'
    });

    // Add each custom event individually
    const customEvents = getCustomEvents();
    Object.values(customEvents).forEach(event => {
        events.push({
            type: 'custom',
            id: event.id,
            name: event.name,
            description: event.description || '',
            scheduledDate: event.scheduledDate || '',
            scheduledTime: event.scheduledTime || '',
            link: '/events'
        });
    });

    // Sort by date/time (events with dates first, then by date, then by time)
    events.sort((a, b) => {
        // Events without dates go last
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;

        // Sort by date
        const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
        if (dateCompare !== 0) return dateCompare;

        // Same date - sort by time (no time = start of day)
        const timeA = a.scheduledTime || '00:00';
        const timeB = b.scheduledTime || '00:00';
        return timeA.localeCompare(timeB);
    });

    // Render schedule items
    let html = '';
    events.forEach(event => {
        const timeDisplay = formatDateTime(event.scheduledDate, event.scheduledTime);
        html += `
            <a href="${event.link}" class="schedule-item-link">
                <div class="schedule-item">
                    <span class="time">${timeDisplay || 'TBD'}</span>
                    <h4>${event.name}</h4>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                </div>
            </a>
        `;
    });

    // If no events at all, show placeholder
    if (events.length === 0) {
        html = '<div class="placeholder-box"><p>No events scheduled yet.</p></div>';
    }

    container.innerHTML = html;
}

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

    // Apply site settings to hero on all pages
    applyHeroSettings();

    if (isHomePage()) {
        renderPlayerGrid();
        renderWeekendSchedule();
        renderPodium();

        // Update golf subtitle from settings
        const golfSub = document.getElementById('homeGolfSubtitle');
        if (golfSub) {
            const gs = getSiteSettings().golfSettings || {};
            golfSub.textContent = `${gs.format || 'Scramble'} - ${gs.scoringType || 'Stableford'}`;
        }
    }

    if (isPage('admin')) {
        renderPlayerList();
        renderSiteSettings();
        renderCustomEventsAdmin();
        renderTriviaQuestionAdmin();
        renderTriviaGameControls();
        renderPredictionsAdmin();
    }

    if (isPage('leaderboard')) {
        renderLeaderboards();
    }

    if (isPage('golf')) {
        renderScoringGuide();
        renderGolfScorecard();
    }

    if (isPage('events')) {
        renderEventsPage();
    }

    if (isPage('trivia')) {
        renderTriviaPage();
        // Admin controls are rendered if admin
        if (isAdmin()) {
            renderTriviaQuestionAdmin();
            renderTriviaGameControls();
        }
    }

    if (isPage('predictions')) {
        renderPredictionsPage();
    }

    if (isPage('profile')) {
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
