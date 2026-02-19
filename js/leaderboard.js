// Dird Plesk Memorial - Leaderboard Module
// Point calculations, overall/event leaderboards, cumulative chart, podium
// Depends on: firebase.js (data accessors), golf.js, events.js, trivia.js, predictions.js

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

    // Golf points (team total includes base points, bonuses, and shotguns)
    const golfTeams = getGolfTeams();

    Object.keys(golfTeams).forEach(teamNum => {
        const teamTotal = calculateGolfTeamTotal(teamNum);
        const teamPlayers = golfTeams[teamNum] || [];
        teamPlayers.forEach(player => {
            if (playerPoints[player]) playerPoints[player].golf += teamTotal;
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
        if (col.key === 'predictions') return; // predictions added at the end
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

    // Add predictions as final point if any predictions are finalized
    if (completed.predictions) {
        eventsToShow.push('Preds');
        cumulativeKeys.push('predictions');
    }

    if (eventsToShow.length === 1) {
        container.innerHTML = '<h3 class="text-gold mb-15">Cumulative Score Progression</h3><p class="text-center text-muted">Chart will populate as events are completed</p>';
        return;
    }

    if (players.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No data to display</p>';
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
        tbody.innerHTML = emptyTableRow(7, 'No golf results yet');
        return;
    }

    // Build team data with full breakdown
    const teamData = Object.keys(teams).map(teamNum => {
        const breakdown = getGolfTeamBreakdown(teamNum);
        return {
            teamNum,
            players: teams[teamNum],
            breakdown
        };
    });

    teamData.sort((a, b) => b.breakdown.grandTotal - a.breakdown.grandTotal);

    tbody.innerHTML = '';
    teamData.forEach((team, idx) => {
        const rank = idx + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const b = team.breakdown;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${rankClass}">${rank}</td>
            <td>Team ${team.teamNum}</td>
            <td>${team.players.join(', ')}</td>
            <td>${b.totalScore || '--'}</td>
            <td>${b.totalPoints}</td>
            <td>${b.frontBonus + b.backBonus + b.overallBonus + b.shotgunPoints}</td>
            <td style="font-weight: bold;">${b.grandTotal}</td>
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
        html += hasData ? buildRankedTableBody(sorted) : emptyTableRow(3, `No ${event.name} results yet`);
        html += '</tbody></table></div></div>';
    });

    container.innerHTML = html;
}

function renderTriviaLeaderboard() {
    const tbody = document.querySelector('#triviaLeaderboard tbody');
    if (!tbody) return;

    const game = getTriviaGame();
    const triviaPoints = calculateTriviaPlayerPoints();
    const hasData = Object.values(triviaPoints).some(p => p > 0);

    if (!hasData && game.status === 'waiting') {
        tbody.innerHTML = emptyTableRow(3, 'No trivia results yet');
        return;
    }

    const sorted = Object.entries(triviaPoints).sort((a, b) => b[1] - a[1]);
    tbody.innerHTML = buildRankedTableBody(sorted);
}

function renderPredictionsLeaderboard() {
    const tbody = document.querySelector('#predictionsLeaderboard tbody');
    if (!tbody) return;

    const predictionPoints = calculatePredictionPoints();
    const hasData = Object.values(predictionPoints).some(p => p > 0);

    if (!hasData) {
        tbody.innerHTML = emptyTableRow(3, 'No predictions results yet');
        return;
    }

    const sorted = Object.entries(predictionPoints).sort((a, b) => b[1] - a[1]);
    tbody.innerHTML = buildRankedTableBody(sorted);
}
