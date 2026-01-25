// Dird Plesk Memorial Open Invitational of Champions - Main Application

// Default players (alphabetically sorted)
const DEFAULT_PLAYERS = [
    'Alex', 'Brad', 'Bryant', 'Cody', 'Evan',
    'Jack', 'Joe', 'Kevin', 'Matt', 'Pete', 'Will'
];

// Golf scoring options with point values
const GOLF_SCORES = {
    'albatross': { label: 'Albatross', points: 5 },
    'eagle': { label: 'Eagle', points: 4 },
    'birdie': { label: 'Birdie', points: 3 },
    'par': { label: 'Par', points: 2 },
    'bogey': { label: 'Bogey', points: 1 },
    'ohshit': { label: 'Oh Shit', points: 0 }
};

// Default point values for individual events
const DEFAULT_GOKART_POINTS = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10,
    7: 9, 8: 8, 9: 7, 10: 6, 11: 5, 12: 4
};

const DEFAULT_TRIVIA_POINTS = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10,
    7: 9, 8: 8, 9: 7, 10: 6, 11: 5, 12: 4
};

// Default bonus point values
const DEFAULT_BONUS_POINTS = {
    bestFront: 5,
    bestBack: 5,
    overallWinner: 10,
    shotgun: 1
};

// Event order for cumulative scoring
const EVENT_ORDER = ['golf', 'beer', 'gokart', 'trivia'];
const EVENT_NAMES = {
    golf: 'Golf',
    beer: 'Beer Olympics',
    gokart: 'Go-Karting',
    trivia: 'Trivia'
};

// Initialize data
function initData() {
    if (!localStorage.getItem('players')) {
        localStorage.setItem('players', JSON.stringify(DEFAULT_PLAYERS));
    }
    if (!localStorage.getItem('gokartPoints')) {
        localStorage.setItem('gokartPoints', JSON.stringify(DEFAULT_GOKART_POINTS));
    }
    if (!localStorage.getItem('triviaPoints')) {
        localStorage.setItem('triviaPoints', JSON.stringify(DEFAULT_TRIVIA_POINTS));
    }
    if (!localStorage.getItem('bonusPoints')) {
        localStorage.setItem('bonusPoints', JSON.stringify(DEFAULT_BONUS_POINTS));
    }
    if (!localStorage.getItem('golfTeams')) {
        localStorage.setItem('golfTeams', JSON.stringify({}));
    }
    if (!localStorage.getItem('golfHoleScores')) {
        localStorage.setItem('golfHoleScores', JSON.stringify({}));
    }
    if (!localStorage.getItem('golfShotguns')) {
        localStorage.setItem('golfShotguns', JSON.stringify({}));
    }
    if (!localStorage.getItem('golfBonuses')) {
        localStorage.setItem('golfBonuses', JSON.stringify({ bestFront: '', bestBack: '', overallWinner: '' }));
    }
    if (!localStorage.getItem('golfScoringEnabled')) {
        localStorage.setItem('golfScoringEnabled', JSON.stringify({}));
    }
    if (!localStorage.getItem('beerTeams')) {
        localStorage.setItem('beerTeams', JSON.stringify({1: {}, 2: {}, 3: {}, 4: {}, 5: {}}));
    }
    if (!localStorage.getItem('beerScores')) {
        localStorage.setItem('beerScores', JSON.stringify({1: {}, 2: {}, 3: {}, 4: {}, 5: {}}));
    }
    if (!localStorage.getItem('gokartResults')) {
        localStorage.setItem('gokartResults', JSON.stringify({}));
    }
    if (!localStorage.getItem('triviaResults')) {
        localStorage.setItem('triviaResults', JSON.stringify({}));
    }
}

// Get data helpers
function getPlayers() {
    const players = JSON.parse(localStorage.getItem('players')) || DEFAULT_PLAYERS;
    return players.sort((a, b) => a.localeCompare(b));
}

function getGokartPoints() {
    return JSON.parse(localStorage.getItem('gokartPoints')) || DEFAULT_GOKART_POINTS;
}

function getTriviaPoints() {
    return JSON.parse(localStorage.getItem('triviaPoints')) || DEFAULT_TRIVIA_POINTS;
}

function getBonusPoints() {
    return JSON.parse(localStorage.getItem('bonusPoints')) || DEFAULT_BONUS_POINTS;
}

function getGolfTeams() {
    return JSON.parse(localStorage.getItem('golfTeams')) || {};
}

function getGolfHoleScores() {
    return JSON.parse(localStorage.getItem('golfHoleScores')) || {};
}

function getGolfShotguns() {
    return JSON.parse(localStorage.getItem('golfShotguns')) || {};
}

function getGolfBonuses() {
    return JSON.parse(localStorage.getItem('golfBonuses')) || { bestFront: '', bestBack: '', overallWinner: '' };
}

function getGolfScoringEnabled() {
    return JSON.parse(localStorage.getItem('golfScoringEnabled')) || {};
}

