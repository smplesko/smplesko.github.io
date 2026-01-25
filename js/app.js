// Bachelor Party Showdown - Main Application

// Default players (can be modified by admin)
const DEFAULT_PLAYERS = [
    'Player 1', 'Player 2', 'Player 3', 'Player 4',
    'Player 5', 'Player 6', 'Player 7', 'Player 8',
    'Player 9', 'Player 10', 'Player 11', 'Player 12'
];

// Default go-kart point values
const DEFAULT_GOKART_POINTS = {
    1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10,
    7: 9, 8: 8, 9: 7, 10: 6, 11: 5, 12: 4
};

// Initialize data
function initData() {
    if (!localStorage.getItem('players')) {
        localStorage.setItem('players', JSON.stringify(DEFAULT_PLAYERS));
    }
    if (!localStorage.getItem('gokartPoints')) {
        localStorage.setItem('gokartPoints', JSON.stringify(DEFAULT_GOKART_POINTS));
    }
    if (!localStorage.getItem('golfTeams')) {
        localStorage.setItem('golfTeams', JSON.stringify({}));
    }
    if (!localStorage.getItem('golfScores')) {
        localStorage.setItem('golfScores', JSON.stringify({}));
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
}

// Get data helpers
function getPlayers() {
    return JSON.parse(localStorage.getItem('players')) || DEFAULT_PLAYERS;
}

function getGokartPoints() {
    return JSON.parse(localStorage.getItem('gokartPoints')) || DEFAULT_GOKART_POINTS;
}

function getGolfTeams() {
    return JSON.parse(localStorage.getItem('golfTeams')) || {};
}

function getGolfScores() {
    return JSON.parse(localStorage.getItem('golfScores')) || {};
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
        setCurrentUser('Admin', true);
        closeModal();
    } else {
        alert('Incorrect password');
    }
}

// Login as player
function loginAsPlayer(playerName) {
    if (playerName === 'Admin') {
        openModal();
    } else {
        setCurrentUser(playerName, false);
    }
}

// Update UI based on login state
function updateUI() {
    const user = getCurrentUser();
    const admin = isAdmin();

    // Update body class for admin styling
    if (admin) {
        document.body.classList.add('is-admin');
    } else {
        document.body.classList.remove('is-admin');
    }

    // Update user header
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
}

// Render player grid on homepage
function renderPlayerGrid() {
    const grid = document.getElementById('playerGrid');
    if (!grid) return;

    const players = getPlayers();
    grid.innerHTML = '';

    players.forEach(player => {
        const btn = document.createElement('button');
        btn.className = 'player-btn';
        btn.textContent = player;
        btn.onclick = () => loginAsPlayer(player);
        grid.appendChild(btn);
    });

    // Add admin button
    const adminBtn = document.createElement('button');
    adminBtn.className = 'player-btn admin-btn';
    adminBtn.textContent = 'Admin';
    adminBtn.onclick = () => loginAsPlayer('Admin');
    grid.appendChild(adminBtn);
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
            <button onclick="removePlayer(${index})" style="background: #e74c3c; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">X</button>
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

// Golf Admin
function openGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'block';
    updateGolfTeamInputs();
    loadGolfScoreInputs();
}

function closeGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'none';
}

