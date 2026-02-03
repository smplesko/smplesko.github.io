// Dird Plesk Memorial - Golf Module
// Golf admin UI, scorecard rendering, scoring controls
// Depends on: utils.js, firebase.js, auth.js

// Build team dropdown options with selected value
function buildTeamOptions(teams, selectedValue) {
    return Object.keys(teams).map(t =>
        `<option value="${t}" ${String(selectedValue) === String(t) ? 'selected' : ''}>Team ${t}</option>`
    ).join('');
}

// Golf Admin
function openGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'block';
    updateGolfTeamInputs();
    loadGolfScoringControls();
    loadGolfBonusInputs();
    loadGolfFormatSettings();
}

function loadGolfFormatSettings() {
    const container = document.getElementById('golfFormatSettings');
    if (!container) return;

    const settings = getSiteSettings();
    const golf = settings.golfSettings || { format: 'Scramble', scoringType: 'Stableford', description: '' };

    container.innerHTML = `
        <h4 class="text-gold mb-15">Golf Format & Scoring</h4>
        <div style="display: grid; gap: 12px;">
            <div>
                <label class="label-block text-silver">Format</label>
                <select id="golfFormatInput" style="width: 100%; padding: 10px; border: none; border-radius: 5px;">
                    <option value="Scramble" ${golf.format === 'Scramble' ? 'selected' : ''}>Scramble</option>
                    <option value="Best Ball" ${golf.format === 'Best Ball' ? 'selected' : ''}>Best Ball</option>
                    <option value="Alternate Shot" ${golf.format === 'Alternate Shot' ? 'selected' : ''}>Alternate Shot</option>
                    <option value="Stroke Play" ${golf.format === 'Stroke Play' ? 'selected' : ''}>Stroke Play</option>
                </select>
            </div>
            <div>
                <label class="label-block text-silver">Scoring Type</label>
                <select id="golfScoringTypeInput" style="width: 100%; padding: 10px; border: none; border-radius: 5px;">
                    <option value="Stableford" ${golf.scoringType === 'Stableford' ? 'selected' : ''}>Stableford</option>
                    <option value="Stroke" ${golf.scoringType === 'Stroke' ? 'selected' : ''}>Stroke (Low Score Wins)</option>
                </select>
            </div>
            <div>
                <label class="label-block text-silver">Description / Rules</label>
                <textarea id="golfDescriptionInput" placeholder="e.g., 18-hole scramble at XYZ Course"
                          style="width: 100%; padding: 10px; border: none; border-radius: 5px; min-height: 60px; resize: vertical;">${golf.description || ''}</textarea>
            </div>
            <button class="btn btn-small btn-gold" onclick="saveGolfFormatSettings()">Save Golf Settings</button>
        </div>
    `;
}

function saveGolfFormatSettings() {
    const settings = getSiteSettings();
    settings.golfSettings = {
        format: document.getElementById('golfFormatInput').value,
        scoringType: document.getElementById('golfScoringTypeInput').value,
        description: document.getElementById('golfDescriptionInput').value.trim()
    };
    saveSiteSettings(settings);
    alert('Golf settings saved!');
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

    writeToFirebase('golfTeams', teams);
    alert('Golf teams saved!');
    loadGolfScoringControls();
}

function loadGolfScoringControls() {
    const container = document.getElementById('golfScoringControls');
    if (!container) return;

    const { teams, scoringEnabled } = getGolfData();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p class="text-muted">Save teams first to manage scoring</p>';
        return;
    }

    container.innerHTML = '<h4 class="text-gold mb-15">Team Scoring Controls</h4>';

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
    writeToFirebase('golfScoringEnabled', scoringEnabled);
    loadGolfScoringControls();
}

