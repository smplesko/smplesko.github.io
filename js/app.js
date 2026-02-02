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

// Player management (Admin) - with editable names
function renderPlayerList() {
    const container = document.getElementById('playerList');
    if (!container) return;

    const players = getPlayers();
    container.innerHTML = '<h4 style="margin-bottom: 15px;">Player Names:</h4>';

    const list = document.createElement('div');
    list.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;';

    for (let slot = 1; slot <= 12; slot++) {
        const player = players[slot] || { name: '', isAdmin: false };
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;';
        item.innerHTML = `
            <label style="display: block; font-size: 0.8em; color: var(--silver); margin-bottom: 5px;">
                Player ${slot}${slot === 1 ? ' (Admin)' : ''}
            </label>
            <input type="text"
                   id="playerName${slot}"
                   value="${player.name}"
                   placeholder="Enter name"
                   onchange="savePlayerName(${slot})"
                   style="width: 100%; padding: 10px; border: none; border-radius: 5px; font-size: 1em;">
        `;
        list.appendChild(item);
    }

    container.appendChild(list);
}

function savePlayerName(slot) {
    const input = document.getElementById(`playerName${slot}`);
    if (input) {
        updatePlayerName(slot, input.value.trim());

        // If this is the current user, update their display name
        if (String(getCurrentUserSlot()) === String(slot)) {
            localStorage.setItem('currentUser', input.value.trim());
            updateUI();
        }
    }
}

// Site settings management (Admin)
function renderSiteSettings() {
    const container = document.getElementById('siteSettingsContainer');
    if (!container) return;

    const settings = getSiteSettings();
    const notesVisible = settings.notesVisible !== false;
    const notesContent = settings.notesContent || 'Notes go here';
    const eventLocks = settings.eventLocks || {};

    container.innerHTML = `
        <div style="display: grid; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; color: var(--silver);">Homepage Title (H1)</label>
                <input type="text" id="heroTitleInput" value="${settings.heroTitle || ''}"
                       style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; color: var(--silver);">Homepage Subtitle</label>
                <input type="text" id="heroSubtitleInput" value="${settings.heroSubtitle || ''}"
                       style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
            </div>
            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 5px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <label class="toggle-switch">
                        <input type="checkbox" id="notesVisibleToggle" ${notesVisible ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span style="color: var(--silver);">Show Notes Section on Homepage</span>
                </div>
                <label style="display: block; margin-bottom: 5px; color: var(--silver);">Notes Content (HTML supported for links)</label>
                <textarea id="notesContentInput" placeholder="Enter notes here... Use &lt;a href='url'&gt;link text&lt;/a&gt; for hyperlinks"
                          style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em; min-height: 120px; resize: vertical; font-family: inherit;">${notesContent}</textarea>
                <p style="font-size: 0.8em; color: var(--silver); margin-top: 5px; opacity: 0.7;">
                    Tip: Use &lt;br&gt; for line breaks, &lt;a href="url"&gt;text&lt;/a&gt; for links
                </p>
            </div>
            <button class="btn btn-gold" onclick="saveSiteSettingsForm()">Save Site Settings</button>

            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 10px;">
                <h4 style="color: var(--gold); margin-bottom: 15px;">Event Locks</h4>
                <p style="font-size: 0.85em; color: var(--silver); margin-bottom: 15px;">Lock events to prevent accidental score changes. Custom event locks are managed in their own settings.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="lockGolf" ${eventLocks.golf ? 'checked' : ''} onchange="toggleEventLock('golf')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Golf ${eventLocks.golf ? '(Locked)' : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="lockTrivia" ${eventLocks.trivia ? 'checked' : ''} onchange="toggleEventLock('trivia')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Trivia ${eventLocks.trivia ? '(Locked)' : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="lockPredictions" ${eventLocks.predictions ? 'checked' : ''} onchange="toggleEventLock('predictions')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Predictions ${eventLocks.predictions ? '(Locked)' : ''}</span>
                    </div>
                </div>
            </div>

            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 10px;">
                <h4 style="color: var(--gold); margin-bottom: 15px;">Competition Status</h4>
                ${settings.competitionClosed
                    ? `<div style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="color: #2ecc71; font-weight: bold;">Competition is CLOSED</p>
                        <p style="font-size: 0.9em; margin-top: 5px;">Final standings are displayed on the Leaderboard.</p>
                       </div>
                       <button class="btn" onclick="reopenCompetition()" style="background: var(--silver);">Reopen Competition</button>`
                    : `<p style="font-size: 0.9em; color: var(--silver); margin-bottom: 15px;">
                        When all events are complete, close the competition to reveal final standings and podium display.
                       </p>
                       <button class="btn" onclick="closeCompetition()" style="background: #2ecc71;">Close Competition & Reveal Final Standings</button>`
                }
            </div>
        </div>
    `;
}