function getBeerTeams() {
    return JSON.parse(localStorage.getItem('beerTeams')) || {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
}

function getBeerScores() {
    return JSON.parse(localStorage.getItem('beerScores')) || {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
}

function getGokartResults() {
    return JSON.parse(localStorage.getItem('gokartResults')) || {};
}

function getTriviaResults() {
    return JSON.parse(localStorage.getItem('triviaResults')) || {};
}

// Calculate golf team total from hole scores
function calculateGolfTeamTotal(teamNum) {
    const holeScores = getGolfHoleScores();
    const teamScores = holeScores[teamNum] || {};
    const shotguns = getGolfShotguns();
    const bonusPoints = getBonusPoints();

    let total = 0;
    for (let hole = 1; hole <= 18; hole++) {
        const score = teamScores[hole];
        if (score && GOLF_SCORES[score]) {
            total += GOLF_SCORES[score].points;
        }
    }

    // Add shotgun bonus
    const teamShotguns = shotguns[teamNum] || 0;
    total += teamShotguns * bonusPoints.shotgun;

    return total;
}

// Current user management
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function setCurrentUser(username, admin = false) {
    localStorage.setItem('currentUser', username);
    localStorage.setItem('isAdmin', admin.toString());
    updateUI();
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    updateUI();
    window.location.href = '/';
}

// Password modal
function openModal() {
    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('adminPassword').focus();
}

function closeModal() {
    document.getElementById('passwordModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

function submitPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === '1816') {
        setCurrentUser('Stephen', true);
        closeModal();
    } else {
        alert('Incorrect password');
    }
}

// Login as player
function loginAsPlayer(playerName) {
    if (playerName === 'Stephen') {
        openModal();
    } else {
        setCurrentUser(playerName, false);
    }
}

// Update UI based on login state
function updateUI() {
    const user = getCurrentUser();
    const admin = isAdmin();

    if (admin) {
        document.body.classList.add('is-admin');
    } else {
        document.body.classList.remove('is-admin');
    }

    const userHeader = document.getElementById('userHeader');
    const currentUserSpan = document.getElementById('currentUser');
    if (userHeader && user) {
        userHeader.style.display = 'flex';
        currentUserSpan.textContent = user + (admin ? ' (Admin)' : '');
    } else if (userHeader) {
        userHeader.style.display = 'none';
    }

    // Check admin page access
    if (window.location.pathname === '/admin' || window.location.pathname === '/admin.html') {
        const adminContent = document.getElementById('adminContent');
        const notAdminMessage = document.getElementById('notAdminMessage');
        if (adminContent && notAdminMessage) {
            if (admin) {
                adminContent.style.display = 'block';
                notAdminMessage.style.display = 'none';
            } else {
                adminContent.style.display = 'none';
                notAdminMessage.style.display = 'block';
            }
        }
    }

    // Check profile page - redirect if not logged in
    if ((window.location.pathname === '/profile' || window.location.pathname === '/profile.html') && !user) {
        window.location.href = '/';
    }
}

// Render player grid on homepage (alphabetically sorted)
function renderPlayerGrid() {
    const grid = document.getElementById('playerGrid');
    if (!grid) return;

    const players = getPlayers();
    grid.innerHTML = '';

    // Add Stephen (admin) button first with special styling
    const stephenBtn = document.createElement('button');
    stephenBtn.className = 'player-btn admin-btn';
    stephenBtn.textContent = 'Stephen';
    stephenBtn.onclick = () => loginAsPlayer('Stephen');
    grid.appendChild(stephenBtn);

    // Add other players alphabetically
    players.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        btn.textContent = player;
        btn.onclick = () => loginAsPlayer(player);
        grid.appendChild(btn);
    });
}

// Player management (Admin)
function renderPlayerList() {
    const container = document.getElementById('playerList');
    if (!container) return;

    const players = getPlayers();
    container.innerHTML = '<h4 style="margin-bottom: 10px;">Current Players:</h4>';

    const list = document.createElement('div');
    list.className = 'player-grid';

    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
        item.innerHTML = `
            <span>${player}</span>
            <button onclick="removePlayer(${index})" style="background: #c8102e; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">X</button>
        `;
        list.appendChild(item);
    });

    container.appendChild(list);
}

function addPlayer() {
    const input = document.getElementById('newPlayerName');
    const name = input.value.trim();
    if (!name) return;

    const players = getPlayers();
    if (players.includes(name)) {
        alert('Player already exists');
        return;
    }

    players.push(name);
    localStorage.setItem('players', JSON.stringify(players));
    input.value = '';
    renderPlayerList();
}

function removePlayer(index) {
    const players = getPlayers();
    if (confirm(`Remove ${players[index]}?`)) {
        players.splice(index, 1);
        localStorage.setItem('players', JSON.stringify(players));
        renderPlayerList();
    }
}

