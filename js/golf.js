// Dird Plesk Memorial - Golf Module
// Golf admin UI, scorecard rendering, scoring controls
// Depends on: utils.js, firebase.js, auth.js

// Golf Admin
function openGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'block';
    updateGolfTeamInputs();
    loadGolfScoringControls();
    loadGolfBonusInputs();
    loadGolfIndividualBonusInputs();
}

function closeGolfAdmin() {
    document.getElementById('golfAdminSection').style.display = 'none';
}

function updateGolfTeamInputs() {
    const count = validateTeamCount(document.getElementById('golfTeamCount').value);
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
    const count = validateTeamCount(document.getElementById('golfTeamCount').value);
    const teams = {};

    for (let i = 1; i <= count; i++) {
        teams[i] = getSelectedFromCheckboxGroup('golf', i);
    }

    writeToFirebase('golfTeams', teams);
    showToast('Golf teams saved!', 'success');
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

    const { teams } = getGolfData();
    const bonusPoints = getBonusPoints();

    if (Object.keys(teams).length === 0) {
        container.innerHTML = '<p class="text-muted">Save teams first</p>';
        return;
    }

    container.innerHTML = `
        <div class="bonus-section">
            <h4>Team Bonus Point Values</h4>
            <p style="font-size: 0.85em; color: var(--silver); margin-bottom: 10px;">
                Bonuses are auto-awarded to the team with the lowest score on each nine and overall.
            </p>
            <div class="bonus-grid">
                <div class="bonus-input">
                    <label>Best Front 9 (pts)</label>
                    <input type="number" id="bonusPtsFront" value="${bonusPoints.bestFront}" min="0" max="50" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Best Back 9 (pts)</label>
                    <input type="number" id="bonusPtsBack" value="${bonusPoints.bestBack}" min="0" max="50" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Overall Winner (pts)</label>
                    <input type="number" id="bonusPtsOverall" value="${bonusPoints.overallWinner}" min="0" max="50" onchange="saveBonusPointValues()">
                </div>
                <div class="bonus-input">
                    <label>Per Shotgun (pts)</label>
                    <input type="number" id="bonusPtsShotgun" value="${bonusPoints.shotgun}" min="0" max="50" onchange="saveBonusPointValues()">
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
        bestFront: validateBonusPoints(frontEl.value),
        bestBack: validateBonusPoints(backEl.value),
        overallWinner: validateBonusPoints(overallEl.value),
        shotgun: validateBonusPoints(shotgunEl.value)
    };
    writeToFirebase('bonusPoints', bonusPoints);
}

// Individual Bonus Admin
function loadGolfIndividualBonusInputs() {
    const container = document.getElementById('golfIndividualBonusInputs');
    if (!container) return;

    const bonuses = getGolfIndividualBonuses();
    const playerList = getPlayerList();

    const playerOptions = playerList.map(name =>
        `<option value="${name}">${name}</option>`
    ).join('');

    function buildPlayerSelect(id, selected) {
        return `<select id="${id}" style="width: 100%; padding: 10px; border: none; border-radius: 5px;" onchange="saveGolfIndividualBonuses()">
            <option value="">-- None --</option>
            ${playerList.map(name =>
                `<option value="${name}" ${selected === name ? 'selected' : ''}>${name}</option>`
            ).join('')}
        </select>`;
    }

    container.innerHTML = `
        <div class="bonus-section">
            <h4>Individual Bonus Awards</h4>
            <p style="font-size: 0.85em; color: var(--silver); margin-bottom: 10px;">
                Assign individual bonus points to specific players.
            </p>
            <div class="bonus-grid">
                <div class="bonus-input">
                    <label>Long Drive Winner</label>
                    ${buildPlayerSelect('indBonusLongDrivePlayer', bonuses.longDrive.player)}
                </div>
                <div class="bonus-input">
                    <label>Long Drive Pts</label>
                    <input type="number" id="indBonusLongDrivePts" value="${bonuses.longDrive.points}" min="0" max="50" onchange="saveGolfIndividualBonuses()">
                </div>
                <div class="bonus-input">
                    <label>Closest to Pin Winner</label>
                    ${buildPlayerSelect('indBonusClosestPinPlayer', bonuses.closestPin.player)}
                </div>
                <div class="bonus-input">
                    <label>Closest to Pin Pts</label>
                    <input type="number" id="indBonusClosestPinPts" value="${bonuses.closestPin.points}" min="0" max="50" onchange="saveGolfIndividualBonuses()">
                </div>
            </div>
        </div>
    `;
}

function saveGolfIndividualBonuses() {
    const bonuses = {
        longDrive: {
            player: document.getElementById('indBonusLongDrivePlayer').value,
            points: validateBonusPoints(document.getElementById('indBonusLongDrivePts').value)
        },
        closestPin: {
            player: document.getElementById('indBonusClosestPinPlayer').value,
            points: validateBonusPoints(document.getElementById('indBonusClosestPinPts').value)
        }
    };
    writeToFirebase('golfIndividualBonuses', bonuses);
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
    const { teams, scores, shotguns, scoringEnabled } = getGolfData();

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

    // Render scoring guide
    renderScoringGuide();

    container.innerHTML = '';

    teamsToShow.forEach(teamNum => {
        if (!teamNum) return;
        const enabled = scoringEnabled[teamNum] !== false;
        const teamScores = scores[teamNum] || {};
        const breakdown = getGolfTeamBreakdown(teamNum);
        const bonusPoints = getBonusPoints();

        const scorecard = document.createElement('div');
        scorecard.className = 'scorecard';

        let html = `<h4>Team ${teamNum}: ${teams[teamNum].join(', ')} <span class="team-grand-total">${breakdown.grandTotal} pts</span></h4>`;

        if (!enabled && !isAdmin()) {
            html += '<div class="scoring-locked"><p>Scoring is currently locked for this team</p></div>';
        } else {
            // Score entry and breakdown table
            html += '<table class="scorecard-table">';
            html += '<thead><tr><th></th><th>Front 9</th><th>Back 9</th><th>Total</th></tr></thead>';
            html += '<tbody>';

            // Row 1: Scores (with inputs)
            const front9Val = teamScores.front9 != null && teamScores.front9 !== '' ? teamScores.front9 : '';
            const back9Val = teamScores.back9 != null && teamScores.back9 !== '' ? teamScores.back9 : '';
            const canEdit = enabled || isAdmin();
            html += `<tr>
                <td class="row-label">Score</td>
                <td><input type="number" id="front9_${teamNum}" value="${front9Val}" min="20" max="99"
                           class="score-input" onchange="saveGolfScore(${teamNum})" ${!canEdit ? 'disabled' : ''}></td>
                <td><input type="number" id="back9_${teamNum}" value="${back9Val}" min="20" max="99"
                           class="score-input" onchange="saveGolfScore(${teamNum})" ${!canEdit ? 'disabled' : ''}></td>
                <td class="computed-value">${breakdown.totalScore || '--'}</td>
            </tr>`;

            // Row 2: Points
            html += `<tr>
                <td class="row-label">Points</td>
                <td class="computed-value">${front9Val !== '' ? breakdown.front9Points : '--'}</td>
                <td class="computed-value">${back9Val !== '' ? breakdown.back9Points : '--'}</td>
                <td class="computed-value total-value">${front9Val !== '' || back9Val !== '' ? breakdown.totalPoints : '--'}</td>
            </tr>`;

            // Row 3: Bonuses (front bonus, back bonus, overall winner bonus — NOT a sum)
            html += `<tr>
                <td class="row-label">Bonus</td>
                <td class="computed-value ${breakdown.frontBonus > 0 ? 'bonus-highlight' : ''}">${breakdown.frontBonus}</td>
                <td class="computed-value ${breakdown.backBonus > 0 ? 'bonus-highlight' : ''}">${breakdown.backBonus}</td>
                <td class="computed-value ${breakdown.overallBonus > 0 ? 'bonus-highlight' : ''}">${breakdown.overallBonus}</td>
            </tr>`;

            // Row 4: Shotguns
            html += `<tr>
                <td class="row-label">Shotguns</td>
                <td colspan="2">
                    <input type="number" id="shotguns${teamNum}" value="${breakdown.shotgunCount}"
                           min="0" max="18" class="score-input" style="width: 70px;"
                           onchange="saveGolfShotguns(${teamNum})" ${!canEdit ? 'disabled' : ''}>
                    <span class="text-silver" style="font-size: 0.85em; margin-left: 5px;">&times; ${bonusPoints.shotgun} = ${breakdown.shotgunPoints} pts</span>
                </td>
                <td class="computed-value">${breakdown.shotgunPoints}</td>
            </tr>`;

            html += '</tbody></table>';
        }

        scorecard.innerHTML = html;
        container.appendChild(scorecard);
    });

    // Render individual bonuses section
    renderGolfIndividualBonuses();
}

function saveGolfScore(teamNum) {
    const front9El = document.getElementById(`front9_${teamNum}`);
    const back9El = document.getElementById(`back9_${teamNum}`);
    const scores = getGolfScores();

    if (!scores[teamNum]) {
        scores[teamNum] = {};
    }

    const front9Val = front9El.value.trim();
    const back9Val = back9El.value.trim();

    scores[teamNum].front9 = front9Val !== '' ? parseInt(front9Val) : '';
    scores[teamNum].back9 = back9Val !== '' ? parseInt(back9Val) : '';

    writeToFirebase('golfScores', scores);
}

function saveGolfShotguns(teamNum) {
    const input = document.getElementById(`shotguns${teamNum}`);
    const shotguns = getGolfShotguns();
    shotguns[teamNum] = validateShotgunCount(input.value);
    writeToFirebase('golfShotguns', shotguns);
}

// Generate scoring guide from admin settings
function renderScoringGuide() {
    const container = document.getElementById('scoringGuide');
    if (!container) return;

    const settings = getSiteSettings();
    const golf = settings.golfSettings || {};
    const par = getGolfParSettings();
    const bonusPoints = getBonusPoints();
    const indBonuses = getGolfIndividualBonuses();

    container.innerHTML = `
        <p style="margin-bottom: 12px;">
            <strong>Format:</strong> ${golf.format || 'Scramble'} &nbsp;|&nbsp;
            <strong>Scoring:</strong> ${golf.scoringType || 'Stableford'}
        </p>
        <table class="leaderboard-table" style="margin-bottom: 15px;">
            <thead>
                <tr><th></th><th>Front 9</th><th>Back 9</th></tr>
            </thead>
            <tbody>
                <tr><td><strong>Par</strong></td><td>${par.front9Par}</td><td>${par.back9Par}</td></tr>
                <tr><td><strong>Base Points</strong></td><td>${par.basePointsPer9}</td><td>${par.basePointsPer9}</td></tr>
            </tbody>
        </table>
        <p style="margin-bottom: 8px;">
            Each nine starts at <strong>${par.basePointsPer9} base points</strong> (score = par).
            Every stroke <strong>under par</strong> adds 1 point. Every stroke <strong>over par</strong> subtracts 1 point.
        </p>
        <p class="text-muted" style="font-size: 0.9em;">
            <strong>Team Bonuses:</strong> Best Front 9 (+${bonusPoints.bestFront}), Best Back 9 (+${bonusPoints.bestBack}),
            Overall Winner (+${bonusPoints.overallWinner}) &mdash; awarded to lowest score.<br>
            <strong>Shotguns:</strong> Each full team shotgun = +${bonusPoints.shotgun} pt${bonusPoints.shotgun !== 1 ? 's' : ''}.<br>
            <strong>Individual:</strong> Long Drive (+${indBonuses.longDrive.points}), Closest to Pin (+${indBonuses.closestPin.points}).
        </p>
    `;
}

// Render individual bonus awards on golf page
function renderGolfIndividualBonuses() {
    const container = document.getElementById('golfIndividualBonuses');
    if (!container) return;

    const bonuses = getGolfIndividualBonuses();
    const hasLongDrive = bonuses.longDrive.player && bonuses.longDrive.player !== '';
    const hasClosestPin = bonuses.closestPin.player && bonuses.closestPin.player !== '';

    if (!hasLongDrive && !hasClosestPin) {
        container.innerHTML = '<p class="text-muted">No individual awards assigned yet.</p>';
        return;
    }

    let html = '<div class="individual-bonus-list">';

    if (hasLongDrive) {
        html += `<div class="individual-bonus-item">
            <span class="individual-bonus-label">Long Drive</span>
            <span class="individual-bonus-winner">${bonuses.longDrive.player}</span>
            <span class="individual-bonus-pts">+${bonuses.longDrive.points} pts</span>
        </div>`;
    }

    if (hasClosestPin) {
        html += `<div class="individual-bonus-item">
            <span class="individual-bonus-label">Closest to Pin</span>
            <span class="individual-bonus-winner">${bonuses.closestPin.player}</span>
            <span class="individual-bonus-pts">+${bonuses.closestPin.points} pts</span>
        </div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}