function toggleEventLock(eventName) {
    const settings = getSiteSettings();
    if (!settings.eventLocks) {
        settings.eventLocks = { golf: false, trivia: false, predictions: false };
    }
    settings.eventLocks[eventName] = !settings.eventLocks[eventName];
    saveSiteSettings(settings);

    const lockNames = { golf: 'Golf', trivia: 'Trivia', predictions: 'Predictions' };
    const action = settings.eventLocks[eventName] ? 'locked' : 'unlocked';
    alert(`${lockNames[eventName]} is now ${action}.`);
}

function isEventLocked(eventName) {
    const settings = getSiteSettings();
    return settings.eventLocks && settings.eventLocks[eventName];
}

function closeCompetition() {
    if (!confirm('Are you sure you want to close the competition? This will reveal final standings to all players.')) {
        return;
    }

    const settings = getSiteSettings();
    settings.competitionClosed = true;
    saveSiteSettings(settings);
    alert('Competition closed! Final standings are now visible on the Leaderboard.');
    renderSiteSettings();
}

function reopenCompetition() {
    if (!confirm('Are you sure you want to reopen the competition? This will hide the final standings.')) {
        return;
    }

    const settings = getSiteSettings();
    settings.competitionClosed = false;
    saveSiteSettings(settings);
    alert('Competition reopened.');
    renderSiteSettings();
}

function saveSiteSettingsForm() {
    const title = document.getElementById('heroTitleInput').value.trim();
    const subtitle = document.getElementById('heroSubtitleInput').value.trim();
    const notesVisible = document.getElementById('notesVisibleToggle').checked;
    const notesContent = document.getElementById('notesContentInput').value;

    const settings = getSiteSettings();
    settings.heroTitle = title || DEFAULT_SITE_SETTINGS.heroTitle;
    settings.heroSubtitle = subtitle || DEFAULT_SITE_SETTINGS.heroSubtitle;
    settings.notesVisible = notesVisible;
    settings.notesContent = notesContent;

    saveSiteSettings(settings);
    alert('Site settings saved!');

    // Update homepage if we're on it
    applyHeroSettings();
}

function applyHeroSettings() {
    const settings = getSiteSettings();
    const heroH1 = document.querySelector('.hero h1');
    const heroP = document.querySelector('.hero p');

    if (heroH1) heroH1.textContent = settings.heroTitle || DEFAULT_SITE_SETTINGS.heroTitle;
    if (heroP) heroP.textContent = settings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle;

    // Update notes section
    const notesSection = document.getElementById('notesSection');
    if (notesSection) {
        const notesVisible = settings.notesVisible !== false;
        const notesContent = settings.notesContent || 'Notes go here';

        if (notesVisible) {
            notesSection.style.display = 'block';
            notesSection.querySelector('.notes-content').innerHTML = notesContent;
        } else {
            notesSection.style.display = 'none';
        }
    }
}




