// Dird Plesk Memorial Open Invitational of Champions - Main Application
// With Firebase Realtime Database for cross-device sync

// ===== FIREBASE INITIALIZATION =====
const firebaseConfig = {
    apiKey: "AIzaSyD-bbGBqC58dvjqJhdFLHaTBfp1FGpuPHM",
    authDomain: "bp-games-tracker.firebaseapp.com",
    databaseURL: "https://bp-games-tracker-default-rtdb.firebaseio.com",
    projectId: "bp-games-tracker",
    storageBucket: "bp-games-tracker.firebasestorage.app",
    messagingSenderId: "983654017455",
    appId: "1:983654017455:web:81ff968449c7320d1fe75a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== LOCAL DATA CACHE =====
// This cache is synced with Firebase in real-time
let dataCache = {
    players: null,
    gokartPoints: null,
    triviaPoints: null,
    bonusPoints: null,
    golfTeams: null,
    golfHoleScores: null,
    golfShotguns: null,
    golfBonuses: null,
    golfScoringEnabled: null,
    beerTeams: null,
    beerScores: null,
    gokartResults: null,
    triviaGame: null,
    siteSettings: null,
    predictions: null
};

let firebaseReady = false;

// Player structure: 12 players with slot numbers and display names
// Stephen (admin) is Player 1
const DEFAULT_PLAYERS = {
    1: { name: 'Stephen', isAdmin: true },
    2: { name: 'Alex', isAdmin: false },
    3: { name: 'Brad', isAdmin: false },
    4: { name: 'Bryant', isAdmin: false },
    5: { name: 'Cody', isAdmin: false },
    6: { name: 'Evan', isAdmin: false },
    7: { name: 'Jack', isAdmin: false },
    8: { name: 'Joe', isAdmin: false },
    9: { name: 'Kevin', isAdmin: false },
    10: { name: 'Matt', isAdmin: false },
    11: { name: 'Pete', isAdmin: false },
    12: { name: 'Will', isAdmin: false }
};

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

// Default site settings
const DEFAULT_SITE_SETTINGS = {
    heroTitle: 'Dird Plesk Memorial Open Invitational of Champions',
    heroSubtitle: 'The event no one asked for.',
    notesVisible: true,
    notesContent: 'Notes go here',
    competitionClosed: false,
    eventLocks: {
        golf: false,
        beerOlympics: false,
        goKarts: false,
        trivia: false,
        predictions: false
    }
};

// Default trivia game settings
const DEFAULT_TRIVIA_GAME = {
    questions: [],
    currentQuestion: 0,
    status: 'waiting',
    responses: {},
    joinedPlayers: {},  // Track who has joined the trivia lobby
    maxQuestions: 16
};

// Default predictions settings
// Each prediction: { id, question, type: 'whoDoneIt'|'custom', options: [], pointValue: 1, responses: {playerName: answer}, correctAnswer: null, finalized: false }
const DEFAULT_PREDICTIONS = {
    items: [],
    maxPredictions: 16
};

// ===== FIREBASE DATA SYNC =====
function setupFirebaseListeners() {
    const paths = [
        { path: 'players', default: DEFAULT_PLAYERS },
        { path: 'gokartPoints', default: DEFAULT_GOKART_POINTS },
        { path: 'triviaPoints', default: DEFAULT_TRIVIA_POINTS },
        { path: 'bonusPoints', default: DEFAULT_BONUS_POINTS },
        { path: 'golfTeams', default: {} },
        { path: 'golfHoleScores', default: {} },
        { path: 'golfShotguns', default: {} },
        { path: 'golfBonuses', default: { bestFront: '', bestBack: '', overallWinner: '' } },
        { path: 'golfScoringEnabled', default: {} },
        { path: 'beerTeams', default: {1: {}, 2: {}, 3: {}, 4: {}, 5: {}} },
        { path: 'beerScores', default: {1: {}, 2: {}, 3: {}, 4: {}, 5: {}} },
        { path: 'gokartResults', default: {} },
        { path: 'triviaGame', default: DEFAULT_TRIVIA_GAME },
        { path: 'siteSettings', default: DEFAULT_SITE_SETTINGS },
        { path: 'predictions', default: DEFAULT_PREDICTIONS }
    ];

    paths.forEach(({ path, default: defaultVal }) => {
        db.ref(path).on('value', (snapshot) => {
            const val = snapshot.val();
            dataCache[path] = val !== null ? val : defaultVal;

            // If this is initial load and we got null, set the default
            if (val === null) {
                db.ref(path).set(defaultVal);
            }

            // Trigger UI updates when data changes
            onDataChange(path);
        });
    });

    firebaseReady = true;
}

// Called when Firebase data changes - refresh relevant UI
function onDataChange(path) {
    const currentPath = window.location.pathname;

    // Always update hero settings
    if (path === 'siteSettings') {
        applyHeroSettings();
    }

    // Update player grid on home
    if (path === 'players' && (currentPath === '/' || currentPath === '/index.html')) {
        renderPlayerGrid();
    }

    // Update leaderboards
    if (currentPath === '/leaderboard' || currentPath === '/leaderboard.html') {
        renderLeaderboards();
    }

    // Update golf scorecard
    if (path.startsWith('golf') && (currentPath === '/golf' || currentPath === '/golf.html')) {
        renderGolfScorecard();
    }

    // Update trivia page
    if (path === 'triviaGame' && (currentPath === '/trivia' || currentPath === '/trivia.html')) {
        renderTriviaPage();
        if (isAdmin()) {
            renderTriviaGameControls();
        }
    }

    // Update admin page
    if (currentPath === '/admin' || currentPath === '/admin.html') {
        if (path === 'players') renderPlayerList();
        if (path === 'siteSettings') renderSiteSettings();
        if (path === 'triviaGame') {
            renderTriviaQuestionAdmin();
            renderTriviaGameControls();
        }
        if (path === 'predictions') renderPredictionsAdmin();
    }

    // Update predictions page
    if (path === 'predictions' && (currentPath === '/predictions' || currentPath === '/predictions.html')) {
        renderPredictionsPage();
    }

    // Update profile
    if (currentPath === '/profile' || currentPath === '/profile.html') {
        renderProfile();
    }

    // Always check for unanswered predictions banner
    if (path === 'predictions') {
        updatePredictionsBanner();
    }
}

// Write data to Firebase
function writeToFirebase(path, data) {
    db.ref(path).set(data);
}

// Initialize data - now uses Firebase
function initData() {
    // Set up Firebase listeners
    setupFirebaseListeners();
    // Initialize theme (stays in localStorage - device specific)
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'dark');
    }
    applyTheme();
}

// Get data helpers (now read from Firebase cache)
function getPlayers() {
    return dataCache.players || DEFAULT_PLAYERS;
}

function getPlayerList() {
    const players = getPlayers();
    // Return array of player names sorted alphabetically, excluding empty slots
    return Object.values(players)
        .map(p => p.name)
        .filter(name => name && name.trim() !== '')
        .sort((a, b) => a.localeCompare(b));
}

function getPlayerBySlot(slot) {
    const players = getPlayers();
    return players[slot] || { name: `Player ${slot}`, isAdmin: false };
}

function updatePlayerName(slot, newName) {
    const players = getPlayers();
    if (players[slot]) {
        players[slot].name = newName;
        writeToFirebase('players', players);
    }
}

function getGokartPoints() {
    return dataCache.gokartPoints || DEFAULT_GOKART_POINTS;
}

function getTriviaPoints() {
    return dataCache.triviaPoints || DEFAULT_TRIVIA_POINTS;
}

function getBonusPoints() {
    return dataCache.bonusPoints || DEFAULT_BONUS_POINTS;
}

function getGolfTeams() {
    return dataCache.golfTeams || {};
}

function getGolfHoleScores() {
    return dataCache.golfHoleScores || {};
}

function getGolfShotguns() {
    return dataCache.golfShotguns || {};
}

function getGolfBonuses() {
    return dataCache.golfBonuses || { bestFront: '', bestBack: '', overallWinner: '' };
}

function getGolfScoringEnabled() {
    return dataCache.golfScoringEnabled || {};
}

