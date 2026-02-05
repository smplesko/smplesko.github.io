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
                       style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
            </div>
            <div>
                <label class="label-block text-silver">Homepage Subtitle</label>
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
                            <input type="text" id="golfFormatInput" value="${settings.golfSettings?.format || 'Scramble'}"
                                   placeholder="e.g., Scramble"
                                   style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                        </div>
                        <div>
                            <label class="label-block text-silver">Scoring Type</label>
                            <input type="text" id="golfScoringTypeInput" value="${settings.golfSettings?.scoringType || 'Stableford'}"
                                   placeholder="e.g., Stableford"
                                   style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                        </div>
                    </div>
                    <div>
                        <label class="label-block text-silver">Description (shown on golf page)</label>
                        <input type="text" id="golfDescriptionInput" value="${settings.golfSettings?.description || ''}"
                               placeholder="e.g., 18 holes at Lions Golf Course"
                               style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label class="label-block text-silver">Scheduled Date</label>
                            <input type="date" id="golfScheduledDateInput" value="${settings.golfSettings?.scheduledDate || ''}"
                                   style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                        </div>
                        <div>
                            <label class="label-block text-silver">Start Time</label>
                            <input type="time" id="golfScheduledTimeInput" value="${settings.golfSettings?.scheduledTime || ''}"
                                   style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
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