// Calculate all player points (dynamic: golf + custom events + trivia + predictions)
function calculatePlayerPoints() {
    const playerList = getPlayerList();
    const playerPoints = {};
    const customEvents = getCustomEvents();
    const eventList = Object.values(customEvents).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Initialize with golf, trivia, predictions, and one key per custom event
    playerList.forEach(player => {
        const pts = { golf: 0, trivia: 0, predictions: 0, total: 0 };
        eventList.forEach(event => {
            pts[event.id] = 0;
        });
        playerPoints[player] = pts;
    });

    // Golf points (from hole-by-hole scoring)
    const golfTeams = getGolfTeams();
    const golfBonuses = getGolfBonuses();
    const bonusPoints = getBonusPoints();

    const teamTotals = {};
    Object.keys(golfTeams).forEach(teamNum => {
        teamTotals[teamNum] = calculateGolfTeamTotal(teamNum);
    });

    if (golfBonuses.bestFront && golfTeams[golfBonuses.bestFront]) {
        golfTeams[golfBonuses.bestFront].forEach(player => {
            if (playerPoints[player]) playerPoints[player].golf += bonusPoints.bestFront;
        });
    }
    if (golfBonuses.bestBack && golfTeams[golfBonuses.bestBack]) {
        golfTeams[golfBonuses.bestBack].forEach(player => {
            if (playerPoints[player]) playerPoints[player].golf += bonusPoints.bestBack;
        });
    }
    if (golfBonuses.overallWinner && golfTeams[golfBonuses.overallWinner]) {
        golfTeams[golfBonuses.overallWinner].forEach(player => {
            if (playerPoints[player]) playerPoints[player].golf += bonusPoints.overallWinner;
        });
    }

    Object.keys(golfTeams).forEach(teamNum => {
        const teamPlayers = golfTeams[teamNum] || [];
        teamPlayers.forEach(player => {
            if (playerPoints[player]) playerPoints[player].golf += teamTotals[teamNum] || 0;
        });
    });

    // Custom event points
    eventList.forEach(event => {
        const eventPlayerPoints = calculateCustomEventPlayerPoints(event);
        Object.keys(eventPlayerPoints).forEach(player => {
            if (playerPoints[player]) {
                playerPoints[player][event.id] = eventPlayerPoints[player];
            }
        });
    });

    // Trivia points
    const triviaPlayerPoints = calculateTriviaPlayerPoints();
    Object.keys(triviaPlayerPoints).forEach(player => {
        if (playerPoints[player]) playerPoints[player].trivia = triviaPlayerPoints[player];
    });

    // Prediction points
    const predictionPlayerPoints = calculatePredictionPoints();
    Object.keys(predictionPlayerPoints).forEach(player => {
        if (playerPoints[player]) playerPoints[player].predictions = predictionPlayerPoints[player];
    });

    // Calculate totals
    Object.keys(playerPoints).forEach(player => {
        let total = playerPoints[player].golf + playerPoints[player].trivia + playerPoints[player].predictions;
        eventList.forEach(event => {
            total += playerPoints[player][event.id] || 0;
        });
        playerPoints[player].total = total;
    });

    return playerPoints;
}

// Helper to get ordered column info for leaderboard
function getLeaderboardColumns() {
    const customEvents = getCustomEvents();
    const eventList = Object.values(customEvents).sort((a, b) => (a.order || 0) - (b.order || 0));

    const columns = [{ key: 'golf', label: 'Golf' }];
    eventList.forEach(event => {
        columns.push({ key: event.id, label: event.name });
    });
    columns.push({ key: 'trivia', label: 'Trivia' });
    columns.push({ key: 'predictions', label: 'Preds' });

    return columns;
}

// Leaderboard rendering
function renderLeaderboards() {
    renderPodium();
    renderOverallLeaderboard();
    renderCumulativeChart();
    renderGolfLeaderboard();
    renderCustomEventLeaderboards();
    renderTriviaLeaderboard();
    renderPredictionsLeaderboard();
}