function updateGolfTeamInputs() {
    const count = parseInt(document.getElementById('golfTeamCount').value);
    const container = document.getElementById('golfTeamAssignments');
    const players = getPlayers();
    const existingTeams = getGolfTeams();

    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<h4>Team ${i}</h4>`;

        const select = document.createElement('select');
        select.id = `golfTeam${i}`;
        select.multiple = true;
        select.style.height = '120px';

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            if (existingTeams[i] && existingTeams[i].includes(player)) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        card.appendChild(select);
        container.appendChild(card);
    }
}

function saveGolfTeams() {
    const count = parseInt(document.getElementById('golfTeamCount').value);
    const teams = {};

    for (let i = 1; i <= count; i++) {
        const select = document.getElementById(`golfTeam${i}`);
        teams[i] = Array.from(select.selectedOptions).map(o => o.value);
    }

    localStorage.setItem('golfTeams', JSON.stringify(teams));
    alert('Golf teams saved!');
    loadGolfScoreInputs();
}

function loadGolfScoreInputs() {
    const container = document.getElementById('golfScoreInputs');
    if (!container) return;

    const teams = getGolfTeams();
    const scores = getGolfScores();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p style="opacity: 0.7;">Save teams first to enter scores</p>';
        return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scoring-grid';

    Object.keys(teams).forEach(teamNum => {
        const div = document.createElement('div');
        div.className = 'score-input';
        div.innerHTML = `
            <label>Team ${teamNum}</label>
            <small style="display: block; opacity: 0.7; margin-bottom: 5px;">${teams[teamNum].join(', ')}</small>
            <input type="number" id="golfScore${teamNum}" placeholder="Stableford pts" value="${scores[teamNum] || ''}">
        `;
        grid.appendChild(div);
    });

    container.appendChild(grid);
}

function saveGolfScores() {
    const teams = getGolfTeams();
    const scores = {};

    Object.keys(teams).forEach(teamNum => {
        const input = document.getElementById(`golfScore${teamNum}`);
        if (input && input.value) {
            scores[teamNum] = parseInt(input.value);
        }
    });

    localStorage.setItem('golfScores', JSON.stringify(scores));
    alert('Golf scores saved!');
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
    const players = getPlayers();
    const allBeerTeams = getBeerTeams();
    const existingTeams = allBeerTeams[gameNum] || {};

    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `<h4>Team ${i}</h4>`;

        const select = document.createElement('select');
        select.id = `beerTeam${i}`;
        select.multiple = true;
        select.style.height = '120px';

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            if (existingTeams[i] && existingTeams[i].includes(player)) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        card.appendChild(select);
        container.appendChild(card);
    }
}

function saveBeerTeams() {
    const gameNum = document.getElementById('beerGameSelect').value;
    const count = parseInt(document.getElementById('beerTeamCount').value);
    const allBeerTeams = getBeerTeams();

    allBeerTeams[gameNum] = {};
    for (let i = 1; i <= count; i++) {
        const select = document.getElementById(`beerTeam${i}`);
        allBeerTeams[gameNum][i] = Array.from(select.selectedOptions).map(o => o.value);
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
        if (teams[teamNum].length > 0) {
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

// Go-Kart Admin
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
            <span style="font-size: 1.5em; font-weight: bold; color: #e94560;">${points[i] || 0}</span>
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

    // Sort by position
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

// Leaderboard
function renderLeaderboards() {
    renderOverallLeaderboard();
    renderGolfLeaderboard();
    renderBeerOlympicsLeaderboard();
    renderGokartLeaderboard();
}

function calculatePlayerPoints() {
    const players = getPlayers();
    const playerPoints = {};

    players.forEach(player => {
        playerPoints[player] = { golf: 0, beer: 0, gokart: 0, total: 0 };
    });

    // Golf points
    const golfTeams = getGolfTeams();
    const golfScores = getGolfScores();
    const golfRankings = Object.entries(golfScores)
        .sort((a, b) => b[1] - a[1])
        .map(([team, score], idx) => ({ team, score, rank: idx + 1 }));

    golfRankings.forEach(({ team, rank }) => {
        const teamPlayers = golfTeams[team] || [];
        const pts = Math.max(0, 13 - rank); // Simple point system
        teamPlayers.forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player].golf = pts;
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

    // Calculate totals
    Object.keys(playerPoints).forEach(player => {
        playerPoints[player].total =
            playerPoints[player].golf +
            playerPoints[player].beer +
            playerPoints[player].gokart;
    });

    return playerPoints;
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
            <td style="font-weight: bold;">${points.total}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderGolfLeaderboard() {
    const tbody = document.querySelector('#golfLeaderboard tbody');
    if (!tbody) return;

    const teams = getGolfTeams();
    const scores = getGolfScores();

    if (Object.keys(scores).length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; opacity: 0.7;">No golf results yet</td></tr>`;
        return;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    tbody.innerHTML = '';
    sorted.forEach(([teamNum, score], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const pts = Math.max(0, 13 - rank);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>Team ${teamNum}</td>
            <td>${(teams[teamNum] || []).join(', ')}</td>
            <td>${score}</td>
            <td>${pts}</td>
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

// Data management
function exportData() {
    const data = {
        players: getPlayers(),
        golfTeams: getGolfTeams(),
        golfScores: getGolfScores(),
        beerTeams: getBeerTeams(),
        beerScores: getBeerScores(),
        gokartPoints: getGokartPoints(),
        gokartResults: getGokartResults()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bachelor-party-data.json';
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

    // Page-specific initialization
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

    if (path === '/gokarting' || path === '/gokarting.html') {
        renderGokartPointDisplay();
        renderGokartPointConfig();
        renderGokartScoringAdmin();
        renderGokartResultsTable();
    }

    // Handle Enter key in password modal
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitPassword();
            }
        });
    }
});
