// Dird Plesk Memorial - Custom Events Module
// Event CRUD, scoring logic, admin UI, and player-facing page
// Depends on: utils.js, firebase.js, auth.js

// ===== CONSTANTS =====
const SCORING_LABELS = {
    'individual': 'Individual',
    'team_shared': 'Team Shared',
    'individual_to_team': 'Individual→Team'
};

// ===== CUSTOM EVENTS SYSTEM =====

function getCustomEvent(eventId) {
    const events = getCustomEvents();
    return events[eventId] || null;
}

function createCustomEvent(name, description, scoringMode, roundCount) {
    const events = getCustomEvents();
    const id = 'evt_' + Date.now();

    const newEvent = {
        id: id,
        name: name,
        description: description || '',
        scoringMode: scoringMode,
        roundCount: parseInt(roundCount) || 1,
        locked: false,
        order: Object.keys(events).length + 1,
        rounds: {}
    };

    for (let i = 1; i <= newEvent.roundCount; i++) {
        newEvent.rounds[i] = {
            name: `Round ${i}`,
            teamCount: 2,
            pointValues: scoringMode === 'individual' ? getDefaultPositionPoints() : {},
            teams: {},
            results: {}
        };
    }

    events[id] = newEvent;
    saveCustomEvents(events);
    return id;
}

function deleteCustomEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event and all its data?')) return;
    const events = getCustomEvents();
    delete events[eventId];
    saveCustomEvents(events);
}

function updateCustomEventField(eventId, field, value) {
    const events = getCustomEvents();
    if (!events[eventId]) return;
    events[eventId][field] = value;
    saveCustomEvents(events);
}

function updateEventRound(eventId, roundNum, updates) {
    const events = getCustomEvents();
    if (!events[eventId]) return;
    if (!events[eventId].rounds) events[eventId].rounds = {};
    if (!events[eventId].rounds[roundNum]) {
        events[eventId].rounds[roundNum] = {
            name: `Round ${roundNum}`,
            teamCount: 2,
            pointValues: {},
            teams: {},
            results: {}
        };
    }
    Object.assign(events[eventId].rounds[roundNum], updates);
    saveCustomEvents(events);
}

function addEventRound(eventId) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event) return;

    const roundKeys = Object.keys(event.rounds || {}).map(Number);
    const nextRound = roundKeys.length > 0 ? Math.max(...roundKeys) + 1 : 1;

    if (!event.rounds) event.rounds = {};
    event.rounds[nextRound] = {
        name: `Round ${nextRound}`,
        teamCount: 2,
        pointValues: event.scoringMode === 'individual' ? getDefaultPositionPoints() : {},
        teams: {},
        results: {}
    };
    event.roundCount = Object.keys(event.rounds).length;
    saveCustomEvents(events);
}

function removeEventRound(eventId, roundNum) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event || !event.rounds) return;
    if (!confirm(`Delete Round ${roundNum}? This removes all teams and results for this round.`)) return;

    delete event.rounds[roundNum];
    event.roundCount = Object.keys(event.rounds).length;
    saveCustomEvents(events);
}

function copyPreviousRoundTeams(eventId, roundNum) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event) return;

    const roundKeys = Object.keys(event.rounds || {}).map(Number).sort((a, b) => a - b);
    const currentIdx = roundKeys.indexOf(parseInt(roundNum));
    if (currentIdx <= 0) {
        alert('No previous round to copy from.');
        return;
    }
    const prevRoundNum = roundKeys[currentIdx - 1];
    const prevRound = event.rounds[prevRoundNum];
    if (!prevRound || !prevRound.teams || Object.keys(prevRound.teams).length === 0) {
        alert('Previous round has no teams to copy.');
        return;
    }

    event.rounds[roundNum].teams = JSON.parse(JSON.stringify(prevRound.teams));
    event.rounds[roundNum].teamCount = prevRound.teamCount || 2;
    saveCustomEvents(events);
    alert(`Teams copied from ${prevRound.name || 'Round ' + prevRoundNum}!`);
}