// Podium display (shows when competition is closed by admin)
function renderPodium() {
    const container = document.getElementById('podiumDisplay');
    if (!container) return;

    const settings = getSiteSettings();

    // Only show podium after competition is closed
    if (!settings.competitionClosed) {
        container.style.display = 'none';
        return;
    }

    const playerPoints = calculatePlayerPoints();
    const sorted = Object.entries(playerPoints)
        .sort((a, b) => b[1].total - a[1].total);

    if (sorted.length < 3) {
        container.style.display = 'none';
        return;
    }

    const [first, second, third] = sorted;

    container.style.display = 'block';
    container.innerHTML = `
        <div class="podium-container" style="text-align: center; padding: 30px 20px;">
            <h2 style="color: var(--gold); margin-bottom: 30px;">Final Results</h2>
            <div class="podium" style="display: flex; justify-content: center; align-items: flex-end; gap: 10px; max-width: 500px; margin: 0 auto;">
                <!-- 2nd Place -->
                <div class="podium-place second" style="flex: 1;">
                    <div style="background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%); padding: 15px 10px; border-radius: 10px 10px 0 0;">
                        <div style="font-size: 2em;">🥈</div>
                        <div style="font-weight: bold; margin: 5px 0;">${second[0]}</div>
                        <div style="font-size: 1.3em; color: var(--primary-dark);">${second[1].total} pts</div>
                    </div>
                    <div style="background: #a8a8a8; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; font-weight: bold; color: var(--primary-dark);">2</div>
                </div>
                <!-- 1st Place -->
                <div class="podium-place first" style="flex: 1;">
                    <div style="background: linear-gradient(135deg, #ffd700 0%, #c9a227 100%); padding: 20px 10px; border-radius: 10px 10px 0 0;">
                        <div style="font-size: 2.5em;">🏆</div>
                        <div style="font-weight: bold; font-size: 1.2em; margin: 5px 0;">${first[0]}</div>
                        <div style="font-size: 1.5em; color: var(--primary-dark);">${first[1].total} pts</div>
                    </div>
                    <div style="background: #c9a227; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 1.8em; font-weight: bold; color: var(--primary-dark);">1</div>
                </div>
                <!-- 3rd Place -->
                <div class="podium-place third" style="flex: 1;">
                    <div style="background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%); padding: 15px 10px; border-radius: 10px 10px 0 0;">
                        <div style="font-size: 2em;">🥉</div>
                        <div style="font-weight: bold; margin: 5px 0;">${third[0]}</div>
                        <div style="font-size: 1.3em; color: var(--primary-dark);">${third[1].total} pts</div>
                    </div>
                    <div style="background: #b87333; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; font-weight: bold; color: var(--primary-dark);">3</div>
                </div>
            </div>
        </div>
    `;
}

function renderOverallLeaderboard() {
    const tableContainer = document.getElementById('overallLeaderboardContainer');
    if (!tableContainer) return;

    const playerPoints = calculatePlayerPoints();
    const columns = getLeaderboardColumns();
    const sorted = Object.entries(playerPoints)
        .sort((a, b) => b[1].total - a[1].total);

    let html = '<div style="overflow-x: auto;"><table class="leaderboard-table" id="overallLeaderboard"><thead><tr>';
    html += '<th>Rank</th><th>Player</th>';
    columns.forEach(col => {
        html += `<th>${col.label}</th>`;
    });
    html += '<th>Total</th></tr></thead><tbody>';

    sorted.forEach(([player, points], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        html += `<tr><td class="${rankClass}">${rank}</td><td>${player}</td>`;
        columns.forEach(col => {
            html += `<td>${points[col.key] || 0}</td>`;
        });
        html += `<td style="font-weight: bold;">${points.total}</td></tr>`;
    });

    html += '</tbody></table></div>';
    tableContainer.innerHTML = html;
}