function saveGolfSettings() {
    const format = document.getElementById('golfFormatInput').value.trim();
    const scoringType = document.getElementById('golfScoringTypeInput').value.trim();
    const description = document.getElementById('golfDescriptionInput').value.trim();
    const scheduledDate = document.getElementById('golfScheduledDateInput').value;
    const scheduledTime = document.getElementById('golfScheduledTimeInput').value;

    const settings = getSiteSettings();
    if (!settings.golfSettings) {
        settings.golfSettings = {};
    }
    settings.golfSettings.format = format || 'Scramble';
    settings.golfSettings.scoringType = scoringType || 'Stableford';
    settings.golfSettings.description = description;
    settings.golfSettings.scheduledDate = scheduledDate;
    settings.golfSettings.scheduledTime = scheduledTime;

    saveSiteSettings(settings);
    alert('Golf settings saved!');
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

// ===== ONBOARDING WIZARD =====

let onboardingStep = 1;
let onboardingData = {};

// Check if onboarding should be shown
function shouldShowOnboarding() {
    const settings = getSiteSettings();
    return !settings.onboardingComplete && isAdmin();
}

// Start the onboarding wizard
function startOnboarding() {
    onboardingStep = 1;
    onboardingData = {
        heroTitle: '',
        heroSubtitle: '',
        players: {},
        golfDate: '',
        golfTime: '',
        golfFormat: 'Scramble',
        golfScoringType: 'Stableford'
    };

    // Pre-fill with current data
    const settings = getSiteSettings();
    const players = getPlayers();

    onboardingData.heroTitle = settings.heroTitle || '';
    onboardingData.heroSubtitle = settings.heroSubtitle || '';
    onboardingData.golfDate = settings.golfSettings?.scheduledDate || '';
    onboardingData.golfTime = settings.golfSettings?.scheduledTime || '';
    onboardingData.golfFormat = settings.golfSettings?.format || 'Scramble';
    onboardingData.golfScoringType = settings.golfSettings?.scoringType || 'Stableford';

    for (let i = 1; i <= MAX_PLAYERS; i++) {
        onboardingData.players[i] = players[i]?.name || '';
    }

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

    const totalSteps = 4;
    const progressPercent = (onboardingStep / totalSteps) * 100;

    let stepContent = '';
    let stepTitle = '';

    switch (onboardingStep) {
        case 1:
            stepTitle = 'Welcome! Let\'s Set Up Your Tournament';
            stepContent = renderOnboardingStep1();
            break;
        case 2:
            stepTitle = 'Add Your Players';
            stepContent = renderOnboardingStep2();
            break;
        case 3:
            stepTitle = 'Golf Event Setup';
            stepContent = renderOnboardingStep3();
            break;
        case 4:
            stepTitle = 'You\'re All Set!';
            stepContent = renderOnboardingStep4();
            break;
    }

    modal.innerHTML = `
        <div class="onboarding-content">
            <div class="onboarding-progress">
                <div class="onboarding-progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="onboarding-step-indicator">Step ${onboardingStep} of ${totalSteps}</div>
            <h2 class="onboarding-title">${stepTitle}</h2>
            <div class="onboarding-body">
                ${stepContent}
            </div>
            <div class="onboarding-actions">
                ${onboardingStep > 1 ? '<button class="btn" onclick="onboardingPrev()">Back</button>' : '<button class="btn" style="background: var(--silver);" onclick="skipOnboarding()">Skip Setup</button>'}
                ${onboardingStep < totalSteps
                    ? '<button class="btn btn-gold" onclick="onboardingNext()">Next</button>'
                    : '<button class="btn btn-gold" onclick="completeOnboarding()">Finish Setup</button>'
                }
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

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

function renderOnboardingStep2() {
    let playersHtml = '<div class="onboarding-players-grid">';
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        const isAdmin = i === 1;
        playersHtml += `
            <div class="onboarding-player-item">
                <label>Player ${i}${isAdmin ? ' (Admin)' : ''}</label>
                <input type="text" id="ob_player${i}" value="${onboardingData.players[i] || ''}"
                       placeholder="Enter name" onchange="onboardingData.players[${i}] = this.value">
            </div>
        `;
    }
    playersHtml += '</div>';

    return `
        <p class="onboarding-desc">Enter the names of all participants. Player 1 is the admin account.</p>
        ${playersHtml}
    `;
}

function renderOnboardingStep3() {
    return `
        <p class="onboarding-desc">Configure your golf event details. You can always change these later in Admin settings.</p>
        <div class="onboarding-form">
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
                        <option value="Stroke Play" ${onboardingData.golfFormat === 'Stroke Play' ? 'selected' : ''}>Stroke Play</option>
                        <option value="Match Play" ${onboardingData.golfFormat === 'Match Play' ? 'selected' : ''}>Match Play</option>
                    </select>
                </div>
                <div class="onboarding-field">
                    <label>Scoring</label>
                    <select id="ob_golfScoringType">
                        <option value="Stableford" ${onboardingData.golfScoringType === 'Stableford' ? 'selected' : ''}>Stableford</option>
                        <option value="Stroke" ${onboardingData.golfScoringType === 'Stroke' ? 'selected' : ''}>Stroke</option>
                    </select>
                </div>
            </div>
        </div>
        <p class="onboarding-hint">Tip: You can set up golf teams and other events from the Admin page after setup.</p>
    `;
}

function renderOnboardingStep4() {
    const playerCount = Object.values(onboardingData.players).filter(n => n && n.trim()).length;
    const hasGolfDate = onboardingData.golfDate ? 'Yes' : 'Not set';

    return `
        <div class="onboarding-summary">
            <div class="onboarding-checkmark">&#10003;</div>
            <p class="onboarding-desc">Your tournament is ready to go!</p>
            <div class="onboarding-summary-items">
                <div class="onboarding-summary-item">
                    <span class="summary-label">Tournament:</span>
                    <span class="summary-value">${onboardingData.heroTitle || 'Default Title'}</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Players:</span>
                    <span class="summary-value">${playerCount} configured</span>
                </div>
                <div class="onboarding-summary-item">
                    <span class="summary-label">Golf Scheduled:</span>
                    <span class="summary-value">${hasGolfDate}</span>
                </div>
            </div>
            <p class="onboarding-hint">You can add custom events, trivia questions, and predictions from the Admin page.</p>
        </div>
    `;
}

function saveOnboardingStepData() {
    // Save current step's input values to onboardingData
    switch (onboardingStep) {
        case 1:
            const title = document.getElementById('ob_heroTitle');
            const subtitle = document.getElementById('ob_heroSubtitle');
            if (title) onboardingData.heroTitle = title.value;
            if (subtitle) onboardingData.heroSubtitle = subtitle.value;
            break;
        case 2:
            for (let i = 1; i <= MAX_PLAYERS; i++) {
                const input = document.getElementById(`ob_player${i}`);
                if (input) onboardingData.players[i] = input.value;
            }
            break;
        case 3:
            const golfDate = document.getElementById('ob_golfDate');
            const golfTime = document.getElementById('ob_golfTime');
            const golfFormat = document.getElementById('ob_golfFormat');
            const golfScoringType = document.getElementById('ob_golfScoringType');
            if (golfDate) onboardingData.golfDate = golfDate.value;
            if (golfTime) onboardingData.golfTime = golfTime.value;
            if (golfFormat) onboardingData.golfFormat = golfFormat.value;
            if (golfScoringType) onboardingData.golfScoringType = golfScoringType.value;
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

    // Save all collected data to Firebase
    const settings = getSiteSettings();
    settings.heroTitle = onboardingData.heroTitle || settings.heroTitle;
    settings.heroSubtitle = onboardingData.heroSubtitle || settings.heroSubtitle;
    settings.onboardingComplete = true;

    if (!settings.golfSettings) settings.golfSettings = {};
    settings.golfSettings.scheduledDate = onboardingData.golfDate;
    settings.golfSettings.scheduledTime = onboardingData.golfTime;
    settings.golfSettings.format = onboardingData.golfFormat;
    settings.golfSettings.scoringType = onboardingData.golfScoringType;

    saveSiteSettings(settings);

    // Save player names
    const players = getPlayers();
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        if (onboardingData.players[i]) {
            players[i] = {
                name: onboardingData.players[i],
                isAdmin: i === 1
            };
        }
    }
    writeToFirebase('players', players);

    closeOnboardingModal();

    // Refresh the page to show updated data
    if (isHomePage()) {
        renderPlayerGrid();
        renderWeekendSchedule();
        applyHeroSettings();
    }
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