// Save round teams from checkbox UI
function saveEventRoundTeams(eventId, roundNum) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event) return;

    const round = event.rounds[roundNum];
    if (!round) return;

    const teamCount = round.teamCount || 2;
    const teams = {};
    for (let i = 1; i <= teamCount; i++) {
        teams[i] = getSelectedFromCheckboxGroup(`ce_${eventId}_r${roundNum}`, i);
    }

    round.teams = teams;
    saveCustomEvents(events);
    alert(`Round ${roundNum} teams saved!`);
}

// Save round results from input UI
function saveEventRoundResults(eventId, roundNum) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event || !event.rounds[roundNum]) return;

    const round = event.rounds[roundNum];
    const results = {};

    if (event.scoringMode === 'individual') {
        // Results: player → position
        const playerList = getPlayerList();
        playerList.forEach(player => {
            const sel = document.getElementById(`ceRes_${eventId}_r${roundNum}_${player.replace(/\s/g, '_')}`);
            if (sel && sel.value) {
                results[player] = parseInt(sel.value);
            }
        });
    } else if (event.scoringMode === 'team_shared') {
        // Results: teamNum → score
        const teams = round.teams || {};
        Object.keys(teams).forEach(teamNum => {
            const input = document.getElementById(`ceRes_${eventId}_r${roundNum}_t${teamNum}`);
            if (input && input.value !== '') {
                results[teamNum] = parseInt(input.value) || 0;
            }
        });
    } else if (event.scoringMode === 'individual_to_team') {
        // Results: player → individual score
        const playerList = getPlayerList();
        playerList.forEach(player => {
            const input = document.getElementById(`ceRes_${eventId}_r${roundNum}_${player.replace(/\s/g, '_')}`);
            if (input && input.value !== '') {
                results[player] = parseInt(input.value) || 0;
            }
        });
    }

    round.results = results;
    saveCustomEvents(events);
    alert(`Round ${roundNum} results saved!`);
}

// Save point values for a round
function saveEventRoundPoints(eventId, roundNum) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event || !event.rounds[roundNum]) return;

    const round = event.rounds[roundNum];
    const pointValues = {};
    const maxPositions = MAX_PLAYERS;

    for (let i = 1; i <= maxPositions; i++) {
        const input = document.getElementById(`cePts_${eventId}_r${roundNum}_p${i}`);
        if (input && input.value !== '') {
            pointValues[i] = parseInt(input.value) || 0;
        }
    }

    round.pointValues = pointValues;
    saveCustomEvents(events);
    alert('Point values saved!');
}

// Update round team count
function updateEventRoundTeamCount(eventId, roundNum, count) {
    const events = getCustomEvents();
    const event = events[eventId];
    if (!event || !event.rounds[roundNum]) return;

    event.rounds[roundNum].teamCount = parseInt(count) || 2;
    saveCustomEvents(events);
}

// Update round name
function saveEventRoundName(eventId, roundNum) {
    const input = document.getElementById(`ceRoundName_${eventId}_r${roundNum}`);
    if (!input) return;
    updateEventRound(eventId, roundNum, { name: input.value.trim() || `Round ${roundNum}` });
}

// Calculate points for a single custom event
function calculateCustomEventPlayerPoints(event) {
    const playerList = getPlayerList();
    const playerPoints = {};
    playerList.forEach(p => { playerPoints[p] = 0; });

    if (!event || !event.rounds) return playerPoints;

    Object.values(event.rounds).forEach(round => {
        const results = round.results || {};
        const pointValues = round.pointValues || {};
        const teams = round.teams || {};

        if (event.scoringMode === 'individual') {
            Object.entries(results).forEach(([player, position]) => {
                if (playerPoints.hasOwnProperty(player)) {
                    playerPoints[player] += parseInt(pointValues[position]) || 0;
                }
            });
        } else if (event.scoringMode === 'team_shared') {
            Object.entries(results).forEach(([teamNum, score]) => {
                const teamPlayers = teams[teamNum] || [];
                teamPlayers.forEach(player => {
                    if (playerPoints.hasOwnProperty(player)) {
                        playerPoints[player] += parseInt(score) || 0;
                    }
                });
            });
        } else if (event.scoringMode === 'individual_to_team') {
            // Pool individual scores per team, rank teams, assign shared points
            const teamTotals = {};
            Object.entries(teams).forEach(([teamNum, teamPlayers]) => {
                teamTotals[teamNum] = 0;
                (teamPlayers || []).forEach(player => {
                    teamTotals[teamNum] += parseInt(results[player]) || 0;
                });
            });

            const sortedTeams = Object.entries(teamTotals)
                .sort((a, b) => b[1] - a[1]);

            sortedTeams.forEach(([teamNum], idx) => {
                const rank = idx + 1;
                const pts = parseInt(pointValues[rank]) || 0;
                const teamPlayers = teams[teamNum] || [];
                teamPlayers.forEach(player => {
                    if (playerPoints.hasOwnProperty(player)) {
                        playerPoints[player] += pts;
                    }
                });
            });
        }
    });

    return playerPoints;
}