function renderCumulativeChart() {
    const container = document.getElementById('cumulativeChart');
    if (!container) return;

    const playerPoints = calculatePlayerPoints();
    const players = Object.keys(playerPoints);
    const completed = getCompletedEvents();
    const columns = getLeaderboardColumns();

    // Build list of completed events for the chart
    let eventsToShow = ['Start'];
    let cumulativeKeys = []; // keys in order for cumulative addition
    columns.forEach(col => {
        if (col.key === 'predictions') return; // predictions shown separately
        if (col.key === 'golf' && completed.golf) {
            eventsToShow.push('Golf');
            cumulativeKeys.push('golf');
        } else if (col.key === 'trivia' && completed.trivia) {
            eventsToShow.push('Trivia');
            cumulativeKeys.push('trivia');
        } else if (col.key !== 'golf' && col.key !== 'trivia' && col.key !== 'predictions' && completed[col.key]) {
            eventsToShow.push(col.label);
            cumulativeKeys.push(col.key);
        }
    });

    if (eventsToShow.length === 1) {
        container.innerHTML = '<h3 style="color: var(--gold); margin-bottom: 15px;">Cumulative Score Progression</h3><p style="text-align: center; opacity: 0.7;">Chart will populate as events are completed</p>';
        return;
    }

    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No data to display</p>';
        return;
    }

    const chartData = players.map(player => {
        const pts = playerPoints[player];
        const scores = [0];
        let cumulative = 0;
        cumulativeKeys.forEach(key => {
            cumulative += pts[key] || 0;
            scores.push(cumulative);
        });
        return { name: player, scores };
    });

    // Sort by final score
    const lastIdx = chartData[0].scores.length - 1;
    chartData.sort((a, b) => b.scores[lastIdx] - a.scores[lastIdx]);

    // Chart dimensions - full width responsive
    const width = 900;
    const height = 380;
    const padding = { top: 30, right: 100, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max score for scaling
    const maxScore = Math.max(...chartData.map(d => Math.max(...d.scores)), 1);

    // Generate distinct colors for players
    const colors = [
        '#c8102e', '#c9a227', '#3498db', '#2ecc71', '#9b59b6',
        '#e67e22', '#1abc9c', '#e74c3c', '#f39c12', '#8e44ad',
        '#16a085', '#d35400', '#27ae60', '#2980b9', '#c0392b', '#7f8c8d'
    ];

    // Build SVG with preserveAspectRatio for full width
    let svg = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto; display: block;">`;

    // Background
    svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>`;

    // Grid lines
    const yGridLines = 5;
    for (let i = 0; i <= yGridLines; i++) {
        const y = padding.top + (chartHeight / yGridLines) * i;
        const value = Math.round(maxScore - (maxScore / yGridLines) * i);
        svg += `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="var(--silver)" stroke-opacity="0.2" stroke-dasharray="3,3"/>`;
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="var(--silver)" font-size="12">${value}</text>`;
    }

    // X axis labels (only for events being shown)
    const numEvents = eventsToShow.length;
    eventsToShow.forEach((event, i) => {
        const x = padding.left + (chartWidth / (numEvents - 1)) * i;
        svg += `<text x="${x}" y="${height - padding.bottom + 25}" text-anchor="middle" fill="var(--silver)" font-size="12">${event}</text>`;
    });

    // Draw lines for each player
    chartData.forEach((player, playerIdx) => {
        const color = colors[playerIdx % colors.length];
        let pathD = '';

        player.scores.forEach((score, i) => {
            const x = padding.left + (chartWidth / (numEvents - 1)) * i;
            const y = padding.top + chartHeight - (score / maxScore) * chartHeight;

            if (i === 0) {
                pathD += `M ${x} ${y}`;
            } else {
                pathD += ` L ${x} ${y}`;
            }
        });

        // Draw line
        svg += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

        // Draw points
        player.scores.forEach((score, i) => {
            const x = padding.left + (chartWidth / (numEvents - 1)) * i;
            const y = padding.top + chartHeight - (score / maxScore) * chartHeight;
            svg += `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`;
        });

        // Player label at end of line
        const lastScore = player.scores[player.scores.length - 1];
        const lastX = padding.left + chartWidth + 8;
        const lastY = padding.top + chartHeight - (lastScore / maxScore) * chartHeight;
        svg += `<text x="${lastX}" y="${lastY + 4}" fill="${color}" font-size="11" font-weight="bold">${player.name}</text>`;
    });

    svg += '</svg>';

    let html = '<h3 style="color: var(--gold); margin-bottom: 15px;">Cumulative Score Progression</h3>';
    html += '<div class="chart-container" style="width: 100%;">';
    html += svg;
    html += '</div>';

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