function loadGolfBonusInputs() {
    const container = document.getElementById('golfBonusInputs');
    if (!container) return;

    const { teams, bonuses } = getGolfData();
    const bonusPoints = getBonusPoints();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p class="text-muted">Save teams first</p>';
        return;
    }

    const teamOptionsFront = buildTeamOptions(teams, bonuses.bestFront);
    const teamOptionsBack = buildTeamOptions(teams, bonuses.bestBack);
    const teamOptionsOverall = buildTeamOptions(teams, bonuses.overallWinner);

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
                        ${teamOptionsFront}
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
    const frontEl = document.getElementById('bonusPtsFront');
    const backEl = document.getElementById('bonusPtsBack');
    const overallEl = document.getElementById('bonusPtsOverall');
    const shotgunEl = document.getElementById('bonusPtsShotgun');
    if (!frontEl || !backEl || !overallEl || !shotgunEl) return;

    const bonusPoints = {
        bestFront: parseInt(frontEl.value) || 0,
        bestBack: parseInt(backEl.value) || 0,
        overallWinner: parseInt(overallEl.value) || 0,
        shotgun: parseInt(shotgunEl.value) || 0
    };
    writeToFirebase('bonusPoints', bonusPoints);
}

function saveGolfBonuses() {
    const frontEl = document.getElementById('bonusBestFront');
    const backEl = document.getElementById('bonusBestBack');
    const overallEl = document.getElementById('bonusOverallWinner');
    if (!frontEl || !backEl || !overallEl) return;

    const bonuses = {
        bestFront: frontEl.value,
        bestBack: backEl.value,
        overallWinner: overallEl.value
    };
    writeToFirebase('golfBonuses', bonuses);
}

// Golf Scorecard (for players)
function renderGolfScorecard() {
    const container = document.getElementById('golfScorecard');
    if (!container) return;

    // Apply golf settings to page
    const settings = getSiteSettings();
    const golf = settings.golfSettings || {};
    const subtitle = document.getElementById('golfSubtitle');
    if (subtitle && golf.format) {
        subtitle.textContent = `${golf.format} - ${golf.scoringType || 'Stableford'} Scoring`;
    }
    const descEl = document.getElementById('golfDescription');
    if (descEl) {
        if (golf.description) {
            descEl.style.display = 'block';
            descEl.innerHTML = `<p style="opacity: 0.85;">${golf.description}</p>`;
        } else {
            descEl.style.display = 'none';
        }
    }

    const user = getCurrentUser();
    const { teams, holeScores, shotguns, scoringEnabled } = getGolfData();

    // Find user's team
    let userTeam = null;
    Object.keys(teams).forEach(teamNum => {
        if (teams[teamNum].includes(user)) {
            userTeam = teamNum;
        }
    });

    if (!userTeam && !isAdmin()) {
        container.innerHTML = '<div class="placeholder-box"><p>You are not assigned to a team yet.</p></div>';
        return;
    }

    // If admin, show all teams
    const teamsToShow = isAdmin() ? Object.keys(teams) : [userTeam];

    if (teamsToShow.length === 0 || (teamsToShow.length === 1 && !teamsToShow[0])) {
        container.innerHTML = '<div class="placeholder-box"><p>No teams have been assigned yet.</p></div>';
        return;
    }

    container.innerHTML = '';

    teamsToShow.forEach(teamNum => {
        if (!teamNum) return;
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
            html += '<p class="text-gold mt-10 mb-5">Front 9</p>';
            html += '<div class="hole-grid">';
            for (let hole = 1; hole <= 9; hole++) {
                html += createHoleInput(teamNum, hole, teamScores[hole], enabled || isAdmin());
            }
            html += '</div>';

            // Back 9
            html += '<p class="text-gold mt-15 mb-5">Back 9</p>';
            html += '<div class="hole-grid">';
            for (let hole = 10; hole <= HOLE_COUNT; hole++) {
                html += createHoleInput(teamNum, hole, teamScores[hole], enabled || isAdmin());
            }
            html += '</div>';

            // Shotguns
            html += `
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <label class="text-silver">Team Shotguns:</label>
                    <input type="number" id="shotguns${teamNum}" value="${teamShotgunCount}"
                           min="0" style="width: 70px; padding: 10px; border-radius: 5px; border: none;"
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
    writeToFirebase('golfHoleScores', holeScores);
}

function saveGolfShotguns(teamNum) {
    const input = document.getElementById(`shotguns${teamNum}`);
    const shotguns = getGolfShotguns();
    shotguns[teamNum] = parseInt(input.value) || 0;
    writeToFirebase('golfShotguns', shotguns);
}
