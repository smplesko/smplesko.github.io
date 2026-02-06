// Dird Plesk Memorial - Profile Module
// Player profile page rendering and name editing
// Depends on: firebase.js, auth.js, leaderboard.js (calculatePlayerPoints)

// Profile page
function renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    const user = getCurrentUser();
    const userSlot = getCurrentUserSlot();
    if (!user) {
        container.innerHTML = '<div class="placeholder-box"><p>Please log in to view your profile</p></div>';
        return;
    }

    const playerPoints = calculatePlayerPoints();
    const customEvents = getCustomEvents();
    const eventList = Object.values(customEvents).sort((a, b) => (a.order || 0) - (b.order || 0));
    const defaultPoints = { golf: 0, trivia: 0, predictions: 0, total: 0 };
    eventList.forEach(e => { defaultPoints[e.id] = 0; });
    const userPoints = playerPoints[user] || defaultPoints;

    // Get user's teams
    const golfTeams = getGolfTeams();

    let golfTeamNum = null;
    Object.keys(golfTeams).forEach(teamNum => {
        if (golfTeams[teamNum].includes(user)) {
            golfTeamNum = teamNum;
        }
    });

    let html = `
        <div class="section-card">
            <h2 style="color: var(--accent-red);">Edit Your Name</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <input type="text" id="profileNameInput" value="${user}"
                       style="flex: 1; min-width: 150px; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                <button class="btn" onclick="saveProfileName()">Save Name</button>
            </div>
            <p style="margin-top: 10px; opacity: 0.7; font-size: 0.85em;">Player Slot: #${userSlot}</p>
        </div>
    `;

    // Overall stats
    html += '<div class="section-card"><h2>Your Scores</h2><div class="profile-stats">';
    html += `<div class="stat-card"><h4>Total</h4><div class="value">${userPoints.total}</div></div>`;
    html += `<div class="stat-card"><h4>Golf</h4><div class="value">${userPoints.golf}</div>${golfTeamNum ? `<div class="team">Team ${golfTeamNum}</div>` : ''}</div>`;
    eventList.forEach(event => {
        html += `<div class="stat-card"><h4>${event.name}</h4><div class="value">${userPoints[event.id] || 0}</div></div>`;
    });
    html += `<div class="stat-card"><h4>Trivia</h4><div class="value">${userPoints.trivia}</div></div>`;
    html += `<div class="stat-card"><h4>Preds</h4><div class="value">${userPoints.predictions}</div></div>`;
    html += '</div></div>';

    // Team assignments
    html += '<div class="section-card"><h2>Your Team Assignments</h2>';

    let hasAssignments = false;

    // Golf team
    if (golfTeamNum) {
        hasAssignments = true;
        html += `<div class="schedule-item"><h4>Golf - Team ${golfTeamNum}</h4><p>${golfTeams[golfTeamNum].join(', ')}</p></div>`;
    }

    // Custom event teams
    eventList.forEach(event => {
        if (event.scoringMode === 'individual') return;
        const rounds = event.rounds || {};
        Object.entries(rounds).forEach(([roundNum, round]) => {
            const teams = round.teams || {};
            Object.entries(teams).forEach(([teamNum, teamPlayers]) => {
                if (teamPlayers && teamPlayers.includes(user)) {
                    hasAssignments = true;
                    html += `<div class="schedule-item"><h4>${event.name} - ${round.name || 'Round ' + roundNum} - Team ${teamNum}</h4><p>${teamPlayers.join(', ')}</p></div>`;
                }
            });
        });
    });

    if (!hasAssignments) {
        html += '<p style="opacity: 0.7;">No team assignments yet.</p>';
    }

    html += '</div>';

    container.innerHTML = html;
}

function saveProfileName() {
    const input = document.getElementById('profileNameInput');
    const slot = getCurrentUserSlot();
    if (input && slot) {
        const newName = input.value.trim();
        if (newName) {
            updatePlayerName(slot, newName);
            localStorage.setItem('currentUser', newName);
            updateUI();
            showToast('Name updated!', 'success');
            renderProfile();
        }
    }
}