function renderCustomEventLeaderboards() {
    const container = document.getElementById('customEventLeaderboards');
    if (!container) return;

    const customEvents = getCustomEvents();
    const eventList = Object.values(customEvents).sort((a, b) => (a.order || 0) - (b.order || 0));

    if (eventList.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    eventList.forEach(event => {
        const eventPoints = calculateCustomEventPlayerPoints(event);
        const hasData = Object.values(eventPoints).some(p => p > 0);
        const sorted = Object.entries(eventPoints).sort((a, b) => b[1] - a[1]);

        html += `<div class="section-card"><h2>${event.name} Results</h2>`;
        html += '<div style="overflow-x: auto;"><table class="leaderboard-table"><thead><tr>';
        html += '<th>Rank</th><th>Player</th><th>Points</th>';
        html += '</tr></thead><tbody>';

        if (!hasData) {
            html += `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">No ${event.name} results yet</td></tr>`;
        } else {
            sorted.forEach(([player, points], idx) => {
                const rank = idx + 1;
                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                html += `<tr><td class="${rankClass}">${rank}</td><td>${player}</td><td>${points}</td></tr>`;
            });
        }

        html += '</tbody></table></div></div>';
    });

    container.innerHTML = html;
}

function renderTriviaLeaderboard() {
    const tbody = document.querySelector('#triviaLeaderboard tbody');
    if (!tbody) return;

    const game = getTriviaGame();
    const triviaPoints = calculateTriviaPlayerPoints();

    // Check if trivia has any data
    const hasData = Object.values(triviaPoints).some(p => p > 0);

    if (!hasData && game.status === 'waiting') {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">No trivia results yet</td></tr>`;
        return;
    }

    const sorted = Object.entries(triviaPoints).sort((a, b) => b[1] - a[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, points], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>${player}</td>
            <td>${points}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPredictionsLeaderboard() {
    const tbody = document.querySelector('#predictionsLeaderboard tbody');
    if (!tbody) return;

    const predictionPoints = calculatePredictionPoints();
    const hasData = Object.values(predictionPoints).some(p => p > 0);

    if (!hasData) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; opacity: 0.7;">No predictions results yet</td></tr>`;
        return;
    }

    const sorted = Object.entries(predictionPoints).sort((a, b) => b[1] - a[1]);

    tbody.innerHTML = '';
    sorted.forEach(([player, points], idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>${player}</td>
            <td>${points}</td>
        `;
        tbody.appendChild(tr);
    });
}

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
            alert('Name updated!');
            renderProfile();
        }
    }
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
        customEvents: getCustomEvents(),
        triviaGame: getTriviaGame(),
        siteSettings: getSiteSettings(),
        predictions: getPredictions()
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
            // Reset Firebase data to defaults
            writeToFirebase('players', DEFAULT_PLAYERS);
            writeToFirebase('triviaPoints', DEFAULT_TRIVIA_POINTS);
            writeToFirebase('bonusPoints', DEFAULT_BONUS_POINTS);
            writeToFirebase('golfTeams', {});
            writeToFirebase('golfHoleScores', {});
            writeToFirebase('golfShotguns', {});
            writeToFirebase('golfBonuses', { bestFront: '', bestBack: '', overallWinner: '' });
            writeToFirebase('golfScoringEnabled', {});
            writeToFirebase('customEvents', {});
            writeToFirebase('triviaGame', DEFAULT_TRIVIA_GAME);
            writeToFirebase('siteSettings', DEFAULT_SITE_SETTINGS);
            writeToFirebase('predictions', DEFAULT_PREDICTIONS);

            alert('All data has been reset');
            window.location.reload();
        }
    }
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