// Mobile-friendly checkbox group for team selection
function createCheckboxGroup(containerId, teamNum, prefix, existingMembers = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const players = getPlayers();
    let html = '<div class="checkbox-group">';

    players.forEach(player => {
        const checked = existingMembers.includes(player) ? 'checked' : '';
        const selectedClass = existingMembers.includes(player) ? 'selected' : '';
        html += `
            <label class="${selectedClass}" onclick="toggleCheckboxLabel(this)">
                <input type="checkbox" name="${prefix}Team${teamNum}" value="${player}" ${checked}>
                ${player}
            </label>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function toggleCheckboxLabel(label) {
    setTimeout(() => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    }, 10);
}

function getSelectedFromCheckboxGroup(prefix, teamNum) {
    const checkboxes = document.querySelectorAll(`input[name="${prefix}Team${teamNum}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Golf Admin
function openGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'block';
    updateGolfTeamInputs();
    loadGolfScoringControls();
    loadGolfBonusInputs();
}

function closeGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'none';
}

function updateGolfTeamInputs() {
    const count = parseInt(document.getElementById('golfTeamCount').value);
    const container = document.getElementById('golfTeamAssignments');
    const existingTeams = getGolfTeams();

    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<h4>Team ${i}</h4><div id="golfTeamCheckbox${i}"></div>`;
        container.appendChild(card);

        setTimeout(() => {
            createCheckboxGroup(`golfTeamCheckbox${i}`, i, 'golf', existingTeams[i] || []);
        }, 0);
    }
}

function saveGolfTeams() {
    const count = parseInt(document.getElementById('golfTeamCount').value);
    const teams = {};

    for (let i = 1; i <= count; i++) {
        teams[i] = getSelectedFromCheckboxGroup('golf', i);
    }

    localStorage.setItem('golfTeams', JSON.stringify(teams));
    alert('Golf teams saved!');
    loadGolfScoringControls();
}

function loadGolfScoringControls() {
    const container = document.getElementById('golfScoringControls');
    if (!container) return;

    const teams = getGolfTeams();
    const scoringEnabled = getGolfScoringEnabled();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p style="opacity: 0.7;">Save teams first to manage scoring</p>';
        return;
    }

    container.innerHTML = '<h4 style="color: var(--gold); margin-bottom: 15px;">Team Scoring Controls</h4>';

    Object.keys(teams).forEach(teamNum => {
        const enabled = scoringEnabled[teamNum] !== false;
        const div = document.createElement('div');
        div.className = 'toggle-container';
        div.innerHTML = `
            <label class="toggle-switch">
                <input type="checkbox" id="scoringToggle${teamNum}" ${enabled ? 'checked' : ''} onchange="toggleTeamScoring(${teamNum})">
                <span class="toggle-slider"></span>
            </label>
            <span>Team ${teamNum} Scoring ${enabled ? 'Enabled' : 'Disabled'}</span>
        `;
        container.appendChild(div);
    });
}

function toggleTeamScoring(teamNum) {
    const checkbox = document.getElementById(`scoringToggle${teamNum}`);
    const scoringEnabled = getGolfScoringEnabled();
    scoringEnabled[teamNum] = checkbox.checked;
    localStorage.setItem('golfScoringEnabled', JSON.stringify(scoringEnabled));
    loadGolfScoringControls();
}

function loadGolfBonusInputs() {
    const container = document.getElementById('golfBonusInputs');
    if (!container) return;

    const teams = getGolfTeams();
    const bonuses = getGolfBonuses();
    const bonusPoints = getBonusPoints();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p style="opacity: 0.7;">Save teams first</p>';
        return;
    }

    const teamOptions = Object.keys(teams).map(t => `<option value="${t}" ${bonuses.bestFront == t ? 'selected' : ''}>Team ${t}</option>`).join('');
    const teamOptionsBack = Object.keys(teams).map(t => `<option value="${t}" ${bonuses.bestBack == t ? 'selected' : ''}>Team ${t}</option>`).join('');
    const teamOptionsOverall = Object.keys(teams).map(t => `<option value="${t}" ${bonuses.overallWinner == t ? 'selected' : ''}>Team ${t}</option>`).join('');

    container.innerHTML = `
        <div class="bonus-section">
            <h4>Bonus Point Values</h4>
            <div class="bonus-grid">
                <div class="bonus-input">
                    <label>Best Front (pts)</label>
                    <input type="number" id="bonusPtsFront" value="${bonusPoints.bestFront}" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Best Back (pts)</label>
                    <input type="number" id="bonusPtsBack" value="${bonusPoints.bestBack}" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Overall Winner (pts)</label>
                    <input type="number" id="bonusPtsOverall" value="${bonusPoints.overallWinner}" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Per Shotgun (pts)</label>
                    <input type="number" id="bonusPtsShotgun" value="${bonusPoints.shotgun}" onchange="saveBonusPointValues()">
                </div>
            </div>
        </div>
        <div class="bonus-section" style="margin-top: 15px;">
            <h4>Award Bonuses</h4>
            <div class="bonus-grid">
                <div class="bonus-input">
                    <label>Best Front 9</label>
                    <select id="bonusBestFront" onchange="saveGolfBonuses()">
                        <option value="">-- Select --</option>
                        ${teamOptions}
                    </select>
                </div>
                <div class="bonus-input">
                    <label>Best Back 9</label>
                    <select id="bonusBestBack" onchange="saveGolfBonuses()">
                        <option value="">-- Select --</option>
                        ${teamOptionsBack}
                    </select>
                </div>
                <div class="bonus-input">
                    <label>Overall Winner</label>
                    <select id="bonusOverallWinner" onchange="saveGolfBonuses()">
                        <option value="">-- Select --</option>
                        ${teamOptionsOverall}
                    </select>
                </div>
            </div>
        </div>
    `;
}

function saveBonusPointValues() {
    const bonusPoints = {
        bestFront: parseInt(document.getElementById('bonusPtsFront').value) || 0,
        bestBack: parseInt(document.getElementById('bonusPtsBack').value) || 0,
        overallWinner: parseInt(document.getElementById('bonusPtsOverall').value) || 0,
        shotgun: parseInt(document.getElementById('bonusPtsShotgun').value) || 0
    };
    localStorage.setItem('bonusPoints', JSON.stringify(bonusPoints));
}

function saveGolfBonuses() {
    const bonuses = {
        bestFront: document.getElementById('bonusBestFront').value,
        bestBack: document.getElementById('bonusBestBack').value,
        overallWinner: document.getElementById('bonusOverallWinner').value
    };
    localStorage.setItem('golfBonuses', JSON.stringify(bonuses));
}

// Golf Scorecard (for players)
function renderGolfScorecard() {
    const container = document.getElementById('golfScorecard');
    if (!container) return;

    const user = getCurrentUser();
    const teams = getGolfTeams();
    const holeScores = getGolfHoleScores();
    const shotguns = getGolfShotguns();
    const scoringEnabled = getGolfScoringEnabled();

    // Find user's team
    let userTeam = null;
    Object.keys(teams).forEach(teamNum => {
        if (teams[teamNum].includes(user) || (user === 'Stephen' && isAdmin())) {
            userTeam = teamNum;
        }
    });

    if (!userTeam && !isAdmin()) {
        container.innerHTML = '<div class="placeholder-box"><p>You are not assigned to a team yet.</p></div>';
        return;
    }

    // If admin, show all teams
    const teamsToShow = isAdmin() ? Object.keys(teams) : [userTeam];

    container.innerHTML = '';

    teamsToShow.forEach(teamNum => {
        const enabled = scoringEnabled[teamNum] !== false;
        const teamScores = holeScores[teamNum] || {};
        const teamShotgunCount = shotguns[teamNum] || 0;

        const scorecard = document.createElement('div');
        scorecard.className = 'scorecard';

        let html = `<h4>Team ${teamNum}: ${teams[teamNum].join(', ')}</h4>`;

        if (!enabled && !isAdmin()) {
            html += '<div class="scoring-locked"><p>Scoring is currently locked for this team</p></div>';
        } else {
            // Front 9
            html += '<p style="color: var(--gold); margin: 10px 0 5px;">Front 9</p>';
            html += '<div class="hole-grid">';
            for (let hole = 1; hole <= 9; hole++) {
                html += createHoleInput(teamNum, hole, teamScores[hole], enabled || isAdmin());
            }
            html += '</div>';

            // Back 9
            html += '<p style="color: var(--gold); margin: 15px 0 5px;">Back 9</p>';
            html += '<div class="hole-grid">';
            for (let hole = 10; hole <= 18; hole++) {
                html += createHoleInput(teamNum, hole, teamScores[hole], enabled || isAdmin());
            }
            html += '</div>';

            // Shotguns
            html += `
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px;">
                    <label style="color: var(--silver);">Team Shotguns:</label>
                    <input type="number" id="shotguns${teamNum}" value="${teamShotgunCount}"
                           min="0" style="width: 60px; padding: 8px; border-radius: 5px; border: none;"
                           onchange="saveGolfShotguns(${teamNum})" ${!enabled && !isAdmin() ? 'disabled' : ''}>
                </div>
            `;

            // Total
            const total = calculateGolfTeamTotal(teamNum);
            html += `<div class="hole-total"><span>Total: ${total} pts</span></div>`;
        }

        scorecard.innerHTML = html;
        container.appendChild(scorecard);
    });
}

function createHoleInput(teamNum, hole, currentScore, enabled) {
    const options = Object.entries(GOLF_SCORES).map(([key, val]) =>
        `<option value="${key}" ${currentScore === key ? 'selected' : ''}>${val.label} (${val.points})</option>`
    ).join('');

    return `
        <div class="hole-input">
            <label>Hole ${hole}</label>
            <select id="hole${teamNum}_${hole}" onchange="saveHoleScore(${teamNum}, ${hole})" ${!enabled ? 'disabled' : ''}>
                <option value="">--</option>
                ${options}
            </select>
        </div>
    `;
}

function saveHoleScore(teamNum, hole) {
    const select = document.getElementById(`hole${teamNum}_${hole}`);
    const holeScores = getGolfHoleScores();

    if (!holeScores[teamNum]) {
        holeScores[teamNum] = {};
    }

    holeScores[teamNum][hole] = select.value;
    localStorage.setItem('golfHoleScores', JSON.stringify(holeScores));

    // Update total display
    renderGolfScorecard();
}

function saveGolfShotguns(teamNum) {
    const input = document.getElementById(`shotguns${teamNum}`);
    const shotguns = getGolfShotguns();
    shotguns[teamNum] = parseInt(input.value) || 0;
    localStorage.setItem('golfShotguns', JSON.stringify(shotguns));
    renderGolfScorecard();
}

// Beer Olympics Admin
function openBeerOlympicsAdmin() {
    document.getElementById('beerOlympicsAdminSection').style.display = 'block';
    loadBeerGameAdmin();
}

function closeBeerOlympicsAdmin() {
    document.getElementById('beerOlympicsAdminSection').style.display = 'none';
}

function loadBeerGameAdmin() {
    const gameNum = document.getElementById('beerGameSelect').value;
    document.getElementById('currentGameLabel').textContent = `Game ${gameNum}`;
    document.getElementById('currentGameScoreLabel').textContent = `Game ${gameNum}`;
    updateBeerTeamInputs();
    loadBeerScoreInputs();
}

function updateBeerTeamInputs() {
    const gameNum = document.getElementById('beerGameSelect').value;
    const count = parseInt(document.getElementById('beerTeamCount').value);
    const container = document.getElementById('beerTeamAssignments');
    const allBeerTeams = getBeerTeams();
    const existingTeams = allBeerTeams[gameNum] || {};

    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<h4>Team ${i}</h4><div id="beerTeamCheckbox${i}"></div>`;
        container.appendChild(card);

        setTimeout(() => {
            createCheckboxGroup(`beerTeamCheckbox${i}`, i, 'beer', existingTeams[i] || []);
        }, 0);
    }
}

function saveBeerTeams() {
    const gameNum = document.getElementById('beerGameSelect').value;
    const count = parseInt(document.getElementById('beerTeamCount').value);
    const allBeerTeams = getBeerTeams();

    allBeerTeams[gameNum] = {};
    for (let i = 1; i <= count; i++) {
        allBeerTeams[gameNum][i] = getSelectedFromCheckboxGroup('beer', i);
    }

    localStorage.setItem('beerTeams', JSON.stringify(allBeerTeams));
    alert(`Beer Olympics Game ${gameNum} teams saved!`);
    loadBeerScoreInputs();
}

function loadBeerScoreInputs() {
    const container = document.getElementById('beerScoreInputs');
    if (!container) return;

    const gameNum = document.getElementById('beerGameSelect').value;
    const allBeerTeams = getBeerTeams();
    const teams = allBeerTeams[gameNum] || {};
    const allBeerScores = getBeerScores();
    const scores = allBeerScores[gameNum] || {};

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p style="opacity: 0.7;">Save teams first to enter scores</p>';
        return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scoring-grid';

    Object.keys(teams).forEach(teamNum => {
        if (teams[teamNum] && teams[teamNum].length > 0) {
            const div = document.createElement('div');
            div.className = 'score-input';
            div.innerHTML = `
                <label>Team ${teamNum}</label>
                <small style="display: block; opacity: 0.7; margin-bottom: 5px;">${teams[teamNum].join(', ')}</small>
                <input type="number" id="beerScore${teamNum}" placeholder="Points" value="${scores[teamNum] || ''}">
            `;
            grid.appendChild(div);
        }
    });

    container.appendChild(grid);
}

function saveBeerScores() {
    const gameNum = document.getElementById('beerGameSelect').value;
    const allBeerTeams = getBeerTeams();
    const teams = allBeerTeams[gameNum] || {};
    const allBeerScores = getBeerScores();

    allBeerScores[gameNum] = {};
    Object.keys(teams).forEach(teamNum => {
        const input = document.getElementById(`beerScore${teamNum}`);
        if (input && input.value) {
            allBeerScores[gameNum][teamNum] = parseInt(input.value);
        }
    });

    localStorage.setItem('beerScores', JSON.stringify(allBeerScores));
    alert(`Beer Olympics Game ${gameNum} scores saved!`);
}

// Go-Kart Functions
function renderGokartPointConfig() {
    const container = document.getElementById('gokartPointConfig');
    if (!container) return;

    const points = getGokartPoints();
    container.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = 'point-config-item';
        div.innerHTML = `
            <label>${getOrdinal(i)} Place</label>
            <input type="number" id="gokartPts${i}" value="${points[i] || 0}">
        `;
        container.appendChild(div);
    }
}