// ===== CUSTOM EVENTS ADMIN UI =====

function renderCustomEventsAdmin() {
    const container = document.getElementById('customEventsAdminContainer');
    if (!container) return;

    const events = getCustomEvents();
    const eventList = Object.values(events).sort((a, b) => (a.order || 0) - (b.order || 0));

    let html = `
        <div class="admin-section">
            <h2 style="color: var(--gold);">Create New Event</h2>
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Event Name</label>
                    <input type="text" id="newEventName" placeholder="e.g., Beer Olympics, Go-Karts"
                           style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Description (optional)</label>
                    <input type="text" id="newEventDescription" placeholder="Brief description"
                           style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Scoring Mode</label>
                    <select id="newEventScoringMode" style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                        <option value="individual">Individual (each player scores independently)</option>
                        <option value="team_shared">Team Shared (team score = each member's score)</option>
                        <option value="individual_to_team">Individual-to-Team (individual scores pooled, team rank = shared points)</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Number of Rounds</label>
                    <input type="number" id="newEventRoundCount" value="1" min="1" max="20"
                           style="width: 100px; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                </div>
                <button class="btn btn-gold" onclick="handleCreateCustomEvent()">Create Event</button>
            </div>
        </div>
    `;

    if (eventList.length > 0) {
        html += '<div class="admin-section" style="margin-top: 20px;">';
        html += '<h2 style="color: var(--gold);">Manage Events</h2>';

        eventList.forEach(event => {
            const roundCount = Object.keys(event.rounds || {}).length;
            html += `
                <div style="background: var(--overlay-bg); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <h3 style="color: var(--gold); margin-bottom: 5px;">${event.name}</h3>
                            <p style="font-size: 0.85em; opacity: 0.7;">
                                ${SCORING_LABELS[event.scoringMode] || event.scoringMode} |
                                ${roundCount} round(s)
                                ${event.locked ? ' | <span style="color: #e74c3c;">Locked</span>' : ''}
                            </p>
                            ${event.description ? `<p style="font-size: 0.85em; opacity: 0.7; margin-top: 3px;">${event.description}</p>` : ''}
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                            <label class="toggle-switch" style="margin: 0;">
                                <input type="checkbox" ${event.locked ? 'checked' : ''} onchange="updateCustomEventField('${event.id}', 'locked', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span style="font-size: 0.85em;">Lock</span>
                            <button class="btn btn-small" onclick="toggleCustomEventExpand('${event.id}')">Configure</button>
                            <button class="btn btn-small" onclick="deleteCustomEvent('${event.id}')" style="background: var(--accent-red);">Delete</button>
                        </div>
                    </div>
                    <div id="eventConfig_${event.id}" style="display: none; margin-top: 15px; border-top: 1px solid var(--card-border); padding-top: 15px;">
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

function handleCreateCustomEvent() {
    const name = document.getElementById('newEventName').value.trim();
    const description = document.getElementById('newEventDescription').value.trim();
    const scoringMode = document.getElementById('newEventScoringMode').value;
    const roundCount = document.getElementById('newEventRoundCount').value;

    if (!name) {
        alert('Please enter an event name.');
        return;
    }

    createCustomEvent(name, description, scoringMode, roundCount);
    document.getElementById('newEventName').value = '';
    document.getElementById('newEventDescription').value = '';
    document.getElementById('newEventRoundCount').value = '1';
    alert(`Event "${name}" created!`);
    renderCustomEventsAdmin();
}

function toggleCustomEventExpand(eventId) {
    const configDiv = document.getElementById(`eventConfig_${eventId}`);
    if (!configDiv) return;

    if (configDiv.style.display === 'none') {
        configDiv.style.display = 'block';
        renderEventRoundConfigs(eventId);
    } else {
        configDiv.style.display = 'none';
    }
}

function renderEventRoundConfigs(eventId) {
    const configDiv = document.getElementById(`eventConfig_${eventId}`);
    if (!configDiv) return;

    const event = getCustomEvent(eventId);
    if (!event) return;

    const rounds = event.rounds || {};
    const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const playerList = getPlayerList();
    const needsTeams = event.scoringMode !== 'individual';
    const needsPositionPoints = event.scoringMode === 'individual' || event.scoringMode === 'individual_to_team';

    let html = `<p style="font-size: 0.85em; color: var(--silver); margin-bottom: 15px;">Scoring: ${SCORING_LABELS[event.scoringMode]}</p>`;

    roundKeys.forEach((roundNum, idx) => {
        const round = rounds[roundNum];
        const roundName = round.name || `Round ${roundNum}`;
        const teams = round.teams || {};
        const results = round.results || {};
        const pointValues = round.pointValues || {};
        const teamCount = round.teamCount || 2;

        html += `
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px;">
                        <input type="text" id="ceRoundName_${eventId}_r${roundNum}" value="${roundName}"
                               onchange="saveEventRoundName('${eventId}', ${roundNum})"
                               style="padding: 8px; border: none; border-radius: 5px; font-size: 0.95em; flex: 1;">
                    </div>
                    <button class="btn btn-small" onclick="removeEventRound('${eventId}', ${roundNum})" style="background: var(--accent-red); font-size: 0.8em;">Remove Round</button>
                </div>
        `;

        // Point values (for individual or individual_to_team)
        if (needsPositionPoints) {
            html += `<details style="margin-bottom: 10px;"><summary style="cursor: pointer; color: var(--gold); font-size: 0.9em;">Point Values (per position)</summary>`;
            html += '<div class="point-config" style="margin-top: 8px;">';
            for (let i = 1; i <= MAX_PLAYERS; i++) {
                html += `
                    <div class="point-config-item">
                        <label>${getOrdinal(i)}</label>
                        <input type="number" id="cePts_${eventId}_r${roundNum}_p${i}" value="${pointValues[i] || 0}" style="width: 60px;">
                    </div>
                `;
            }
            html += '</div>';
            html += `<button class="btn btn-small" onclick="saveEventRoundPoints('${eventId}', ${roundNum})" style="margin-top: 8px;">Save Points</button>`;
            html += '</details>';
        }

        // Team assignment (for team modes)
        if (needsTeams) {
            html += `
                <details style="margin-bottom: 10px;">
                    <summary style="cursor: pointer; color: var(--gold); font-size: 0.9em;">Team Assignment</summary>
                    <div style="margin-top: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                            <label style="font-size: 0.9em;">Teams:</label>
                            <select onchange="updateEventRoundTeamCount('${eventId}', ${roundNum}, this.value); renderEventRoundConfigs('${eventId}')"
                                    style="padding: 8px; border-radius: 5px; border: none;">
                                ${[2,3,4,6,12].map(n => `<option value="${n}" ${teamCount === n ? 'selected' : ''}>${n}</option>`).join('')}
                            </select>
                            ${idx > 0 ? `<button class="btn btn-small" onclick="copyPreviousRoundTeams('${eventId}', ${roundNum}); renderEventRoundConfigs('${eventId}')">Copy Previous Teams</button>` : ''}
                        </div>
                        <div class="team-assignment">
            `;

            for (let t = 1; t <= teamCount; t++) {
                const existingMembers = teams[t] || [];
                html += `<div class="team-card"><h4>Team ${t}</h4><div id="ceTeam_${eventId}_r${roundNum}_t${t}"></div></div>`;
            }

            html += `
                        </div>
                        <button class="btn btn-small btn-gold" onclick="saveEventRoundTeams('${eventId}', ${roundNum})" style="margin-top: 8px;">Save Teams</button>
                    </div>
                </details>
            `;
        }

        // Results entry
        html += `
            <details style="margin-bottom: 10px;">
                <summary style="cursor: pointer; color: var(--gold); font-size: 0.9em;">Enter Results</summary>
                <div style="margin-top: 8px;">
        `;

        if (event.scoringMode === 'individual') {
            html += '<div class="scoring-grid">';
            playerList.forEach(player => {
                const safeId = player.replace(/\s/g, '_');
                html += `
                    <div class="score-input">
                        <label>${player}</label>
                        <select id="ceRes_${eventId}_r${roundNum}_${safeId}">
                            <option value="">-- Pos --</option>
                            ${Array.from({length: MAX_PLAYERS}, (_, i) => i + 1).map(p =>
                                `<option value="${p}" ${results[player] === p ? 'selected' : ''}>${getOrdinal(p)}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            });
            html += '</div>';
        } else if (event.scoringMode === 'team_shared') {
            html += '<div class="scoring-grid">';
            for (let t = 1; t <= teamCount; t++) {
                const teamPlayers = teams[t] || [];
                html += `
                    <div class="score-input">
                        <label>Team ${t}</label>
                        <small style="display: block; opacity: 0.7; margin-bottom: 5px; font-size: 0.8em;">${teamPlayers.join(', ') || 'No players'}</small>
                        <input type="number" id="ceRes_${eventId}_r${roundNum}_t${t}" placeholder="Points" value="${results[t] || ''}">
                    </div>
                `;
            }
            html += '</div>';
        } else if (event.scoringMode === 'individual_to_team') {
            html += '<div class="scoring-grid">';
            playerList.forEach(player => {
                const safeId = player.replace(/\s/g, '_');
                html += `
                    <div class="score-input">
                        <label>${player}</label>
                        <input type="number" id="ceRes_${eventId}_r${roundNum}_${safeId}" placeholder="Score" value="${results[player] || ''}">
                    </div>
                `;
            });
            html += '</div>';
        }

        html += `
                    <button class="btn btn-small btn-gold" onclick="saveEventRoundResults('${eventId}', ${roundNum})" style="margin-top: 8px;">Save Results</button>
                </div>
            </details>
        `;

        html += '</div>';
    });

    html += `<button class="btn btn-small" onclick="addEventRound('${eventId}'); renderEventRoundConfigs('${eventId}')" style="margin-top: 5px;">+ Add Round</button>`;

    configDiv.innerHTML = html;

    // Initialize checkbox groups for team assignment (must be done after DOM update)
    if (needsTeams) {
        roundKeys.forEach(roundNum => {
            const round = rounds[roundNum];
            const teams = round.teams || {};
            const teamCount = round.teamCount || 2;
            for (let t = 1; t <= teamCount; t++) {
                const containerId = `ceTeam_${eventId}_r${roundNum}_t${t}`;
                if (document.getElementById(containerId)) {
                    createCheckboxGroup(containerId, t, `ce_${eventId}_r${roundNum}`, teams[t] || []);
                }
            }
        });
    }
}

// ===== CUSTOM EVENTS PAGE (Player-Facing) =====

function renderEventsPage() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    const events = getCustomEvents();
    const eventList = Object.values(events).sort((a, b) => (a.order || 0) - (b.order || 0));
    const scoringLabels = {
        'individual': 'Individual Scoring',
        'team_shared': 'Team Scoring',
        'individual_to_team': 'Individual-to-Team Scoring'
    };

    if (eventList.length === 0) {
        container.innerHTML = '<div class="section-card"><div class="placeholder-box"><p>No events have been created yet. Check back soon!</p></div></div>';
        return;
    }

    let html = '';

    eventList.forEach(event => {
        const rounds = event.rounds || {};
        const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);

        html += `<div class="section-card">`;
        html += `<h2>${event.name}</h2>`;
        if (event.description) {
            html += `<p style="opacity: 0.85; margin-bottom: 15px;">${event.description}</p>`;
        }
        html += `<p style="font-size: 0.85em; color: var(--gold); margin-bottom: 15px;">${SCORING_LABELS[event.scoringMode] || event.scoringMode} | ${roundKeys.length} round(s)${event.locked ? ' | <span style="color: #e74c3c;">Locked</span>' : ''}</p>`;

        roundKeys.forEach(roundNum => {
            const round = rounds[roundNum];
            const roundName = round.name || `Round ${roundNum}`;
            const teams = round.teams || {};
            const results = round.results || {};
            const pointValues = round.pointValues || {};
            const hasResults = Object.keys(results).length > 0;

            html += `<div class="sub-event">`;
            html += `<h4>${roundName}</h4>`;

            // Show teams if team-based
            if (event.scoringMode !== 'individual' && Object.keys(teams).length > 0) {
                html += '<div style="margin-bottom: 10px;">';
                Object.entries(teams).forEach(([teamNum, teamPlayers]) => {
                    if (teamPlayers && teamPlayers.length > 0) {
                        html += `<p style="font-size: 0.9em;"><strong>Team ${teamNum}:</strong> ${teamPlayers.join(', ')}</p>`;
                    }
                });
                html += '</div>';
            }

            // Show results
            if (hasResults) {
                if (event.scoringMode === 'individual') {
                    const sorted = Object.entries(results).sort((a, b) => a[1] - b[1]);
                    html += '<table class="leaderboard-table" style="margin-top: 10px;"><thead><tr><th>Pos</th><th>Player</th><th>Pts</th></tr></thead><tbody>';
                    sorted.forEach(([player, position]) => {
                        const rankClass = position <= 3 ? `rank-${position}` : '';
                        html += `<tr><td class="${rankClass}">${getOrdinal(position)}</td><td>${player}</td><td>${pointValues[position] || 0}</td></tr>`;
                    });
                    html += '</tbody></table>';
                } else if (event.scoringMode === 'team_shared') {
                    const sorted = Object.entries(results).sort((a, b) => b[1] - a[1]);
                    html += '<table class="leaderboard-table" style="margin-top: 10px;"><thead><tr><th>Team</th><th>Players</th><th>Score</th></tr></thead><tbody>';
                    sorted.forEach(([teamNum, score]) => {
                        const teamPlayers = teams[teamNum] || [];
                        html += `<tr><td>Team ${teamNum}</td><td>${teamPlayers.join(', ')}</td><td>${score}</td></tr>`;
                    });
                    html += '</tbody></table>';
                } else if (event.scoringMode === 'individual_to_team') {
                    // Show team totals and rank
                    const teamTotals = {};
                    Object.entries(teams).forEach(([teamNum, teamPlayers]) => {
                        teamTotals[teamNum] = 0;
                        (teamPlayers || []).forEach(player => {
                            teamTotals[teamNum] += parseInt(results[player]) || 0;
                        });
                    });
                    const sortedTeams = Object.entries(teamTotals).sort((a, b) => b[1] - a[1]);

                    html += '<table class="leaderboard-table" style="margin-top: 10px;"><thead><tr><th>Rank</th><th>Team</th><th>Players</th><th>Total</th><th>Pts</th></tr></thead><tbody>';
                    sortedTeams.forEach(([teamNum, total], idx) => {
                        const rank = idx + 1;
                        const rankClass = rank <= 3 ? `rank-${rank}` : '';
                        const pts = pointValues[rank] || 0;
                        const teamPlayers = teams[teamNum] || [];
                        html += `<tr><td class="${rankClass}">${rank}</td><td>Team ${teamNum}</td><td>${teamPlayers.join(', ')}</td><td>${total}</td><td>${pts}</td></tr>`;
                    });
                    html += '</tbody></table>';
                }
            } else {
                html += '<div class="placeholder-box"><p>Results pending</p></div>';
            }

            html += '</div>';
        });

        html += '</div>';
    });

    container.innerHTML = html;
}
