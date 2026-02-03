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