function renderGokartPointDisplay() {
    const container = document.getElementById('gokartPointDisplay');
    if (!container) return;

    const points = getGokartPoints();
    container.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = 'point-config-item';
        div.innerHTML = `
            <label>${getOrdinal(i)} Place</label>
            <span style="font-size: 1.5em; font-weight: bold; color: var(--accent-red);">${points[i] || 0}</span>
        `;
        container.appendChild(div);
    }
}

function saveGokartPoints() {
    const points = {};
    for (let i = 1; i <= 12; i++) {
        const input = document.getElementById(`gokartPts${i}`);
        points[i] = parseInt(input.value) || 0;
    }
    localStorage.setItem('gokartPoints', JSON.stringify(points));
    alert('Go-kart point values saved!');
    renderGokartPointDisplay();
}

function renderGokartScoringAdmin() {
    const container = document.getElementById('gokartScoringAdmin');
    if (!container) return;

    const players = getPlayers();
    const results = getGokartResults();

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scoring-grid';

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'score-input';
        div.innerHTML = `
            <label>${player}</label>
            <select id="gokartPos_${player.replace(/\s/g, '_')}">
                <option value="">-- Position --</option>
                ${[1,2,3,4,5,6,7,8,9,10,11,12].map(p =>
                    `<option value="${p}" ${results[player] === p ? 'selected' : ''}>${getOrdinal(p)}</option>`
                ).join('')}
            </select>
        `;
        grid.appendChild(div);
    });

    container.appendChild(grid);
}

