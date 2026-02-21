// Dird Plesk Memorial - Admin Module
// Player management, site settings, event locks, data export/reset
// Depends on: firebase.js, auth.js

// Player management (Admin) - with editable names
function renderPlayerList() {
    const container = document.getElementById('playerList');
    if (!container) return;

    const players = getPlayers();
    container.innerHTML = '<h4 class="mb-15">Player Names:</h4>';

    const list = document.createElement('div');
    list.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;';

    for (let slot = 1; slot <= MAX_PLAYERS; slot++) {
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
                <label class="label-block text-silver">Homepage Title (H1)</label>
                <input type="text" id="heroTitleInput" value="${settings.heroTitle || ''}"
                       class="form-input">
            </div>
            <div>
                <label class="label-block text-silver">Homepage Subtitle</label>
                <input type="text" id="heroSubtitleInput" value="${settings.heroSubtitle || ''}"
                       class="form-input">
            </div>
            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 5px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <label class="toggle-switch">
                        <input type="checkbox" id="notesVisibleToggle" ${notesVisible ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span style="color: var(--silver);">Show Notes Section on Homepage</span>
                </div>
                <label class="label-block text-silver">Notes Content (HTML supported for links)</label>
                <textarea id="notesContentInput" placeholder="Enter notes here... Use &lt;a href='url'&gt;link text&lt;/a&gt; for hyperlinks"
                          style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em; min-height: 120px; resize: vertical; font-family: inherit;">${notesContent}</textarea>
                <p style="font-size: 0.8em; color: var(--silver); margin-top: 5px; opacity: 0.7;">
                    Tip: Use &lt;br&gt; for line breaks, &lt;a href="url"&gt;text&lt;/a&gt; for links
                </p>
            </div>
            <button class="btn btn-gold" onclick="saveSiteSettingsForm()">Save Site Settings</button>

            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 10px;">
                <h4 class="text-gold mb-15">Golf Settings</h4>
                <div style="display: grid; gap: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label class="label-block text-silver">Format</label>
                            <select id="golfFormatInput" class="form-input">
                                ${['Scramble', 'Best Ball', 'Alternate Shot', 'Stroke Play', 'Match Play'].map(f =>
                                    `<option value="${f}" ${(settings.golfSettings?.format || 'Scramble') === f ? 'selected' : ''}>${f}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="label-block text-silver">Scoring Type</label>
                            <select id="golfScoringTypeInput" class="form-input">
                                ${['Stableford', 'Stroke', 'Points', 'Match'].map(s =>
                                    `<option value="${s}" ${(settings.golfSettings?.scoringType || 'Stableford') === s ? 'selected' : ''}>${s}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <label class="label-block text-silver">Front 9 Par</label>
                            <input type="number" id="golfFront9ParInput" value="${settings.golfSettings?.front9Par || 36}"
                                   min="27" max="45" class="form-input">
                        </div>
                        <div>
                            <label class="label-block text-silver">Back 9 Par</label>
                            <input type="number" id="golfBack9ParInput" value="${settings.golfSettings?.back9Par || 36}"
                                   min="27" max="45" class="form-input">
                        </div>
                        <div>
                            <label class="label-block text-silver">Even Par Pts/9</label>
                            <input type="number" id="golfBasePointsInput" value="${settings.golfSettings?.basePointsPer9 || 10}"
                                   min="1" max="50" class="form-input">
                        </div>
                    </div>
                    <div>
                        <label class="label-block text-silver">Description (shown on golf page)</label>
                        <input type="text" id="golfDescriptionInput" value="${settings.golfSettings?.description || ''}"
                               placeholder="e.g., 18 holes at Lions Golf Course"
                               class="form-input">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label class="label-block text-silver">Scheduled Date</label>
                            <input type="date" id="golfScheduledDateInput" value="${settings.golfSettings?.scheduledDate || ''}"
                                   class="form-input">
                        </div>
                        <div>
                            <label class="label-block text-silver">Start Time</label>
                            <input type="time" id="golfScheduledTimeInput" value="${settings.golfSettings?.scheduledTime || ''}"
                                   class="form-input">
                        </div>
                    </div>
                    <button class="btn btn-gold" onclick="saveGolfSettings()">Save Golf Settings</button>
                </div>
            </div>

            <div style="border-top: 1px solid var(--card-border); padding-top: 15px; margin-top: 10px;">
                <h4 class="text-gold mb-15">Event Locks</h4>
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
                <h4 class="text-gold mb-15">Competition Status</h4>
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
    showToast(`${lockNames[eventName]} is now ${action}.`, 'success');
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
    showToast('Competition closed! Final standings are now visible.', 'success');
    renderSiteSettings();
}

function reopenCompetition() {
    if (!confirm('Are you sure you want to reopen the competition? This will hide the final standings.')) {
        return;
    }

    const settings = getSiteSettings();
    settings.competitionClosed = false;
    saveSiteSettings(settings);
    showToast('Competition reopened.', 'success');
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
    showToast('Site settings saved!', 'success');

    // Update homepage if we're on it
    applyHeroSettings();
}

function saveGolfSettings() {
    const format = document.getElementById('golfFormatInput').value.trim();
    const scoringType = document.getElementById('golfScoringTypeInput').value.trim();
    const front9Par = document.getElementById('golfFront9ParInput');
    const back9Par = document.getElementById('golfBack9ParInput');
    const basePointsEl = document.getElementById('golfBasePointsInput');
    const description = document.getElementById('golfDescriptionInput').value.trim();
    const scheduledDate = document.getElementById('golfScheduledDateInput').value;
    const scheduledTime = document.getElementById('golfScheduledTimeInput').value;

    const settings = getSiteSettings();
    if (!settings.golfSettings) {
        settings.golfSettings = {};
    }
    settings.golfSettings.format = format || 'Scramble';
    settings.golfSettings.scoringType = scoringType || 'Stableford';
    settings.golfSettings.front9Par = front9Par ? validateNumber(front9Par.value, 27, 45, 36) : 36;
    settings.golfSettings.back9Par = back9Par ? validateNumber(back9Par.value, 27, 45, 36) : 36;
    settings.golfSettings.basePointsPer9 = basePointsEl ? validateNumber(basePointsEl.value, 1, 50, 10) : 10;
    settings.golfSettings.description = description;
    settings.golfSettings.scheduledDate = scheduledDate;
    settings.golfSettings.scheduledTime = scheduledTime;

    saveSiteSettings(settings);
    showToast('Golf settings saved!', 'success');
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

// Data management
function exportData() {
    const data = {
        players: getPlayers(),
        golfTeams: getGolfTeams(),
        golfScores: getGolfScores(),
        golfShotguns: getGolfShotguns(),
        golfScoringEnabled: getGolfScoringEnabled(),
        golfIndividualBonuses: getGolfIndividualBonuses(),
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
            writeToFirebase('golfScores', {});
            writeToFirebase('golfShotguns', {});
            writeToFirebase('golfScoringEnabled', {});
            writeToFirebase('golfIndividualBonuses', { longDrive: { player: '', points: 5 }, closestPin: { player: '', points: 5 } });
            writeToFirebase('customEvents', {});
            writeToFirebase('triviaGame', DEFAULT_TRIVIA_GAME);
            writeToFirebase('siteSettings', DEFAULT_SITE_SETTINGS);
            writeToFirebase('predictions', DEFAULT_PREDICTIONS);

            showToast('All data has been reset', 'success');
            window.location.reload();
        }
    }
}

// Fresh Start - clears titles and player names, resets onboarding
function freshStart() {
    if (!confirm('This will clear the homepage title, subtitle, and all player names. The onboarding wizard will restart. Continue?')) {
        return;
    }

    // Clear site settings (title, subtitle) and reset onboarding flag
    const settings = getSiteSettings();
    settings.heroTitle = '';
    settings.heroSubtitle = '';
    settings.onboardingComplete = false;
    saveSiteSettings(settings);

    // Clear all player names (keep admin flag on slot 1)
    const emptyPlayers = {};
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        emptyPlayers[i] = { name: '', isAdmin: i === 1 };
    }
    writeToFirebase('players', emptyPlayers);

    showToast('Fresh start! Reloading...', 'success');
    setTimeout(() => window.location.reload(), 1000);
}

// ===== ONBOARDING WIZARD =====

let onboardingStep = 1;
let onboardingData = {};
const ONBOARDING_TOTAL_STEPS = 7;

// Check if onboarding should be shown
function shouldShowOnboarding() {
    const settings = getSiteSettings();
    return !settings.onboardingComplete && isAdmin();
}

// Start the onboarding wizard
function startOnboarding() {
    onboardingStep = 1;
    onboardingData = {
        // Step 1: Tournament basics
        heroTitle: '',
        heroSubtitle: '',
        // Step 2: Players
        playerCount: 12,
        players: {},
        adminSlot: 1,
        // Step 3: Golf
        includeGolf: true,
        golfDate: '',
        golfTime: '',
        golfFormat: 'Scramble',
        golfScoringType: 'Stableford',
        golfFront9Par: 36,
        golfBack9Par: 36,
        // Step 4: Custom Events
        includeEvents: false,
        quickEvents: [],
        // Step 5: Trivia
        includeTrivia: false,
        triviaDate: '',
        triviaTime: '',
        // Step 6: Predictions
        includePredictions: false
    };

    // Pre-fill with current data
    const settings = getSiteSettings();
    const players = getPlayers();
    const triviaGame = getTriviaGame();

    onboardingData.heroTitle = settings.heroTitle || '';
    onboardingData.heroSubtitle = settings.heroSubtitle || '';
    onboardingData.golfDate = settings.golfSettings?.scheduledDate || '';
    onboardingData.golfTime = settings.golfSettings?.scheduledTime || '';
    onboardingData.golfFormat = settings.golfSettings?.format || 'Scramble';
    onboardingData.golfScoringType = settings.golfSettings?.scoringType || 'Stableford';
    onboardingData.golfFront9Par = settings.golfSettings?.front9Par || 36;
    onboardingData.golfBack9Par = settings.golfSettings?.back9Par || 36;
    onboardingData.triviaDate = triviaGame.scheduledDate || '';
    onboardingData.triviaTime = triviaGame.scheduledTime || '';

    // Count existing players and find admin
    let filledCount = 0;
    for (let i = 1; i <= 20; i++) {
        if (players[i]?.name) {
            onboardingData.players[i] = players[i].name;
            filledCount++;
            if (players[i].isAdmin) {
                onboardingData.adminSlot = i;
            }
        }
    }
    onboardingData.playerCount = Math.max(filledCount, 2);

    renderOnboardingWizard();
}

// Render the current onboarding step
function renderOnboardingWizard() {
    let existingModal = document.getElementById('onboardingModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'onboardingModal';
    modal.className = 'onboarding-modal';

    const progressPercent = (onboardingStep / ONBOARDING_TOTAL_STEPS) * 100;

    let stepContent = '';
    let stepTitle = '';

    switch (onboardingStep) {
        case 1:
            stepTitle = 'Welcome! Let\'s Set Up Your Tournament';
            stepContent = renderOnboardingStep1();
            break;
        case 2:
            stepTitle = 'Who\'s Playing?';
            stepContent = renderOnboardingStep2();
            break;
        case 3:
            stepTitle = 'Golf Event';
            stepContent = renderOnboardingStep3();
            break;
        case 4:
            stepTitle = 'Custom Events';
            stepContent = renderOnboardingStep4();
            break;
        case 5:
            stepTitle = 'Trivia';
            stepContent = renderOnboardingStep5();
            break;
        case 6:
            stepTitle = 'Predictions';
            stepContent = renderOnboardingStep6();
            break;
        case 7:
            stepTitle = 'Review Your Setup';
            stepContent = renderOnboardingStep7();
            break;
    }

    modal.innerHTML = `
        <div class="onboarding-content">
            <div class="onboarding-progress">
                <div class="onboarding-progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="onboarding-step-indicator">Step ${onboardingStep} of ${ONBOARDING_TOTAL_STEPS}</div>
            <h2 class="onboarding-title">${stepTitle}</h2>
            <div class="onboarding-body">
                ${stepContent}
            </div>
            <div class="onboarding-actions">
                ${onboardingStep > 1 ? '<button class="btn" onclick="onboardingPrev()">Back</button>' : '<button class="btn" style="background: var(--silver);" onclick="skipOnboarding()">Skip Setup</button>'}
                ${onboardingStep < ONBOARDING_TOTAL_STEPS
                    ? '<button class="btn btn-gold" onclick="onboardingNext()">Next</button>'
                    : '<button class="btn btn-gold" onclick="completeOnboarding()">Finish Setup</button>'
                }
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Step 1: Tournament basics
function renderOnboardingStep1() {
    return `
        <p class="onboarding-desc">Give your tournament a name and tagline that will appear on the homepage.</p>
        <div class="onboarding-form">
            <div class="onboarding-field">
                <label>Tournament Name</label>
                <input type="text" id="ob_heroTitle" value="${onboardingData.heroTitle}"
                       placeholder="e.g., Annual Golf Championship 2026">
            </div>
            <div class="onboarding-field">
                <label>Tagline / Subtitle</label>
                <input type="text" id="ob_heroSubtitle" value="${onboardingData.heroSubtitle}"
                       placeholder="e.g., May the best golfer win!">
            </div>
        </div>
    `;
}

// Step 2: Players - count, names, admin selection
function renderOnboardingStep2() {
    return `
        <p class="onboarding-desc">Set up your players. You can always add or edit names later.</p>
        <div class="onboarding-form">
            <div class="onboarding-field">
                <label>How many players?</label>
                <select id="ob_playerCount" onchange="updateOnboardingPlayerCount()">
                    ${[2,3,4,5,6,7,8,9,10,11,12,14,16,18,20].map(n =>
                        `<option value="${n}" ${onboardingData.playerCount === n ? 'selected' : ''}>${n} players</option>`
                    ).join('')}
                </select>
            </div>
            <div class="onboarding-field">
                <label>Who is the admin?</label>
                <select id="ob_adminSlot">
                    ${Array.from({length: onboardingData.playerCount}, (_, i) => i + 1).map(n =>
                        `<option value="${n}" ${onboardingData.adminSlot === n ? 'selected' : ''}>Player ${n}${onboardingData.players[n] ? ` (${onboardingData.players[n]})` : ''}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div class="onboarding-players-grid" id="ob_playersGrid">
            ${renderOnboardingPlayerInputs()}
        </div>
    `;
}

function renderOnboardingPlayerInputs() {
    let html = '';
    for (let i = 1; i <= onboardingData.playerCount; i++) {
        html += `
            <div class="onboarding-player-item">
                <label>Player ${i}</label>
                <input type="text" id="ob_player${i}" value="${onboardingData.players[i] || ''}"
                       placeholder="Enter name">
            </div>
        `;
    }
    return html;
}

function updateOnboardingPlayerCount() {
    const select = document.getElementById('ob_playerCount');
    if (select) {
        // Save current player names first
        for (let i = 1; i <= 20; i++) {
            const input = document.getElementById(`ob_player${i}`);
            if (input) onboardingData.players[i] = input.value;
        }
        onboardingData.playerCount = validatePlayerCount(select.value);
        // Adjust admin slot if needed
        onboardingData.adminSlot = validateAdminSlot(onboardingData.adminSlot, onboardingData.playerCount);
        renderOnboardingWizard();
    }
}

// Step 3: Golf setup
function renderOnboardingStep3() {
    return `
        <p class="onboarding-desc">Will your tournament include a golf event?</p>
        <div class="onboarding-form">
            <div class="onboarding-toggle-row">
                <label class="toggle-switch">
                    <input type="checkbox" id="ob_includeGolf" ${onboardingData.includeGolf ? 'checked' : ''}
                           onchange="toggleOnboardingGolf()">
                    <span class="toggle-slider"></span>
                </label>
                <span>Include Golf Event</span>
            </div>
            <div id="ob_golfDetails" style="display: ${onboardingData.includeGolf ? 'block' : 'none'}; margin-top: 20px;">
                <div class="onboarding-field-row">
                    <div class="onboarding-field">
                        <label>Golf Date</label>
                        <input type="date" id="ob_golfDate" value="${onboardingData.golfDate}">
                    </div>
                    <div class="onboarding-field">
                        <label>Tee Time</label>
                        <input type="time" id="ob_golfTime" value="${onboardingData.golfTime}">
                    </div>
                </div>
                <div class="onboarding-field-row">
                    <div class="onboarding-field">
                        <label>Format</label>
                        <select id="ob_golfFormat">
                            <option value="Scramble" ${onboardingData.golfFormat === 'Scramble' ? 'selected' : ''}>Scramble</option>
                            <option value="Best Ball" ${onboardingData.golfFormat === 'Best Ball' ? 'selected' : ''}>Best Ball</option>
                            <option value="Alternate Shot" ${onboardingData.golfFormat === 'Alternate Shot' ? 'selected' : ''}>Alternate Shot</option>
                            <option value="Stroke Play" ${onboardingData.golfFormat === 'Stroke Play' ? 'selected' : ''}>Stroke Play</option>
                            <option value="Match Play" ${onboardingData.golfFormat === 'Match Play' ? 'selected' : ''}>Match Play</option>
                        </select>
                    </div>
                    <div class="onboarding-field">
                        <label>Scoring</label>
                        <select id="ob_golfScoringType">
                            <option value="Stableford" ${onboardingData.golfScoringType === 'Stableford' ? 'selected' : ''}>Stableford</option>
                            <option value="Stroke" ${onboardingData.golfScoringType === 'Stroke' ? 'selected' : ''}>Stroke</option>
                            <option value="Points" ${onboardingData.golfScoringType === 'Points' ? 'selected' : ''}>Points</option>
                            <option value="Match" ${onboardingData.golfScoringType === 'Match' ? 'selected' : ''}>Match</option>
                        </select>
                    </div>
                </div>
                <div class="onboarding-field-row">
                    <div class="onboarding-field">
                        <label>Front 9 Par</label>
                        <input type="number" id="ob_golfFront9Par" value="${onboardingData.golfFront9Par}" min="27" max="45">
                    </div>
                    <div class="onboarding-field">
                        <label>Back 9 Par</label>
                        <input type="number" id="ob_golfBack9Par" value="${onboardingData.golfBack9Par}" min="27" max="45">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleOnboardingGolf() {
    const checkbox = document.getElementById('ob_includeGolf');
    const details = document.getElementById('ob_golfDetails');
    if (checkbox && details) {
        onboardingData.includeGolf = checkbox.checked;
        details.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// Step 4: Custom Events
function renderOnboardingStep4() {
    let eventsHtml = '';
    onboardingData.quickEvents.forEach((evt, idx) => {
        eventsHtml += `
            <div class="onboarding-quick-event">
                <input type="text" id="ob_eventName${idx}" value="${evt.name}" placeholder="Event name">
                <input type="date" id="ob_eventDate${idx}" value="${evt.date || ''}">
                <select id="ob_eventScoring${idx}" style="padding: 8px; border-radius: 5px; border: none;">
                    <option value="individual" ${evt.scoringMode === 'individual' || !evt.scoringMode ? 'selected' : ''}>Individual</option>
                    <option value="team_shared" ${evt.scoringMode === 'team_shared' ? 'selected' : ''}>Team Shared</option>
                    <option value="individual_to_team" ${evt.scoringMode === 'individual_to_team' ? 'selected' : ''}>Individual→Team</option>
                </select>
                <button class="btn btn-small" onclick="removeOnboardingEvent(${idx})" style="background: var(--accent-red);">×</button>
            </div>
        `;
    });

    return `
        <p class="onboarding-desc">Will you have other competitions besides golf? (e.g., Beer Olympics, Go-Karts, Poker)</p>
        <div class="onboarding-form">
            <div class="onboarding-toggle-row">
                <label class="toggle-switch">
                    <input type="checkbox" id="ob_includeEvents" ${onboardingData.includeEvents ? 'checked' : ''}
                           onchange="toggleOnboardingEvents()">
                    <span class="toggle-slider"></span>
                </label>
                <span>Include Custom Events</span>
            </div>
            <div id="ob_eventsDetails" style="display: ${onboardingData.includeEvents ? 'block' : 'none'}; margin-top: 20px;">
                <p style="font-size: 0.9em; color: var(--silver); margin-bottom: 15px;">Quick-add events (you can configure details later in Admin):</p>
                <div id="ob_eventsList">
                    ${eventsHtml}
                </div>
                <button class="btn btn-small" onclick="addOnboardingEvent()" style="margin-top: 10px;">+ Add Event</button>
            </div>
        </div>
    `;
}

function toggleOnboardingEvents() {
    const checkbox = document.getElementById('ob_includeEvents');
    const details = document.getElementById('ob_eventsDetails');
    if (checkbox && details) {
        onboardingData.includeEvents = checkbox.checked;
        details.style.display = checkbox.checked ? 'block' : 'none';
    }
}

function addOnboardingEvent() {
    saveOnboardingEventData();
    onboardingData.quickEvents.push({ name: '', date: '', scoringMode: 'individual' });
    renderOnboardingWizard();
}

function removeOnboardingEvent(idx) {
    saveOnboardingEventData();
    onboardingData.quickEvents.splice(idx, 1);
    renderOnboardingWizard();
}

function saveOnboardingEventData() {
    onboardingData.quickEvents.forEach((evt, idx) => {
        const nameInput = document.getElementById(`ob_eventName${idx}`);
        const dateInput = document.getElementById(`ob_eventDate${idx}`);
        const scoringInput = document.getElementById(`ob_eventScoring${idx}`);
        if (nameInput) evt.name = nameInput.value;
        if (dateInput) evt.date = dateInput.value;
        if (scoringInput) evt.scoringMode = scoringInput.value;
    });
}

// Step 5: Trivia
function renderOnboardingStep5() {
    return `
        <p class="onboarding-desc">Will your tournament include a trivia competition?</p>
        <div class="onboarding-form">
            <div class="onboarding-toggle-row">
                <label class="toggle-switch">
                    <input type="checkbox" id="ob_includeTrivia" ${onboardingData.includeTrivia ? 'checked' : ''}
                           onchange="toggleOnboardingTrivia()">
                    <span class="toggle-slider"></span>
                </label>
                <span>Include Trivia</span>
            </div>
            <div id="ob_triviaDetails" style="display: ${onboardingData.includeTrivia ? 'block' : 'none'}; margin-top: 20px;">
                <div class="onboarding-field-row">
                    <div class="onboarding-field">
                        <label>Trivia Date</label>
                        <input type="date" id="ob_triviaDate" value="${onboardingData.triviaDate}">
                    </div>
                    <div class="onboarding-field">
                        <label>Start Time</label>
                        <input type="time" id="ob_triviaTime" value="${onboardingData.triviaTime}">
                    </div>
                </div>
                <p class="onboarding-hint">You can add trivia questions from the Admin page after setup.</p>
            </div>
        </div>
    `;
}

function toggleOnboardingTrivia() {
    const checkbox = document.getElementById('ob_includeTrivia');
    const details = document.getElementById('ob_triviaDetails');
    if (checkbox && details) {
        onboardingData.includeTrivia = checkbox.checked;
        details.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// Step 6: Predictions
function renderOnboardingStep6() {
    return `
        <p class="onboarding-desc">Predictions let players guess outcomes before events happen (e.g., "Who will win golf?") for bonus points.</p>
        <div class="onboarding-form">
            <div class="onboarding-toggle-row">
                <label class="toggle-switch">
                    <input type="checkbox" id="ob_includePredictions" ${onboardingData.includePredictions ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
                <span>Include Predictions</span>
            </div>
            <p class="onboarding-hint" style="margin-top: 15px;">You can create prediction questions from the Admin page after setup.</p>
        </div>
    `;
}

// Step 7: Summary
function renderOnboardingStep7() {
    const playerCount = Object.values(onboardingData.players).filter(n => n && n.trim()).length;
    const adminName = onboardingData.players[onboardingData.adminSlot] || `Player ${onboardingData.adminSlot}`;
    const eventCount = onboardingData.quickEvents.filter(e => e.name && e.name.trim()).length;

    const formatDate = (date) => {
        if (!date) return 'Not scheduled';
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return `
        <div class="onboarding-summary">
            <div class="onboarding-checkmark">&#10003;</div>
            <p class="onboarding-desc">Here's what you've set up:</p>
            <div class="onboarding-summary-items">
                <div class="onboarding-summary-item">
                    <span class="summary-label">Tournament</span>
                    <span class="summary-value">${onboardingData.heroTitle || 'Default Title'}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Players</span>
                    <span class="summary-value">${playerCount} of ${onboardingData.playerCount} named</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Admin</span>
                    <span class="summary-value">${adminName}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Golf</span>
                    <span class="summary-value">${onboardingData.includeGolf ? (onboardingData.golfDate ? formatDate(onboardingData.golfDate) : 'Enabled (no date)') : 'Not included'}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Custom Events</span>
                    <span class="summary-value">${onboardingData.includeEvents ? `${eventCount} event(s)` : 'Not included'}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Trivia</span>
                    <span class="summary-value">${onboardingData.includeTrivia ? (onboardingData.triviaDate ? formatDate(onboardingData.triviaDate) : 'Enabled (no date)') : 'Not included'}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Predictions</span>
                    <span class="summary-value">${onboardingData.includePredictions ? 'Enabled' : 'Not included'}</span>
                </div>
            </div>
            <p class="onboarding-hint">Click "Finish Setup" to save. You can always change settings from the Admin page.</p>
        </div>
    `;
}

function saveOnboardingStepData() {
    switch (onboardingStep) {
        case 1:
            const title = document.getElementById('ob_heroTitle');
            const subtitle = document.getElementById('ob_heroSubtitle');
            if (title) onboardingData.heroTitle = title.value;
            if (subtitle) onboardingData.heroSubtitle = subtitle.value;
            break;
        case 2:
            const playerCount = document.getElementById('ob_playerCount');
            const adminSlot = document.getElementById('ob_adminSlot');
            if (playerCount) onboardingData.playerCount = validatePlayerCount(playerCount.value);
            if (adminSlot) onboardingData.adminSlot = validateAdminSlot(adminSlot.value, onboardingData.playerCount);
            for (let i = 1; i <= 20; i++) {
                const input = document.getElementById(`ob_player${i}`);
                if (input) onboardingData.players[i] = input.value;
            }
            break;
        case 3:
            const includeGolf = document.getElementById('ob_includeGolf');
            const golfDate = document.getElementById('ob_golfDate');
            const golfTime = document.getElementById('ob_golfTime');
            const golfFormat = document.getElementById('ob_golfFormat');
            const golfScoringType = document.getElementById('ob_golfScoringType');
            const golfFront9Par = document.getElementById('ob_golfFront9Par');
            const golfBack9Par = document.getElementById('ob_golfBack9Par');
            if (includeGolf) onboardingData.includeGolf = includeGolf.checked;
            if (golfDate) onboardingData.golfDate = golfDate.value;
            if (golfTime) onboardingData.golfTime = golfTime.value;
            if (golfFormat) onboardingData.golfFormat = golfFormat.value;
            if (golfScoringType) onboardingData.golfScoringType = golfScoringType.value;
            if (golfFront9Par) onboardingData.golfFront9Par = validateNumber(golfFront9Par.value, 27, 45, 36);
            if (golfBack9Par) onboardingData.golfBack9Par = validateNumber(golfBack9Par.value, 27, 45, 36);
            break;
        case 4:
            const includeEvents = document.getElementById('ob_includeEvents');
            if (includeEvents) onboardingData.includeEvents = includeEvents.checked;
            saveOnboardingEventData();
            break;
        case 5:
            const includeTrivia = document.getElementById('ob_includeTrivia');
            const triviaDate = document.getElementById('ob_triviaDate');
            const triviaTime = document.getElementById('ob_triviaTime');
            if (includeTrivia) onboardingData.includeTrivia = includeTrivia.checked;
            if (triviaDate) onboardingData.triviaDate = triviaDate.value;
            if (triviaTime) onboardingData.triviaTime = triviaTime.value;
            break;
        case 6:
            const includePredictions = document.getElementById('ob_includePredictions');
            if (includePredictions) onboardingData.includePredictions = includePredictions.checked;
            break;
    }
}

function onboardingNext() {
    saveOnboardingStepData();
    onboardingStep++;
    renderOnboardingWizard();
}

function onboardingPrev() {
    saveOnboardingStepData();
    onboardingStep--;
    renderOnboardingWizard();
}

function skipOnboarding() {
    if (confirm('Skip setup? You can always configure everything from the Admin page.')) {
        const settings = getSiteSettings();
        settings.onboardingComplete = true;
        saveSiteSettings(settings);
        closeOnboardingModal();
    }
}

function completeOnboarding() {
    saveOnboardingStepData();

    // Save site settings
    const settings = getSiteSettings();
    settings.heroTitle = onboardingData.heroTitle || settings.heroTitle;
    settings.heroSubtitle = onboardingData.heroSubtitle || settings.heroSubtitle;
    settings.onboardingComplete = true;

    // Golf settings
    if (!settings.golfSettings) settings.golfSettings = {};
    if (onboardingData.includeGolf) {
        settings.golfSettings.scheduledDate = onboardingData.golfDate;
        settings.golfSettings.scheduledTime = onboardingData.golfTime;
        settings.golfSettings.format = onboardingData.golfFormat;
        settings.golfSettings.scoringType = onboardingData.golfScoringType;
        settings.golfSettings.front9Par = onboardingData.golfFront9Par || 36;
        settings.golfSettings.back9Par = onboardingData.golfBack9Par || 36;
        settings.golfSettings.enabled = true;
    } else {
        settings.golfSettings.enabled = false;
    }

    // Feature visibility flags
    settings.featuresEnabled = {
        golf: onboardingData.includeGolf,
        events: onboardingData.includeEvents,
        trivia: onboardingData.includeTrivia,
        predictions: onboardingData.includePredictions
    };

    saveSiteSettings(settings);

    // Save players
    const players = {};
    for (let i = 1; i <= onboardingData.playerCount; i++) {
        players[i] = {
            name: onboardingData.players[i] || '',
            isAdmin: i === onboardingData.adminSlot
        };
    }
    writeToFirebase('players', players);

    // Save trivia settings if enabled
    if (onboardingData.includeTrivia) {
        const triviaGame = getTriviaGame();
        triviaGame.scheduledDate = onboardingData.triviaDate;
        triviaGame.scheduledTime = onboardingData.triviaTime;
        saveTriviaGame(triviaGame);
    }

    // Create quick events if any
    // Try to capture any visible event data one more time (in case user navigated back to step 4)
    saveOnboardingEventData();

    if (onboardingData.includeEvents && onboardingData.quickEvents.length > 0) {
        onboardingData.quickEvents.forEach((evt, idx) => {
            if (evt.name && evt.name.trim()) {
                // Use the saved scoring mode, default to 'individual' only if truly undefined
                const scoringMode = evt.scoringMode || 'individual';
                createCustomEvent(evt.name.trim(), '', scoringMode, 1, evt.date || '', '');
            }
        });
    }

    closeOnboardingModal();

    // Refresh the page to show updated data
    if (isHomePage()) {
        renderPlayerGrid();
        renderWeekendSchedule();
        applyHeroSettings();
    }

    showToast('Setup complete! Your tournament is ready.', 'success');
}

function closeOnboardingModal() {
    const modal = document.getElementById('onboardingModal');
    if (modal) modal.remove();
}

// Check and trigger onboarding after admin login
function checkOnboarding() {
    if (shouldShowOnboarding()) {
        // Small delay to let the page render first
        setTimeout(startOnboarding, 500);
    }
}