function getBeerTeams() {
    return dataCache.beerTeams || {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
}

function getBeerScores() {
    return dataCache.beerScores || {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
}

function getGokartResults() {
    return dataCache.gokartResults || {};
}

function getSiteSettings() {
    return dataCache.siteSettings || DEFAULT_SITE_SETTINGS;
}

function saveSiteSettings(settings) {
    writeToFirebase('siteSettings', settings);
}

function getTriviaGame() {
    const game = dataCache.triviaGame || {};
    // Ensure all required fields exist (Firebase may omit empty objects)
    return {
        questions: game.questions || [],
        currentQuestion: game.currentQuestion || 0,
        status: game.status || 'waiting',
        responses: game.responses || {},
        joinedPlayers: game.joinedPlayers || {},
        maxQuestions: game.maxQuestions || 16
    };
}

function saveTriviaGame(game) {
    writeToFirebase('triviaGame', game);
}

// Determine which events have data (completed)
function getCompletedEvents() {
    const completed = { golf: false, beer: false, gokart: false, trivia: false };

    // Golf: Check if any team has hole scores
    const holeScores = getGolfHoleScores();
    if (Object.keys(holeScores).length > 0) {
        for (const teamNum of Object.keys(holeScores)) {
            if (Object.keys(holeScores[teamNum]).length > 0) {
                completed.golf = true;
                break;
            }
        }
    }

    // Beer: Check if any game has scores
    const beerScores = getBeerScores();
    for (let game = 1; game <= 5; game++) {
        const scores = beerScores[game] || {};
        if (Object.values(scores).some(s => s > 0)) {
            completed.beer = true;
            break;
        }
    }

    // Gokart: Check if any results exist
    const gokartResults = getGokartResults();
    if (Object.keys(gokartResults).length > 0) {
        completed.gokart = true;
    }

    // Trivia: Check if game is complete or has any points
    const triviaGame = getTriviaGame();
    if (triviaGame.status === 'complete') {
        completed.trivia = true;
    }

    return completed;
}

// Theme management
function getTheme() {
    return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme();
}

function toggleTheme() {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
}

function applyTheme() {
    const theme = getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Update toggle button text if exists
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
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

function getCurrentUserSlot() {
    return localStorage.getItem('currentUserSlot');
}

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function setCurrentUser(playerName, slot, admin = false) {
    localStorage.setItem('currentUser', playerName);
    localStorage.setItem('currentUserSlot', slot);
    localStorage.setItem('isAdmin', admin.toString());
    updateUI();
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserSlot');
    localStorage.removeItem('isAdmin');
    updateUI();
    window.location.href = '/';
}

// Password modal
function openModal(slot) {
    document.getElementById('passwordModal').classList.add('active');
    document.getElementById('adminPassword').focus();
    document.getElementById('passwordModal').dataset.slot = slot;
}

function closeModal() {
    document.getElementById('passwordModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
}

function submitPassword() {
    const password = document.getElementById('adminPassword').value;
    const slot = document.getElementById('passwordModal').dataset.slot;
    if (password === '1816') {
        const player = getPlayerBySlot(slot);
        setCurrentUser(player.name, slot, true);
        closeModal();
    } else {
        alert('Incorrect password');
    }
}

// Login as player
function loginAsPlayer(slot) {
    const player = getPlayerBySlot(slot);
    if (player.isAdmin) {
        openModal(slot);
    } else {
        setCurrentUser(player.name, slot, false);
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
        if (getCurrentUserSlot() == slot) {
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
                <p style="font-size: 0.85em; color: var(--silver); margin-bottom: 15px;">Lock events to prevent accidental score changes after completion.</p>
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
                            <input type="checkbox" id="lockBeerOlympics" ${eventLocks.beerOlympics ? 'checked' : ''} onchange="toggleEventLock('beerOlympics')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Beer Olympics ${eventLocks.beerOlympics ? '(Locked)' : ''}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="lockGoKarts" ${eventLocks.goKarts ? 'checked' : ''} onchange="toggleEventLock('goKarts')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span>Go-Karts ${eventLocks.goKarts ? '(Locked)' : ''}</span>
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
        settings.eventLocks = { golf: false, beerOlympics: false, goKarts: false, trivia: false, predictions: false };
    }
    settings.eventLocks[eventName] = !settings.eventLocks[eventName];
    saveSiteSettings(settings);

    const lockNames = { golf: 'Golf', beerOlympics: 'Beer Olympics', goKarts: 'Go-Karts', trivia: 'Trivia', predictions: 'Predictions' };
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

// Mobile-friendly checkbox group for team selection
function createCheckboxGroup(containerId, teamNum, prefix, existingMembers = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const playerList = getPlayerList();
    let html = '<div class="checkbox-group">';

    playerList.forEach(playerName => {
        const checked = existingMembers.includes(playerName) ? 'checked' : '';
        const selectedClass = existingMembers.includes(playerName) ? 'selected' : '';
        html += `
            <label class="${selectedClass}" onclick="toggleCheckboxLabel(this)">
                <input type="checkbox" name="${prefix}Team${teamNum}" value="${playerName}" ${checked}>
                ${playerName}
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

    writeToFirebase('golfTeams', teams);
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
    writeToFirebase('golfScoringEnabled', scoringEnabled);
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
    writeToFirebase('bonusPoints', bonusPoints);
}

function saveGolfBonuses() {
    const bonuses = {
        bestFront: document.getElementById('bonusBestFront').value,
        bestBack: document.getElementById('bonusBestBack').value,
        overallWinner: document.getElementById('bonusOverallWinner').value
    };
    writeToFirebase('golfBonuses', bonuses);
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
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <label style="color: var(--silver);">Team Shotguns:</label>
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

    writeToFirebase('beerTeams', allBeerTeams);
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
                <small style="display: block; opacity: 0.7; margin-bottom: 5px; font-size: 0.8em;">${teams[teamNum].join(', ')}</small>
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

    writeToFirebase('beerScores', allBeerScores);
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
            <label>${getOrdinal(i)}</label>
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
            <label>${getOrdinal(i)}</label>
            <span style="font-size: 1.3em; font-weight: bold; color: var(--accent-red);">${points[i] || 0}</span>
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
    writeToFirebase('gokartPoints', points);
    alert('Go-kart point values saved!');
    renderGokartPointDisplay();
}

function renderGokartScoringAdmin() {
    const container = document.getElementById('gokartScoringAdmin');
    if (!container) return;

    const playerList = getPlayerList();
    const results = getGokartResults();

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'scoring-grid';

    playerList.forEach(player => {
        const div = document.createElement('div');
        div.className = 'score-input';
        div.innerHTML = `
            <label>${player}</label>
            <select id="gokartPos_${player.replace(/\s/g, '_')}">
                <option value="">-- Pos --</option>
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
    const playerList = getPlayerList();
    const results = {};

    playerList.forEach(player => {
        const select = document.getElementById(`gokartPos_${player.replace(/\s/g, '_')}`);
        if (select && select.value) {
            results[player] = parseInt(select.value);
        }
    });

    writeToFirebase('gokartResults', results);
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

// ===== TRIVIA GAME SYSTEM =====

// Calculate trivia points from game responses
function calculateTriviaPlayerPoints() {
    const game = getTriviaGame();
    const playerPoints = {};
    const playerList = getPlayerList();

    // Initialize all players with 0
    playerList.forEach(player => {
        playerPoints[player] = 0;
    });

    // Sum up points from approved answers
    if (game.responses) {
        Object.keys(game.responses).forEach(qNum => {
            const questionIdx = parseInt(qNum) - 1;
            const question = game.questions[questionIdx];
            if (!question) return;

            const qResponses = game.responses[qNum];
            Object.keys(qResponses).forEach(playerName => {
                const response = qResponses[playerName];
                if (response.approved && playerPoints.hasOwnProperty(playerName)) {
                    playerPoints[playerName] += question.pointValue;
                    if (response.bonus) {
                        playerPoints[playerName] += 1; // Bonus is always 1 point
                    }
                }
            });
        });
    }

    return playerPoints;
}

// Get total possible trivia points through current question
function getTotalPossibleTriviaPoints() {
    const game = getTriviaGame();
    let total = 0;
    const questionsAnswered = game.currentQuestion;

    for (let i = 0; i < questionsAnswered; i++) {
        if (game.questions[i]) {
            total += game.questions[i].pointValue;
        }
    }

    return total;
}

// Admin: Render question management
function renderTriviaQuestionAdmin() {
    const container = document.getElementById('triviaQuestionAdmin');
    if (!container) return;

    const game = getTriviaGame();

    let html = '<h4 style="color: var(--gold); margin-bottom: 15px;">Trivia Questions (max 16)</h4>';

    // CSV Upload section
    html += `
        <div style="background: rgba(201, 162, 39, 0.1); border: 1px dashed var(--gold); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
            <h5 style="color: var(--gold); margin-bottom: 10px;">Bulk Import via CSV</h5>
            <p style="font-size: 0.85em; color: var(--silver); margin-bottom: 10px;">
                Upload a CSV file to import multiple questions at once. Supports both question types.
            </p>
            <input type="file" id="triviaCsvUpload" accept=".csv" onchange="handleTriviaCsvUpload(event)"
                   style="margin-bottom: 10px;">
            <details style="margin-top: 10px;">
                <summary style="cursor: pointer; color: var(--silver); font-size: 0.85em;">CSV Format Guide</summary>
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 0.85em;">
                    <p><strong>Multiple Choice (auto-graded):</strong></p>
                    <code style="display: block; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; overflow-x: auto; white-space: nowrap; margin: 5px 0;">
question,option1,option2,option3,option4,correct_answer,category</code>
                    <p style="margin-top: 5px; font-size: 0.9em;">Example: "Capital of France?","London","Paris","Berlin","Madrid",2,"Geography"</p>

                    <p style="margin-top: 12px;"><strong>Freeform (admin approves):</strong></p>
                    <code style="display: block; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; overflow-x: auto; white-space: nowrap; margin: 5px 0;">
question,category</code>
                    <p style="margin-top: 5px; font-size: 0.9em;">Example: "Name 3 US presidents","History"</p>

                    <p style="margin-top: 12px; color: var(--silver);"><strong>Rules:</strong> If options + correct_answer provided = Multiple Choice. Otherwise = Freeform.</p>
                </div>
            </details>
        </div>
    `;

    html += '<div style="display: grid; gap: 10px;">';

    for (let i = 0; i < 16; i++) {
        const q = game.questions[i] || { text: '', pointValue: 1, type: 'freeform', options: [], correctAnswer: 0, category: '' };
        const questionType = q.type || (q.options && q.options.length > 0 ? 'multiple_choice' : 'freeform');
        const isMultipleChoice = questionType === 'multiple_choice';

        html += `
            <div class="trivia-question-input" style="background: var(--overlay-bg); padding: 12px; border-radius: 8px;">
                <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
                    <strong style="min-width: 25px;">Q${i + 1}</strong>
                    <select id="triviaQType${i}" onchange="changeQuestionType(${i})" style="padding: 6px; border: none; border-radius: 4px;">
                        <option value="freeform" ${!isMultipleChoice ? 'selected' : ''}>Freeform (Admin Approves)</option>
                        <option value="multiple_choice" ${isMultipleChoice ? 'selected' : ''}>Multiple Choice (Auto-Graded)</option>
                    </select>
                    <label style="font-size: 0.85em; color: var(--silver);">Pts:</label>
                    <input type="number" id="triviaQPts${i}" value="${q.pointValue}" min="1" max="10"
                           style="width: 50px; padding: 6px; border: none; border-radius: 4px;">
                    <label style="font-size: 0.85em; color: var(--silver);">Category:</label>
                    <input type="text" id="triviaQCat${i}" value="${q.category || ''}" placeholder="Optional"
                           style="width: 100px; padding: 6px; border: none; border-radius: 4px;">
                </div>
                <textarea id="triviaQ${i}" placeholder="Enter question ${i + 1}..."
                          style="width: 100%; padding: 10px; border: none; border-radius: 5px; min-height: 50px; resize: vertical;">${q.text}</textarea>
                ${isMultipleChoice ? `
                    <div style="margin-top: 10px; padding: 10px; background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); border-radius: 5px;">
                        <p style="font-size: 0.85em; color: #2ecc71; margin-bottom: 8px;">Multiple Choice - Auto-Graded</p>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                            ${[0,1,2,3].map(idx => `
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <span style="color: ${idx + 1 === q.correctAnswer ? '#2ecc71' : 'var(--silver)'}; font-weight: ${idx + 1 === q.correctAnswer ? 'bold' : 'normal'};">
                                        ${idx + 1 === q.correctAnswer ? '✓' : ''} ${idx + 1}.
                                    </span>
                                    <input type="text" id="triviaQOpt${i}_${idx}" value="${q.options && q.options[idx] ? q.options[idx] : ''}"
                                           placeholder="Option ${idx + 1}${idx < 2 ? ' (required)' : ' (optional)'}"
                                           style="flex: 1; padding: 6px; border: none; border-radius: 4px; font-size: 0.9em;">
                                </div>
                            `).join('')}
                        </div>
                        <div style="margin-top: 8px;">
                            <label style="font-size: 0.85em; color: var(--silver);">Correct Answer:</label>
                            <select id="triviaQCorrect${i}" style="padding: 6px; border: none; border-radius: 4px; margin-left: 5px;">
                                <option value="1" ${q.correctAnswer === 1 ? 'selected' : ''}>Option 1</option>
                                <option value="2" ${q.correctAnswer === 2 ? 'selected' : ''}>Option 2</option>
                                <option value="3" ${q.correctAnswer === 3 ? 'selected' : ''}>Option 3</option>
                                <option value="4" ${q.correctAnswer === 4 ? 'selected' : ''}>Option 4</option>
                            </select>
                        </div>
                    </div>
                ` : `
                    <div style="margin-top: 10px; padding: 10px; background: rgba(201, 162, 39, 0.1); border: 1px solid rgba(201, 162, 39, 0.3); border-radius: 5px;">
                        <p style="font-size: 0.85em; color: var(--gold);">Freeform - Players type answers, admin approves/denies</p>
                    </div>
                `}
            </div>
        `;
    }

    html += '</div>';
    html += '<button class="btn btn-gold" onclick="saveTriviaQuestions()" style="margin-top: 15px;">Save Questions</button>';

    container.innerHTML = html;
}

function changeQuestionType(questionIndex) {
    const typeSelect = document.getElementById(`triviaQType${questionIndex}`);
    const newType = typeSelect ? typeSelect.value : 'freeform';

    const game = getTriviaGame();
    if (!game.questions[questionIndex]) {
        game.questions[questionIndex] = { text: '', pointValue: 1, type: newType, options: [], correctAnswer: 1, category: '' };
    } else {
        game.questions[questionIndex].type = newType;
        if (newType === 'multiple_choice' && (!game.questions[questionIndex].options || game.questions[questionIndex].options.length === 0)) {
            game.questions[questionIndex].options = ['', '', '', ''];
            game.questions[questionIndex].correctAnswer = 1;
        }
    }
    saveTriviaGame(game);
    renderTriviaQuestionAdmin();
}

function addOptionsToQuestion(questionIndex) {
    const game = getTriviaGame();
    if (!game.questions[questionIndex]) {
        game.questions[questionIndex] = { text: '', pointValue: 1, type: 'multiple_choice', options: [], correctAnswer: 1, category: '' };
    }
    game.questions[questionIndex].type = 'multiple_choice';
    game.questions[questionIndex].options = ['', '', '', ''];
    game.questions[questionIndex].correctAnswer = 1;
    saveTriviaGame(game);
    renderTriviaQuestionAdmin();
}

function handleTriviaCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const questions = parseTriviaCsv(csv);

            if (questions.length === 0) {
                alert('No valid questions found in CSV file.');
                return;
            }

            if (questions.length > 16) {
                alert(`CSV contains ${questions.length} questions. Only the first 16 will be imported.`);
                questions.length = 16;
            }

            const game = getTriviaGame();
            game.questions = questions;
            saveTriviaGame(game);

            alert(`Successfully imported ${questions.length} trivia questions!`);
            renderTriviaQuestionAdmin();

            // Clear the file input
            event.target.value = '';
        } catch (err) {
            alert('Error parsing CSV file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function parseTriviaCsv(csv) {
    const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const questions = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip header row if present
        if (i === 0 && line.toLowerCase().includes('question') && (line.toLowerCase().includes('option') || line.toLowerCase().includes('type'))) {
            continue;
        }

        // Parse CSV line handling quoted fields
        const fields = parseCsvLine(line);

        if (fields.length < 1) continue; // Need at least question

        const questionText = fields[0] || '';
        if (!questionText) continue;

        const options = [];

        // Get options (fields 1-4)
        for (let j = 1; j <= 4; j++) {
            if (fields[j] && fields[j].trim()) {
                options.push(fields[j].trim());
            }
        }

        // Determine question type based on options
        // If no options or less than 2, it's freeform
        // If 2+ options and correct_answer provided, it's multiple choice
        const correctAnswerField = fields[5] ? fields[5].trim() : '';
        const correctAnswer = parseInt(correctAnswerField) || 0;
        const category = fields[6] ? fields[6].trim() : '';

        if (options.length >= 2 && correctAnswer > 0) {
            // Multiple choice question
            questions.push({
                text: questionText,
                pointValue: 1,
                type: 'multiple_choice',
                options: options,
                correctAnswer: Math.min(correctAnswer, options.length),
                category: category
            });
        } else {
            // Freeform question (no options or no correct answer)
            questions.push({
                text: questionText,
                pointValue: 1,
                type: 'freeform',
                options: [],
                correctAnswer: 0,
                category: category || (fields[1] ? fields[1].trim() : '') // Use field 1 as category if no options
            });
        }
    }

    return questions;
}

function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    fields.push(current.trim());
    return fields;
}

function saveTriviaQuestions() {
    const game = getTriviaGame();
    const newQuestions = [];

    for (let i = 0; i < 16; i++) {
        const textInput = document.getElementById(`triviaQ${i}`);
        const ptsInput = document.getElementById(`triviaQPts${i}`);
        const catInput = document.getElementById(`triviaQCat${i}`);
        const typeInput = document.getElementById(`triviaQType${i}`);
        const correctInput = document.getElementById(`triviaQCorrect${i}`);

        const text = textInput ? textInput.value.trim() : '';
        const pts = ptsInput ? parseInt(ptsInput.value) || 1 : 1;
        const category = catInput ? catInput.value.trim() : '';
        const questionType = typeInput ? typeInput.value : 'freeform';

        if (text) {
            const question = { text, pointValue: pts, category, type: questionType };

            if (questionType === 'multiple_choice') {
                // Get options for multiple choice
                const options = [];
                for (let j = 0; j < 4; j++) {
                    const optInput = document.getElementById(`triviaQOpt${i}_${j}`);
                    if (optInput && optInput.value.trim()) {
                        options.push(optInput.value.trim());
                    }
                }
                if (options.length >= 2) {
                    question.options = options;
                    question.correctAnswer = correctInput ? parseInt(correctInput.value) || 1 : 1;
                } else {
                    // Not enough options, convert to freeform
                    question.type = 'freeform';
                    question.options = [];
                    question.correctAnswer = 0;
                }
            } else {
                // Freeform question
                question.options = [];
                question.correctAnswer = 0;
            }

            newQuestions.push(question);
        }
    }

    game.questions = newQuestions;
    saveTriviaGame(game);
    alert(`Saved ${game.questions.length} trivia questions!`);
}

// Admin: Game controls
function renderTriviaGameControls() {
    const container = document.getElementById('triviaGameControls');
    if (!container) return;

    const game = getTriviaGame();
    const totalQuestions = game.questions.length;
    const joinedPlayers = Object.keys(game.joinedPlayers || {});
    const playerList = getPlayerList();

    let html = '<h4 style="color: var(--gold); margin-bottom: 15px;">Game Controls</h4>';

    if (totalQuestions === 0) {
        html += '<p style="opacity: 0.7;">Add questions above first</p>';
        container.innerHTML = html;
        return;
    }

    html += `<p>Total Questions: ${totalQuestions} | Current: ${game.currentQuestion} | Status: <strong>${game.status}</strong></p>`;

    if (game.status === 'waiting') {
        // Show waiting room status
        html += `<div style="background: var(--overlay-bg); padding: 15px; border-radius: 10px; margin: 15px 0;">`;
        html += `<h5 style="color: var(--gold); margin-bottom: 10px;">Waiting Room (${joinedPlayers.length}/${playerList.length} players)</h5>`;

        if (joinedPlayers.length === 0) {
            html += `<p style="opacity: 0.7;">No players have joined yet. Players can join from the Trivia page.</p>`;
        } else {
            html += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`;
            joinedPlayers.forEach(player => {
                html += `<span style="background: rgba(46, 204, 113, 0.3); padding: 5px 12px; border-radius: 20px; font-size: 0.9em;">${player}</span>`;
            });
            html += `</div>`;

            // Show who hasn't joined
            const notJoined = playerList.filter(p => !joinedPlayers.includes(p));
            if (notJoined.length > 0) {
                html += `<p style="margin-top: 10px; font-size: 0.85em; opacity: 0.7;">Not joined: ${notJoined.join(', ')}</p>`;
            }
        }
        html += `</div>`;

        html += `<button class="btn btn-gold" onclick="triviaShowQuestion(1)" ${joinedPlayers.length === 0 ? 'disabled style="opacity: 0.5;"' : ''}>Start Trivia - Show Q1</button>`;
        if (joinedPlayers.length === 0) {
            html += `<p style="font-size: 0.85em; opacity: 0.7; margin-top: 5px;">At least one player must join to start</p>`;
        }
    } else if (game.status === 'active') {
        const qNum = game.currentQuestion;
        const responses = game.responses[qNum] || {};
        const responseCount = Object.keys(responses).length;
        const joinedCount = joinedPlayers.length;

        html += `<div style="background: var(--overlay-bg); padding: 15px; border-radius: 10px; margin: 15px 0;">`;
        html += `<p style="margin-bottom: 10px;">Responses received: <strong>${responseCount}/${joinedCount}</strong></p>`;

        // Show who has responded
        if (responseCount > 0) {
            html += `<p style="font-size: 0.85em; color: var(--silver);">Answered: ${Object.keys(responses).join(', ')}</p>`;
        }

        // Show who hasn't responded yet
        const notResponded = joinedPlayers.filter(p => !responses[p]);
        if (notResponded.length > 0) {
            html += `<p style="font-size: 0.85em; opacity: 0.7; margin-top: 5px;">Waiting on: ${notResponded.join(', ')}</p>`;
        }
        html += `</div>`;

        html += `<button class="btn btn-gold" onclick="triviaRevealResponses()">Reveal Responses for Q${game.currentQuestion}</button>`;
        html += `<p style="font-size: 0.85em; opacity: 0.7; margin-top: 5px;">You can reveal responses even if not everyone has answered</p>`;
    } else if (game.status === 'reviewing') {
        html += renderTriviaResponseReview();
        if (game.currentQuestion < totalQuestions) {
            html += `<button class="btn btn-gold" onclick="triviaShowQuestion(${game.currentQuestion + 1})" style="margin-top: 15px;">Next Question (Q${game.currentQuestion + 1})</button>`;
        } else {
            html += `<button class="btn btn-gold" onclick="triviaComplete()" style="margin-top: 15px;">Finish Trivia & Show Results</button>`;
        }
    } else if (game.status === 'complete') {
        html += '<p style="color: var(--gold);">Trivia is complete! Results are displayed to all players.</p>';
    }

    container.innerHTML = html;
}

function renderTriviaResponseReview() {
    const game = getTriviaGame();
    const qNum = game.currentQuestion;
    const responses = game.responses[qNum] || {};
    const question = game.questions[qNum - 1];
    const hasOptions = question.options && question.options.length > 0;

    let html = `<div style="background: var(--overlay-bg); padding: 15px; border-radius: 10px; margin: 15px 0;">`;
    html += `<h5 style="color: var(--gold); margin-bottom: 10px;">Q${qNum}: ${question.text}</h5>`;
    html += `<p style="font-size: 0.85em; color: var(--silver); margin-bottom: 15px;">Point value: ${question.pointValue}${question.category ? ` | Category: ${question.category}` : ''}</p>`;

    // Show correct answer for multiple choice
    if (hasOptions && question.correctAnswer) {
        html += `<div style="background: rgba(46, 204, 113, 0.2); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #2ecc71;">
            <strong style="color: #2ecc71;">Correct Answer:</strong> ${question.correctAnswer}. ${question.options[question.correctAnswer - 1]}
        </div>`;
    }

    const playerList = getPlayerList();

    if (Object.keys(responses).length === 0) {
        html += '<p style="opacity: 0.7;">No responses submitted yet</p>';
    } else {
        html += '<div style="display: grid; gap: 10px;">';
        playerList.forEach(player => {
            const resp = responses[player];
            if (!resp) return;

            const approvedClass = resp.approved ? 'style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71;"' : 'style="background: rgba(231, 76, 60, 0.1);"';

            // Format answer display for multiple choice
            let answerDisplay = resp.answer || '(no answer)';
            if (hasOptions && resp.answer) {
                const optIdx = parseInt(resp.answer) - 1;
                if (question.options[optIdx]) {
                    answerDisplay = `${resp.answer}. ${question.options[optIdx]}`;
                }
            }

            html += `
                <div ${approvedClass} style="padding: 10px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <strong>${player}</strong>
                            <p style="margin: 5px 0; font-style: italic;">"${answerDisplay}"</p>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn ${resp.approved ? 'btn-gold' : ''}" onclick="triviaApproveAnswer(${qNum}, '${player.replace(/'/g, "\\'")}', true)"
                                    style="padding: 6px 12px; font-size: 0.85em;">Approve</button>
                            <button class="btn" onclick="triviaApproveAnswer(${qNum}, '${player.replace(/'/g, "\\'")}', false)"
                                    style="padding: 6px 12px; font-size: 0.85em; ${!resp.approved ? 'background: var(--accent-red);' : ''}">Deny</button>
                            <label style="display: flex; align-items: center; gap: 5px; font-size: 0.85em;">
                                <input type="checkbox" ${resp.bonus ? 'checked' : ''} onchange="triviaToggleBonus(${qNum}, '${player.replace(/'/g, "\\'")}')">
                                +1 Bonus
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function triviaShowQuestion(qNum) {
    const game = getTriviaGame();
    game.currentQuestion = qNum;
    game.status = 'active';
    if (!game.responses[qNum]) {
        game.responses[qNum] = {};
    }
    saveTriviaGame(game);
    renderTriviaGameControls();
    renderTriviaPage(); // Refresh player view
}

function triviaRevealResponses() {
    const game = getTriviaGame();
    game.status = 'reviewing';
    saveTriviaGame(game);
    renderTriviaGameControls();
}

function triviaApproveAnswer(qNum, player, approved) {
    const game = getTriviaGame();
    if (game.responses[qNum] && game.responses[qNum][player]) {
        game.responses[qNum][player].approved = approved;
        saveTriviaGame(game);
        renderTriviaGameControls();
    }
}

function triviaToggleBonus(qNum, player) {
    const game = getTriviaGame();
    if (game.responses[qNum] && game.responses[qNum][player]) {
        game.responses[qNum][player].bonus = !game.responses[qNum][player].bonus;
        saveTriviaGame(game);
        renderTriviaGameControls();
    }
}

function triviaComplete() {
    const game = getTriviaGame();
    game.status = 'complete';
    saveTriviaGame(game);
    renderTriviaGameControls();
    renderTriviaPage();
}

function resetTriviaGame() {
    if (confirm('Are you sure you want to reset trivia? All responses and joined players will be cleared but questions will be kept.')) {
        const game = getTriviaGame();
        game.currentQuestion = 0;
        game.status = 'waiting';
        game.responses = {};
        game.joinedPlayers = {};
        saveTriviaGame(game);
        alert('Trivia has been reset!');
        renderTriviaGameControls();
        renderTriviaPage();
    }
}

// Player joins trivia lobby
function joinTriviaLobby() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }

    const game = getTriviaGame();
    if (!game.joinedPlayers) {
        game.joinedPlayers = {};
    }
    game.joinedPlayers[user] = { joinedAt: Date.now() };
    saveTriviaGame(game);
}

// Player trivia view
function renderTriviaPage() {
    const container = document.getElementById('triviaPlayerView');
    if (!container) return;

    const user = getCurrentUser();
    const game = getTriviaGame();
    const admin = isAdmin();

    // Player stats header
    let html = '';

    if (user) {
        const playerPoints = calculatePlayerPoints();
        const userTotal = playerPoints[user] ? playerPoints[user].total : 0;

        // Find leader
        let leaderPoints = 0;
        Object.values(playerPoints).forEach(p => {
            if (p.total > leaderPoints) leaderPoints = p.total;
        });
        const behindLeader = leaderPoints - userTotal;

        // Trivia performance
        const triviaPoints = calculateTriviaPlayerPoints();
        const myTriviaPoints = triviaPoints[user] || 0;
        const possiblePoints = getTotalPossibleTriviaPoints();

        html += `
            <div class="trivia-stats-header" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px;">
                <div class="stat-card">
                    <h4>Weekend Total</h4>
                    <div class="value">${userTotal}</div>
                </div>
                <div class="stat-card">
                    <h4>Behind Leader</h4>
                    <div class="value" style="color: ${behindLeader > 0 ? 'var(--accent-red)' : 'var(--gold)'};">${behindLeader > 0 ? '-' + behindLeader : 'Leading!'}</div>
                </div>
                <div class="stat-card">
                    <h4>Trivia Score</h4>
                    <div class="value">${myTriviaPoints}/${possiblePoints}</div>
                </div>
            </div>
        `;
    }

    // Game state display
    if (game.status === 'waiting') {
        const joinedPlayers = Object.keys(game.joinedPlayers || {});
        const hasJoined = user && joinedPlayers.includes(user);

        html += `
            <div class="trivia-waiting" style="text-align: center; padding: 40px 20px;">
                <h2 style="color: var(--gold);">Welcome to Trivia!</h2>
        `;

        if (!user) {
            html += `<p style="margin-top: 15px; color: var(--accent-red);">Please log in to join trivia.</p>`;
        } else if (hasJoined) {
            html += `
                <div style="margin: 20px 0; padding: 15px; background: rgba(46, 204, 113, 0.2); border-radius: 10px; border: 2px solid #2ecc71;">
                    <p style="font-size: 1.2em; color: #2ecc71;">You're in!</p>
                    <p style="margin-top: 10px; opacity: 0.8;">Waiting for the admin to start the game...</p>
                </div>
            `;
        } else {
            html += `
                <p style="margin-top: 15px; opacity: 0.8;">Join the game to participate!</p>
                <button class="btn btn-gold" onclick="joinTriviaLobby()" style="margin-top: 15px; font-size: 1.1em; padding: 15px 40px;">Join Trivia</button>
            `;
        }

        // Show who's in the lobby
        if (joinedPlayers.length > 0) {
            html += `
                <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--silver);">
                    <p style="font-size: 0.9em; color: var(--silver); margin-bottom: 10px;">Players in lobby (${joinedPlayers.length}):</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
            `;
            joinedPlayers.forEach(player => {
                const isMe = player === user;
                html += `<span style="background: ${isMe ? 'var(--gold)' : 'var(--overlay-bg)'}; color: ${isMe ? 'var(--primary-dark)' : 'inherit'}; padding: 5px 12px; border-radius: 20px; font-size: 0.9em;">${player}${isMe ? ' (You)' : ''}</span>`;
            });
            html += `</div></div>`;
        }

        html += `</div>`;
    } else if (game.status === 'active') {
        const qNum = game.currentQuestion;
        const question = game.questions[qNum - 1];
        const existingAnswer = game.responses[qNum] && game.responses[qNum][user] ? game.responses[qNum][user].answer : '';
        const hasSubmitted = game.responses[qNum] && game.responses[qNum][user];
        const hasOptions = question.options && question.options.length > 0;

        html += `
            <div class="trivia-question-display" style="background: var(--overlay-bg); padding: 20px; border-radius: 10px; border-left: 4px solid var(--gold);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                    <span style="color: var(--gold); font-weight: bold;">Question ${qNum} of ${game.questions.length}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${question.category ? `<span style="background: var(--accent-red); padding: 3px 10px; border-radius: 12px; font-size: 0.8em;">${question.category}</span>` : ''}
                        <span style="color: var(--silver); font-size: 0.9em;">${question.pointValue} point${question.pointValue > 1 ? 's' : ''}</span>
                    </div>
                </div>
                <h3 style="margin-bottom: 20px; line-height: 1.4;">${question.text}</h3>
        `;

        if (hasOptions) {
            // Multiple choice question
            html += `<div class="trivia-options" style="display: grid; gap: 10px; margin-bottom: 15px;">`;
            question.options.forEach((option, idx) => {
                const optNum = idx + 1;
                const isSelected = existingAnswer === String(optNum);
                html += `
                    <button class="trivia-option-btn ${isSelected ? 'selected' : ''}"
                            onclick="selectTriviaOption(${optNum})"
                            ${hasSubmitted ? 'disabled' : ''}
                            style="background: ${isSelected ? 'var(--gold)' : 'var(--card-bg)'};
                                   color: ${isSelected ? 'var(--primary-dark)' : 'var(--text-primary)'};
                                   border: 2px solid ${isSelected ? 'var(--gold)' : 'var(--card-border)'};
                                   padding: 15px 20px; border-radius: 10px; text-align: left; cursor: pointer;
                                   font-size: 1em; transition: all 0.2s;">
                        <span style="font-weight: bold; margin-right: 10px;">${optNum}.</span> ${option}
                    </button>
                `;
            });
            html += `</div>`;
            html += `<input type="hidden" id="triviaAnswerInput" value="${existingAnswer}">`;
            html += `
                <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 10px;">
                    ${hasSubmitted
                        ? '<span style="color: var(--gold);">Answer submitted!</span>'
                        : '<button class="btn btn-gold" onclick="submitTriviaAnswer()">Submit Answer</button>'}
                </div>
            `;
        } else {
            // Open-ended question
            html += `
                <div>
                    <textarea id="triviaAnswerInput" placeholder="Type your answer..." maxlength="255"
                              style="width: 100%; padding: 12px; border: none; border-radius: 8px; min-height: 80px; font-size: 1em;"
                              ${hasSubmitted ? 'disabled' : ''}>${existingAnswer}</textarea>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <small style="opacity: 0.6;">Max 255 characters</small>
                        ${hasSubmitted
                            ? '<span style="color: var(--gold);">Answer submitted!</span>'
                            : '<button class="btn btn-gold" onclick="submitTriviaAnswer()">Submit Answer</button>'}
                    </div>
                </div>
            `;
        }

        html += `</div>`;
    } else if (game.status === 'reviewing') {
        const qNum = game.currentQuestion;
        const question = game.questions[qNum - 1];
        const myResponse = game.responses[qNum] && game.responses[qNum][user];
        const hasOptions = question.options && question.options.length > 0;

        // Format answer for display
        let answerDisplay = myResponse ? myResponse.answer : '(none)';
        if (hasOptions && myResponse && myResponse.answer) {
            const optIdx = parseInt(myResponse.answer) - 1;
            if (question.options[optIdx]) {
                answerDisplay = `${myResponse.answer}. ${question.options[optIdx]}`;
            }
        }

        html += `
            <div class="trivia-reviewing" style="text-align: center; padding: 30px 20px;">
                ${question.category ? `<p style="margin-bottom: 10px;"><span style="background: var(--accent-red); padding: 3px 10px; border-radius: 12px; font-size: 0.85em;">${question.category}</span></p>` : ''}
                <h3 style="color: var(--gold);">Q${qNum}: ${question.text}</h3>
                <p style="margin: 15px 0;">Your answer: <strong>"${answerDisplay}"</strong></p>
                ${myResponse && myResponse.approved
                    ? '<p style="color: #2ecc71;"><strong>Correct!</strong></p>'
                    : '<p style="opacity: 0.7;">Waiting for admin to review answers...</p>'}
            </div>
        `;
    } else if (game.status === 'complete') {
        // Show final results
        const triviaPoints = calculateTriviaPlayerPoints();
        const sorted = Object.entries(triviaPoints).sort((a, b) => b[1] - a[1]);

        html += `
            <div class="trivia-complete" style="text-align: center; padding: 20px;">
                <h2 style="color: var(--gold); margin-bottom: 20px;">Trivia Complete!</h2>

                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sorted.forEach(([player, points], idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const isMe = player === user;
            html += `
                <tr ${isMe ? 'style="background: rgba(201, 162, 39, 0.2);"' : ''}>
                    <td class="${rankClass}">${rank}</td>
                    <td>${player}${isMe ? ' (You)' : ''}</td>
                    <td>${points}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>

                <a href="/leaderboard" class="btn btn-gold" style="margin-top: 25px; display: inline-block;">See Final Weekend Results</a>
            </div>
        `;
    }

    container.innerHTML = html;
}

function selectTriviaOption(optNum) {
    const input = document.getElementById('triviaAnswerInput');
    if (input) {
        input.value = optNum;
    }
    // Update visual selection
    document.querySelectorAll('.trivia-option-btn').forEach((btn, idx) => {
        const isSelected = idx + 1 === optNum;
        btn.classList.toggle('selected', isSelected);
        btn.style.background = isSelected ? 'var(--gold)' : 'var(--card-bg)';
        btn.style.color = isSelected ? 'var(--primary-dark)' : 'var(--text-primary)';
        btn.style.borderColor = isSelected ? 'var(--gold)' : 'var(--card-border)';
    });
}

function submitTriviaAnswer() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }

    const input = document.getElementById('triviaAnswerInput');
    const answer = input ? input.value.trim() : '';

    const game = getTriviaGame();
    const qNum = game.currentQuestion;
    const question = game.questions[qNum - 1];

    if (!game.responses[qNum]) {
        game.responses[qNum] = {};
    }

    // For multiple choice, auto-approve if correct
    let approved = false;
    if (question.options && question.options.length > 0 && question.correctAnswer) {
        approved = parseInt(answer) === question.correctAnswer;
    }

    game.responses[qNum][user] = {
        answer: answer.substring(0, 255), // Enforce max length
        approved: approved,
        bonus: false
    };

    saveTriviaGame(game);
    renderTriviaPage();
}

// Calculate all player points
function calculatePlayerPoints() {
    const playerList = getPlayerList();
    const playerPoints = {};

    playerList.forEach(player => {
        playerPoints[player] = { golf: 0, beer: 0, gokart: 0, trivia: 0, predictions: 0, total: 0 };
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

    // Trivia points (from new question-based system)
    const triviaPlayerPoints = calculateTriviaPlayerPoints();
    Object.keys(triviaPlayerPoints).forEach(player => {
        if (playerPoints[player]) {
            playerPoints[player].trivia = triviaPlayerPoints[player];
        }
    });

    // Prediction points
    const predictionPlayerPoints = calculatePredictionPoints();
    Object.keys(predictionPlayerPoints).forEach(player => {
        if (playerPoints[player]) {
            playerPoints[player].predictions = predictionPlayerPoints[player];
        }
    });

    // Calculate totals
    Object.keys(playerPoints).forEach(player => {
        playerPoints[player].total =
            playerPoints[player].golf +
            playerPoints[player].beer +
            playerPoints[player].gokart +
            playerPoints[player].trivia +
            playerPoints[player].predictions;
    });

    return playerPoints;
}

// Leaderboard rendering
function renderLeaderboards() {
    renderPodium();
    renderOverallLeaderboard();
    renderCumulativeChart();
    renderGolfLeaderboard();
    renderBeerOlympicsLeaderboard();
    renderGokartLeaderboard();
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
            <td>${points.predictions}</td>
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
    const completed = getCompletedEvents();

    // Determine how many events to show (only completed ones)
    const allEvents = ['Start', 'Golf', 'Beer', 'Karts', 'Trivia'];
    let eventsToShow = ['Start'];
    if (completed.golf) eventsToShow.push('Golf');
    if (completed.beer) eventsToShow.push('Beer');
    if (completed.gokart) eventsToShow.push('Karts');
    if (completed.trivia) eventsToShow.push('Trivia');

    // If no events completed yet, show placeholder
    if (eventsToShow.length === 1) {
        container.innerHTML = '<h3 style="color: var(--gold); margin-bottom: 15px;">Cumulative Score Progression</h3><p style="text-align: center; opacity: 0.7;">Chart will populate as events are completed</p>';
        return;
    }

    if (players.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No data to display</p>';
        return;
    }

    // Calculate cumulative scores after each event (only for completed events)
    const chartData = players.map(player => {
        const pts = playerPoints[player];
        const scores = [0];
        if (completed.golf) scores.push(pts.golf);
        if (completed.beer) scores.push(pts.golf + pts.beer);
        if (completed.gokart) scores.push(pts.golf + pts.beer + pts.gokart);
        if (completed.trivia) scores.push(pts.total);
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

function renderBeerOlympicsLeaderboard() {
    const tbody = document.querySelector('#beerOlympicsLeaderboard tbody');
    if (!tbody) return;

    const playerList = getPlayerList();
    const beerTeams = getBeerTeams();
    const beerScores = getBeerScores();

    const playerGamePoints = {};
    playerList.forEach(player => {
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
    const userPoints = playerPoints[user] || { golf: 0, beer: 0, gokart: 0, trivia: 0, predictions: 0, total: 0 };

    // Get user's teams
    const golfTeams = getGolfTeams();
    const beerTeams = getBeerTeams();

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
    html += `<div class="stat-card"><h4>Beer</h4><div class="value">${userPoints.beer}</div></div>`;
    html += `<div class="stat-card"><h4>Karts</h4><div class="value">${userPoints.gokart}</div></div>`;
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

    // Beer Olympics teams
    for (let game = 1; game <= 5; game++) {
        const teams = beerTeams[game] || {};
        Object.keys(teams).forEach(teamNum => {
            if (teams[teamNum].includes(user)) {
                hasAssignments = true;
                html += `<div class="schedule-item"><h4>Beer Olympics Game ${game} - Team ${teamNum}</h4><p>${teams[teamNum].join(', ')}</p></div>`;
            }
        });
    }

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

// ===== PREDICTIONS SYSTEM =====

function getPredictions() {
    const data = dataCache.predictions || {};
    return {
        items: data.items || [],
        maxPredictions: data.maxPredictions || 16
    };
}

function savePredictions(predictions) {
    writeToFirebase('predictions', predictions);
}

// Calculate prediction points for all players
function calculatePredictionPoints() {
    const predictions = getPredictions();
    const playerList = getPlayerList();
    const playerPoints = {};

    // Initialize all players with 0
    playerList.forEach(player => {
        playerPoints[player] = 0;
    });

    // Sum up points from finalized predictions
    predictions.items.forEach(prediction => {
        if (prediction.finalized && prediction.correctAnswer) {
            const responses = prediction.responses || {};
            Object.keys(responses).forEach(playerName => {
                if (responses[playerName] === prediction.correctAnswer && playerPoints.hasOwnProperty(playerName)) {
                    playerPoints[playerName] += prediction.pointValue || 1;
                }
            });
        }
    });

    return playerPoints;
}

// Get unanswered predictions for a user
function getUnansweredPredictions(userName) {
    const predictions = getPredictions();
    return predictions.items.filter(p => {
        const responses = p.responses || {};
        return !p.finalized && !responses[userName];
    });
}

// Check if user has answered a prediction
function hasAnsweredPrediction(predictionId, userName) {
    const predictions = getPredictions();
    const prediction = predictions.items.find(p => p.id === predictionId);
    if (!prediction) return false;
    const responses = prediction.responses || {};
    return responses.hasOwnProperty(userName);
}

// Submit prediction answer
function submitPredictionAnswer(predictionId, answer) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }

    const predictions = getPredictions();
    const predictionIndex = predictions.items.findIndex(p => p.id === predictionId);

    if (predictionIndex === -1) {
        alert('Prediction not found');
        return;
    }

    const prediction = predictions.items[predictionIndex];

    // Check if already answered
    if (prediction.responses && prediction.responses[user]) {
        alert('You have already answered this prediction');
        return;
    }

    // Double opt-in confirmation
    if (!confirm(`Are you sure you want to select "${answer}"?\n\nThis cannot be changed!`)) {
        return;
    }
    if (!confirm(`Final confirmation: Lock in "${answer}" as your answer?`)) {
        return;
    }

    // Save the answer
    if (!prediction.responses) {
        prediction.responses = {};
    }
    prediction.responses[user] = answer;
    predictions.items[predictionIndex] = prediction;
    savePredictions(predictions);
}

// Admin: Create new prediction
function createPrediction(question, type, options, pointValue) {
    const predictions = getPredictions();

    if (predictions.items.length >= predictions.maxPredictions) {
        alert(`Maximum of ${predictions.maxPredictions} predictions reached`);
        return false;
    }

    const newPrediction = {
        id: Date.now().toString(),
        question: question,
        type: type, // 'whoDoneIt' or 'custom'
        options: options,
        pointValue: pointValue || 1,
        responses: {},
        correctAnswer: null,
        finalized: false,
        createdAt: Date.now()
    };

    predictions.items.push(newPrediction);
    savePredictions(predictions);
    return true;
}

// Admin: Finalize prediction with correct answer
function finalizePrediction(predictionId, correctAnswer) {
    const predictions = getPredictions();
    const predictionIndex = predictions.items.findIndex(p => p.id === predictionId);

    if (predictionIndex === -1) {
        alert('Prediction not found');
        return;
    }

    if (!confirm(`Set "${correctAnswer}" as the correct answer and finalize this prediction?`)) {
        return;
    }

    predictions.items[predictionIndex].correctAnswer = correctAnswer;
    predictions.items[predictionIndex].finalized = true;
    savePredictions(predictions);
    alert('Prediction finalized! Points have been awarded.');
}

// Admin: Delete prediction
function deletePrediction(predictionId) {
    if (!confirm('Are you sure you want to delete this prediction?')) {
        return;
    }

    const predictions = getPredictions();
    predictions.items = predictions.items.filter(p => p.id !== predictionId);
    savePredictions(predictions);
}

// Render predictions banner (shown when user has unanswered predictions)
function updatePredictionsBanner() {
    const user = getCurrentUser();
    const existingBanner = document.getElementById('predictionsBanner');

    // Remove existing banner if present
    if (existingBanner) {
        existingBanner.remove();
    }

    if (!user) return;

    const unanswered = getUnansweredPredictions(user);
    if (unanswered.length === 0) return;

    // Don't show on predictions page
    const currentPath = window.location.pathname;
    if (currentPath === '/predictions' || currentPath === '/predictions.html') return;

    // Create banner
    const banner = document.createElement('div');
    banner.id = 'predictionsBanner';
    banner.className = 'predictions-banner';
    banner.innerHTML = `
        <span>You have ${unanswered.length} unanswered prediction${unanswered.length > 1 ? 's' : ''}!</span>
        <a href="/predictions" class="btn btn-small btn-gold">Make Predictions</a>
    `;

    // Insert after user header
    const container = document.getElementById('mainContainer');
    const userHeader = document.getElementById('userHeader');
    if (container && userHeader) {
        userHeader.insertAdjacentElement('afterend', banner);
    }
}

// Render predictions page for players
function renderPredictionsPage() {
    const container = document.getElementById('predictionsContainer');
    if (!container) return;

    const user = getCurrentUser();
    const predictions = getPredictions();
    const playerList = getPlayerList();

    if (!user) {
        container.innerHTML = '<div class="placeholder-box"><p>Please log in to view predictions</p></div>';
        return;
    }

    if (predictions.items.length === 0) {
        container.innerHTML = '<div class="placeholder-box"><p>No predictions yet. Check back soon!</p></div>';
        return;
    }

    let html = '';

    // Separate active and finalized predictions
    const activePredictions = predictions.items.filter(p => !p.finalized);
    const finalizedPredictions = predictions.items.filter(p => p.finalized);

    // Active predictions
    if (activePredictions.length > 0) {
        html += '<div class="section-card"><h2>Active Predictions</h2>';
        activePredictions.forEach(prediction => {
            html += renderPredictionCard(prediction, user, playerList);
        });
        html += '</div>';
    }

    // Finalized predictions
    if (finalizedPredictions.length > 0) {
        html += '<div class="section-card"><h2>Completed Predictions</h2>';
        finalizedPredictions.forEach(prediction => {
            html += renderPredictionCard(prediction, user, playerList);
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

function renderPredictionCard(prediction, user, playerList) {
    const responses = prediction.responses || {};
    const hasAnswered = responses.hasOwnProperty(user);
    const userAnswer = responses[user];
    const isFinalized = prediction.finalized;
    const correctAnswer = prediction.correctAnswer;
    const isCorrect = hasAnswered && userAnswer === correctAnswer;

    let statusClass = '';
    let statusText = '';

    if (isFinalized) {
        if (hasAnswered) {
            statusClass = isCorrect ? 'prediction-correct' : 'prediction-incorrect';
            statusText = isCorrect ? `+${prediction.pointValue} pts` : 'Incorrect';
        } else {
            statusClass = 'prediction-missed';
            statusText = 'Not answered';
        }
    } else if (hasAnswered) {
        statusClass = 'prediction-answered';
        statusText = 'Locked in';
    }

    let html = `
        <div class="prediction-card ${statusClass}">
            <div class="prediction-header">
                <h4>${prediction.question}</h4>
                <span class="prediction-points">${prediction.pointValue} pt${prediction.pointValue > 1 ? 's' : ''}</span>
            </div>
    `;

    if (isFinalized) {
        // Show correct answer
        html += `<p class="correct-answer-display">Correct Answer: <strong>${correctAnswer}</strong></p>`;
        if (hasAnswered) {
            html += `<p class="your-answer">Your answer: <strong>${userAnswer}</strong> ${isCorrect ? '✓' : '✗'}</p>`;
        }
    } else if (!hasAnswered) {
        // Show voting options
        html += '<div class="prediction-options">';
        prediction.options.forEach(option => {
            html += `<button class="prediction-option-btn" onclick="submitPredictionAnswer('${prediction.id}', '${option.replace(/'/g, "\\'")}')">${option}</button>`;
        });
        html += '</div>';
    } else {
        // User has answered, show their answer
        html += `<p class="your-answer">Your answer: <strong>${userAnswer}</strong></p>`;
    }

    // Collapsible responses section (only show if user has answered or prediction is finalized)
    if (hasAnswered || isFinalized) {
        const responseCount = Object.keys(responses).length;
        html += `
            <details class="prediction-responses">
                <summary>See all responses (${responseCount})</summary>
                <div class="responses-list">
        `;

        // Group by answer
        const answerGroups = {};
        prediction.options.forEach(opt => {
            answerGroups[opt] = [];
        });
        Object.keys(responses).forEach(player => {
            const ans = responses[player];
            if (!answerGroups[ans]) answerGroups[ans] = [];
            answerGroups[ans].push(player);
        });

        prediction.options.forEach(option => {
            const voters = answerGroups[option] || [];
            const isCorrectOption = isFinalized && option === correctAnswer;
            html += `
                <div class="response-group ${isCorrectOption ? 'correct-option' : ''}">
                    <span class="response-option">${option}${isCorrectOption ? ' ✓' : ''}</span>
                    <span class="response-voters">${voters.length > 0 ? voters.join(', ') : 'No votes'}</span>
                </div>
            `;
        });

        html += '</div></details>';
    }

    html += '</div>';
    return html;
}

// Admin: Render predictions management
function renderPredictionsAdmin() {
    const container = document.getElementById('predictionsAdminContainer');
    if (!container) return;

    const predictions = getPredictions();
    const playerList = getPlayerList();

    let html = `
        <div class="admin-section">
            <h2 style="color: var(--gold); border-bottom-color: var(--gold);">Create New Prediction</h2>
            <div style="display: grid; gap: 15px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Question</label>
                    <input type="text" id="newPredictionQuestion" placeholder="Who will win the golf tournament?"
                           style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Type</label>
                    <select id="newPredictionType" onchange="updatePredictionOptionsInput()"
                            style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                        <option value="whoDoneIt">Who Done It (12 Players)</option>
                        <option value="custom">Custom Options</option>
                    </select>
                </div>
                <div id="customOptionsContainer" style="display: none;">
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Custom Options (one per line)</label>
                    <textarea id="newPredictionOptions" placeholder="Option 1&#10;Option 2" rows="4"
                              style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;"></textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; color: var(--silver);">Point Value</label>
                    <input type="number" id="newPredictionPoints" value="1" min="1" max="10"
                           style="width: 100px; padding: 12px; border: none; border-radius: 5px; font-size: 1em;">
                </div>
                <button class="btn btn-gold" onclick="handleCreatePrediction()">Create Prediction</button>
            </div>
            <p style="margin-top: 10px; font-size: 0.85em; opacity: 0.7;">
                ${predictions.items.length}/${predictions.maxPredictions} predictions created
            </p>
        </div>
    `;

    // List existing predictions
    if (predictions.items.length > 0) {
        html += '<div class="admin-section" style="margin-top: 20px;">';
        html += '<h2 style="color: var(--gold); border-bottom-color: var(--gold);">Manage Predictions</h2>';

        predictions.items.forEach(prediction => {
            const responseCount = Object.keys(prediction.responses || {}).length;
            const isFinalized = prediction.finalized;

            html += `
                <div class="prediction-admin-card" style="background: var(--overlay-bg); padding: 15px; border-radius: 10px; margin-bottom: 15px; ${isFinalized ? 'opacity: 0.7;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h4 style="color: var(--gold); margin-bottom: 5px;">${prediction.question}</h4>
                            <p style="font-size: 0.85em; opacity: 0.7;">
                                Type: ${prediction.type === 'whoDoneIt' ? 'Who Done It' : 'Custom'} |
                                Points: ${prediction.pointValue} |
                                Responses: ${responseCount}/12
                                ${isFinalized ? ' | <span style="color: #2ecc71;">Finalized</span>' : ''}
                            </p>
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            `;

            if (!isFinalized) {
                html += `
                    <select id="finalize_${prediction.id}" style="padding: 8px; border-radius: 5px; border: none;">
                        <option value="">Select correct answer...</option>
                        ${prediction.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                    <button class="btn btn-small btn-gold" onclick="handleFinalizePrediction('${prediction.id}')">Finalize</button>
                    <button class="btn btn-small" onclick="deletePrediction('${prediction.id}')" style="background: var(--accent-red);">Delete</button>
                `;
            } else {
                html += `<span style="padding: 8px; color: #2ecc71;">Answer: ${prediction.correctAnswer}</span>`;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

function updatePredictionOptionsInput() {
    const type = document.getElementById('newPredictionType').value;
    const customContainer = document.getElementById('customOptionsContainer');
    customContainer.style.display = type === 'custom' ? 'block' : 'none';
}

function handleCreatePrediction() {
    const question = document.getElementById('newPredictionQuestion').value.trim();
    const type = document.getElementById('newPredictionType').value;
    const pointValue = parseInt(document.getElementById('newPredictionPoints').value) || 1;

    if (!question) {
        alert('Please enter a question');
        return;
    }

    let options;
    if (type === 'whoDoneIt') {
        options = getPlayerList();
    } else {
        const optionsText = document.getElementById('newPredictionOptions').value.trim();
        options = optionsText.split('\n').map(o => o.trim()).filter(o => o);
        if (options.length < 2) {
            alert('Please enter at least 2 options');
            return;
        }
    }

    if (createPrediction(question, type, options, pointValue)) {
        document.getElementById('newPredictionQuestion').value = '';
        document.getElementById('newPredictionOptions').value = '';
        document.getElementById('newPredictionPoints').value = '1';
        alert('Prediction created!');
    }
}

function handleFinalizePrediction(predictionId) {
    const select = document.getElementById(`finalize_${predictionId}`);
    const correctAnswer = select.value;

    if (!correctAnswer) {
        alert('Please select the correct answer');
        return;
    }

    finalizePrediction(predictionId, correctAnswer);
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
            writeToFirebase('gokartPoints', DEFAULT_GOKART_POINTS);
            writeToFirebase('triviaPoints', DEFAULT_TRIVIA_POINTS);
            writeToFirebase('bonusPoints', DEFAULT_BONUS_POINTS);
            writeToFirebase('golfTeams', {});
            writeToFirebase('golfHoleScores', {});
            writeToFirebase('golfShotguns', {});
            writeToFirebase('golfBonuses', { bestFront: '', bestBack: '', overallWinner: '' });
            writeToFirebase('golfScoringEnabled', {});
            writeToFirebase('beerTeams', {1: {}, 2: {}, 3: {}, 4: {}, 5: {}});
            writeToFirebase('beerScores', {1: {}, 2: {}, 3: {}, 4: {}, 5: {}});
            writeToFirebase('gokartResults', {});
            writeToFirebase('triviaGame', DEFAULT_TRIVIA_GAME);
            writeToFirebase('siteSettings', DEFAULT_SITE_SETTINGS);
            writeToFirebase('predictions', DEFAULT_PREDICTIONS);

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

    // Apply site settings to hero on all pages
    applyHeroSettings();

    if (path === '/' || path === '/index.html') {
        renderPlayerGrid();
    }

    if (path === '/admin' || path === '/admin.html') {
        renderPlayerList();
        renderSiteSettings();
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

    if (path === '/gokarting' || path === '/gokarting.html') {
        renderGokartPointDisplay();
        renderGokartPointConfig();
        renderGokartScoringAdmin();
        renderGokartResultsTable();
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