function saveGokartResults() {
    const players = getPlayers();
    const results = {};

    players.forEach(player => {
        const select = document.getElementById(`gokartPos_${player.replace(/\s/g, '_')}`);
        if (select && select.value) {
            results[player] = parseInt(select.value);
        }
    });

    localStorage.setItem('gokartResults', JSON.stringify(results));
    alert('Go-kart results saved!');
    renderGokartResultsTable();
}

function renderGokartResultsTable() {
    const tbody = document.querySelector('#gokartResults tbody');
    if (!tbody) return;

    const results = getGokartResults();
    const points = getGokartPoints();

    if (Object.keys(results).length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">Results will appear after the race</td></tr>`;
        return;
    }

    const sorted = Object.entries(results).sort((a, b) => a[1] - b[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, position]) => {
        const tr = document.createElement('tr');
        const rankClass = position <= 3 ? `rank-${position}` : '';
        tr.innerHTML = `
            <td class="${rankClass}">${getOrdinal(position)}</td>
            <td>${player}</td>
            <td>${points[position] || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Trivia Functions
function renderTriviaPointConfig() {
    const container = document.getElementById('triviaPointConfig');
    if (!container) return;

    const points = getTriviaPoints();
    container.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = 'point-config-item';
        div.innerHTML = `
            <label>${getOrdinal(i)} Place</label>
            <input type="number" id="triviaPts${i}" value="${points[i] || 0}">
        `;
        container.appendChild(div);
    }
}

function renderTriviaPointDisplay() {
    const container = document.getElementById('triviaPointDisplay');
    if (!container) return;

    const points = getTriviaPoints();
    container.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        const div = document.createElement('div');
        div.className = 'point-config-item';
        div.innerHTML = `
            <label>${getOrdinal(i)} Place</label>
            <span style="font-size: 1.5em; font-weight: bold; color: var(--accent-red);">${points[i] || 0}</span>
        `;
        container.appendChild(div);
    }
}

function saveTriviaPoints() {
    const points = {};
    for (let i = 1; i <= 12; i++) {
        const input = document.getElementById(`triviaPts${i}`);
        points[i] = parseInt(input.value) || 0;
    }
    localStorage.setItem('triviaPoints', JSON.stringify(points));
    alert('Trivia point values saved!');
    renderTriviaPointDisplay();
}

function renderTriviaScoringAdmin() {
    const container = document.getElementById('triviaScoringAdmin');
    if (!container) return;

    const players = getPlayers();
    const results = getTriviaResults();

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scoring-grid';

    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'score-input';
        div.innerHTML = `
            <label>${player}</label>
            <select id="triviaPos_${player.replace(/\s/g, '_')}">
                <option value="">-- Position --</option>
                ${[1,2,3,4,5,6,7,8,9,10,11,12].map(p =>
                    `<option value="${p}" ${results[player] === p ? 'selected' : ''}>${getOrdinal(p)}</option>`
                ).join('')}
            </select>
        `;
        grid.appendChild(div);
    });

    container.appendChild(grid);
}

function saveTriviaResults() {
    const players = getPlayers();
    const results = {};

    players.forEach(player => {
        const select = document.getElementById(`triviaPos_${player.replace(/\s/g, '_')}`);
        if (select && select.value) {
            results[player] = parseInt(select.value);
        }
    });

    localStorage.setItem('triviaResults', JSON.stringify(results));
    alert('Trivia results saved!');
    renderTriviaResultsTable();
}

function renderTriviaResultsTable() {
    const tbody = document.querySelector('#triviaResults tbody');
    if (!tbody) return;

    const results = getTriviaResults();
    const points = getTriviaPoints();

    if (Object.keys(results).length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">Results will appear after trivia</td></tr>`;
        return;
    }

    const sorted = Object.entries(results).sort((a, b) => a[1] - b[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, position]) => {
        const tr = document.createElement('tr');
        const rankClass = position <= 3 ? `rank-${position}` : '';
        tr.innerHTML = `
            <td class="${rankClass}">${getOrdinal(position)}</td>
            <td>${player}</td>
            <td>${points[position] || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Calculate all player points
function calculatePlayerPoints() {
    const players = getPlayers();
    const playerPoints = {};

    players.forEach(player => {
        playerPoints[player] = { golf: 0, beer: 0, gokart: 0, trivia: 0, total: 0 };
    });

    // Golf points (from hole-by-hole scoring)
    const golfTeams = getGolfTeams();
    const golfBonuses = getGolfBonuses();
    const bonusPoints = getBonusPoints();

    // Calculate team totals and assign to players
    const teamTotals = {};
    Object.keys(golfTeams).forEach(teamNum => {
        teamTotals[teamNum] = calculateGolfTeamTotal(teamNum);
    });

    // Add bonus points
    if (golfBonuses.bestFront && golfTeams[golfBonuses.bestFront]) {
        golfTeams[golfBonuses.bestFront].forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player].golf += bonusPoints.bestFront;
            }
        });
    }
    if (golfBonuses.bestBack && golfTeams[golfBonuses.bestBack]) {
        golfTeams[golfBonuses.bestBack].forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player].golf += bonusPoints.bestBack;
            }
        });
    }
    if (golfBonuses.overallWinner && golfTeams[golfBonuses.overallWinner]) {
        golfTeams[golfBonuses.overallWinner].forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player].golf += bonusPoints.overallWinner;
            }
        });
    }

    // Assign base golf points from team totals
    Object.keys(golfTeams).forEach(teamNum => {
        const teamPlayers = golfTeams[teamNum] || [];
        teamPlayers.forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player].golf += teamTotals[teamNum] || 0;
            }
        });
    });

    // Beer Olympics points
    const beerTeams = getBeerTeams();
    const beerScores = getBeerScores();

    for (let game = 1; game <= 5; game++) {
        const teams = beerTeams[game] || {};
        const scores = beerScores[game] || {};

        Object.keys(teams).forEach(teamNum => {
            const teamPlayers = teams[teamNum] || [];
            const pts = scores[teamNum] || 0;
            teamPlayers.forEach(player => {
                if (playerPoints[player]) {
                    playerPoints[player].beer += pts;
                }
            });
        });
    }

    // Go-kart points
    const gokartResults = getGokartResults();
    const gokartPoints = getGokartPoints();

    Object.entries(gokartResults).forEach(([player, position]) => {
        if (playerPoints[player]) {
            playerPoints[player].gokart = gokartPoints[position] || 0;
        }
    });

    // Trivia points
    const triviaResults = getTriviaResults();
    const triviaPoints = getTriviaPoints();

    Object.entries(triviaResults).forEach(([player, position]) => {
        if (playerPoints[player]) {
            playerPoints[player].trivia = triviaPoints[position] || 0;
        }
    });

    // Calculate totals
    Object.keys(playerPoints).forEach(player => {
        playerPoints[player].total =
            playerPoints[player].golf +
            playerPoints[player].beer +
            playerPoints[player].gokart +
            playerPoints[player].trivia;
    });

    return playerPoints;
}

// Leaderboard rendering
function renderLeaderboards() {
    renderOverallLeaderboard();
    renderCumulativeChart();
    renderGolfLeaderboard();
    renderBeerOlympicsLeaderboard();
    renderGokartLeaderboard();
    renderTriviaLeaderboard();
}

function renderOverallLeaderboard() {
    const tbody = document.querySelector('#overallLeaderboard tbody');
    if (!tbody) return;

    const playerPoints = calculatePlayerPoints();
    const sorted = Object.entries(playerPoints)
        .sort((a, b) => b[1].total - a[1].total);

    tbody.innerHTML = '';
    sorted.forEach(([player, points], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>${player}</td>
            <td>${points.golf}</td>
            <td>${points.beer}</td>
            <td>${points.gokart}</td>
            <td>${points.trivia}</td>
            <td style="font-weight: bold;">${points.total}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCumulativeChart() {
    const container = document.getElementById('cumulativeChart');
    if (!container) return;

    const playerPoints = calculatePlayerPoints();
    const players = Object.keys(playerPoints);

    // Calculate cumulative scores after each event
    const chartData = players.map(player => {
        const pts = playerPoints[player];
        return {
            name: player,
            afterGolf: pts.golf,
            afterBeer: pts.golf + pts.beer,
            afterGokart: pts.golf + pts.beer + pts.gokart,
            afterTrivia: pts.total
        };
    });

    // Sort by final total
    chartData.sort((a, b) => b.afterTrivia - a.afterTrivia);

    // Create simple bar chart visualization
    let html = '<h3 style="color: var(--gold); margin-bottom: 15px;">Cumulative Score Progression</h3>';
    html += '<div style="overflow-x: auto;">';
    html += '<table class="leaderboard-table"><thead><tr>';
    html += '<th>Player</th><th>After Golf</th><th>After Beer Olympics</th><th>After Go-Karts</th><th>Final</th>';
    html += '</tr></thead><tbody>';

    chartData.forEach((data, idx) => {
        const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
        html += `<tr>
            <td class="${rankClass}">${data.name}</td>
            <td>${data.afterGolf}</td>
            <td>${data.afterBeer}</td>
            <td>${data.afterGokart}</td>
            <td style="font-weight: bold;">${data.afterTrivia}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderGolfLeaderboard() {
    const tbody = document.querySelector('#golfLeaderboard tbody');
    if (!tbody) return;

    const teams = getGolfTeams();

    if (Object.keys(teams).length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; opacity: 0.7;">No golf results yet</td></tr>`;
        return;
    }

    // Calculate team totals
    const teamData = Object.keys(teams).map(teamNum => ({
        teamNum,
        players: teams[teamNum],
        total: calculateGolfTeamTotal(teamNum)
    }));

    teamData.sort((a, b) => b.total - a.total);

    tbody.innerHTML = '';
    teamData.forEach((team, idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>Team ${team.teamNum}</td>
            <td>${team.players.join(', ')}</td>
            <td>${team.total}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBeerOlympicsLeaderboard() {
    const tbody = document.querySelector('#beerOlympicsLeaderboard tbody');
    if (!tbody) return;

    const players = getPlayers();
    const beerTeams = getBeerTeams();
    const beerScores = getBeerScores();

    const playerGamePoints = {};
    players.forEach(player => {
        playerGamePoints[player] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 };
    });

    for (let game = 1; game <= 5; game++) {
        const teams = beerTeams[game] || {};
        const scores = beerScores[game] || {};

        Object.keys(teams).forEach(teamNum => {
            const teamPlayers = teams[teamNum] || [];
            const pts = scores[teamNum] || 0;
            teamPlayers.forEach(player => {
                if (playerGamePoints[player]) {
                    playerGamePoints[player][game] = pts;
                    playerGamePoints[player].total += pts;
                }
            });
        });
    }

    const sorted = Object.entries(playerGamePoints).sort((a, b) => b[1].total - a[1].total);

    tbody.innerHTML = '';
    sorted.forEach(([player, points], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>${player}</td>
            <td>${points[1] || '-'}</td>
            <td>${points[2] || '-'}</td>
            <td>${points[3] || '-'}</td>
            <td>${points[4] || '-'}</td>
            <td>${points[5] || '-'}</td>
            <td style="font-weight: bold;">${points.total}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGokartLeaderboard() {
    const tbody = document.querySelector('#gokartingLeaderboard tbody');
    if (!tbody) return;

    const results = getGokartResults();
    const points = getGokartPoints();

    if (Object.keys(results).length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">No go-kart results yet</td></tr>`;
        return;
    }

    const sorted = Object.entries(results).sort((a, b) => a[1] - b[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, position]) => {
        const rankClass = position <= 3 ? `rank-${position}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${getOrdinal(position)}</td>
            <td>${player}</td>
            <td>${points[position] || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTriviaLeaderboard() {
    const tbody = document.querySelector('#triviaLeaderboard tbody');
    if (!tbody) return;

    const results = getTriviaResults();
    const points = getTriviaPoints();

    if (Object.keys(results).length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">No trivia results yet</td></tr>`;
        return;
    }

    const sorted = Object.entries(results).sort((a, b) => a[1] - b[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, position]) => {
        const rankClass = position <= 3 ? `rank-${position}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${getOrdinal(position)}</td>
            <td>${player}</td>
            <td>${points[position] || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Profile page
function renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<div class="placeholder-box"><p>Please log in to view your profile</p></div>';
        return;
    }

    const playerPoints = calculatePlayerPoints();
    const userPoints = playerPoints[user] || { golf: 0, beer: 0, gokart: 0, trivia: 0, total: 0 };

    // Get user's teams
    const golfTeams = getGolfTeams();
    const beerTeams = getBeerTeams();

    let golfTeamNum = null;
    Object.keys(golfTeams).forEach(teamNum => {
        if (golfTeams[teamNum].includes(user)) {
            golfTeamNum = teamNum;
        }
    });

    let html = `<h2 style="color: var(--accent-red); margin-bottom: 20px;">${user}'s Profile</h2>`;

    // Overall stats
    html += '<div class="profile-stats">';
    html += `<div class="stat-card"><h4>Total Points</h4><div class="value">${userPoints.total}</div></div>`;
    html += `<div class="stat-card"><h4>Golf</h4><div class="value">${userPoints.golf}</div>${golfTeamNum ? `<div class="team">Team ${golfTeamNum}</div>` : ''}</div>`;
    html += `<div class="stat-card"><h4>Beer Olympics</h4><div class="value">${userPoints.beer}</div></div>`;
    html += `<div class="stat-card"><h4>Go-Karting</h4><div class="value">${userPoints.gokart}</div></div>`;
    html += `<div class="stat-card"><h4>Trivia</h4><div class="value">${userPoints.trivia}</div></div>`;
    html += '</div>';

    // Team assignments
    html += '<div class="section-card" style="margin-top: 20px;"><h2>Your Team Assignments</h2>';

    // Golf team
    if (golfTeamNum) {
        html += `<div class="schedule-item"><h4>Golf - Team ${golfTeamNum}</h4><p>${golfTeams[golfTeamNum].join(', ')}</p></div>`;
    }

    // Beer Olympics teams
    for (let game = 1; game <= 5; game++) {
        const teams = beerTeams[game] || {};
        Object.keys(teams).forEach(teamNum => {
            if (teams[teamNum].includes(user)) {
                html += `<div class="schedule-item"><h4>Beer Olympics Game ${game} - Team ${teamNum}</h4><p>${teams[teamNum].join(', ')}</p></div>`;
            }
        });
    }

    html += '</div>';

    container.innerHTML = html;
}

// Data management
function exportData() {
    const data = {
        players: getPlayers(),
        golfTeams: getGolfTeams(),
        golfHoleScores: getGolfHoleScores(),
        golfShotguns: getGolfShotguns(),
        golfBonuses: getGolfBonuses(),
        golfScoringEnabled: getGolfScoringEnabled(),
        bonusPoints: getBonusPoints(),
        beerTeams: getBeerTeams(),
        beerScores: getBeerScores(),
        gokartPoints: getGokartPoints(),
        gokartResults: getGokartResults(),
        triviaPoints: getTriviaPoints(),
        triviaResults: getTriviaResults()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dird-plesk-memorial-data.json';
    a.click();
}

function confirmResetData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
        if (confirm('Really? All scores and teams will be deleted!')) {
            localStorage.clear();
            initData();
            alert('All data has been reset');
            window.location.reload();
        }
    }
}

// Utility
function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initData();
    updateUI();

    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
        renderPlayerGrid();
    }

    if (path === '/admin' || path === '/admin.html') {
        renderPlayerList();
    }

    if (path === '/leaderboard' || path === '/leaderboard.html') {
        renderLeaderboards();
    }

    if (path === '/golf' || path === '/golf.html') {
        renderGolfScorecard();
    }

    if (path === '/gokarting' || path === '/gokarting.html') {
        renderGokartPointDisplay();
        renderGokartPointConfig();
        renderGokartScoringAdmin();
        renderGokartResultsTable();
    }

    if (path === '/trivia' || path === '/trivia.html') {
        renderTriviaPointDisplay();
        renderTriviaPointConfig();
        renderTriviaScoringAdmin();
        renderTriviaResultsTable();
    }

    if (path === '/profile' || path === '/profile.html') {
        renderProfile();
    }

    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitPassword();
            }
        });
    }
});
