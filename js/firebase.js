// Dird Plesk Memorial - Firebase & Data Layer
// Firebase init, data cache, defaults, listeners, and all data accessors
// Depends on: utils.js (for showSaveError, applyTheme)

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
    triviaPoints: null,
    bonusPoints: null,
    golfTeams: null,
    golfHoleScores: null,
    golfShotguns: null,
    golfBonuses: null,
    golfScoringEnabled: null,
    customEvents: null,
    triviaGame: null,
    siteSettings: null,
    predictions: null
};

let firebaseReady = false;

// ===== CONFIGURATION CONSTANTS =====
const MAX_PLAYERS = 12;
const HOLE_COUNT = 18;
const MAX_TRIVIA_QUESTIONS = 16;
const MAX_PREDICTIONS = 16;

// ===== DEFAULT DATA =====

// Player structure: MAX_PLAYERS slots with display names
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

// Default point values for ranking-based events (12 positions)
function getDefaultPositionPoints() {
    return { 1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6, 11: 5, 12: 4 };
}

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
        trivia: false,
        predictions: false
    },
    golfSettings: {
        format: 'Scramble',
        scoringType: 'Stableford',
        description: ''
    }
};

// Default trivia game settings
const DEFAULT_TRIVIA_GAME = {
    questions: [],
    currentQuestion: 0,
    status: 'waiting',
    responses: {},
    joinedPlayers: {},  // Track who has joined the trivia lobby
    maxQuestions: MAX_TRIVIA_QUESTIONS,
    description: ''  // Optional sub-description shown on trivia page
};

// Default predictions settings
const DEFAULT_PREDICTIONS = {
    items: [],
    maxPredictions: MAX_PREDICTIONS
};

// ===== FIREBASE DATA SYNC =====
const firebaseListenerPaths = [];

function setupFirebaseListeners() {
    const paths = [
        { path: 'players', default: DEFAULT_PLAYERS },
        { path: 'triviaPoints', default: DEFAULT_TRIVIA_POINTS },
        { path: 'bonusPoints', default: DEFAULT_BONUS_POINTS },
        { path: 'golfTeams', default: {} },
        { path: 'golfHoleScores', default: {} },
        { path: 'golfShotguns', default: {} },
        { path: 'golfBonuses', default: { bestFront: '', bestBack: '', overallWinner: '' } },
        { path: 'golfScoringEnabled', default: {} },
        { path: 'customEvents', default: {} },
        { path: 'triviaGame', default: DEFAULT_TRIVIA_GAME },
        { path: 'siteSettings', default: DEFAULT_SITE_SETTINGS },
        { path: 'predictions', default: DEFAULT_PREDICTIONS }
    ];

    paths.forEach(({ path, default: defaultVal }) => {
        firebaseListenerPaths.push(path);
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

// Clean up Firebase listeners on page unload to prevent memory leaks
function cleanupFirebaseListeners() {
    firebaseListenerPaths.forEach(path => {
        db.ref(path).off();
    });
}

window.addEventListener('beforeunload', cleanupFirebaseListeners);

// Called when Firebase data changes - refresh relevant UI
// Note: render functions are defined in app.js (loaded after this file)
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

    // Update events page
    if (path === 'customEvents' && (currentPath === '/events' || currentPath === '/events.html')) {
        renderEventsPage();
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
        if (path === 'customEvents') renderCustomEventsAdmin();
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

// Write data to Firebase with error handling
function writeToFirebase(path, data) {
    db.ref(path).set(data).catch((error) => {
        console.error(`Firebase write failed for ${path}:`, error);
        showSaveError();
    });
}

// Initialize data - sets up Firebase listeners and theme
function initData() {
    setupFirebaseListeners();
    // Initialize theme (stays in localStorage - device specific)
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'dark');
    }
    applyTheme();
}

// ===== DATA ACCESSORS =====

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

function getCustomEvents() {
    return dataCache.customEvents || {};
}

function saveCustomEvents(events) {
    writeToFirebase('customEvents', events);
}

function getTriviaPoints() {
    return dataCache.triviaPoints || DEFAULT_TRIVIA_POINTS;
}

function getBonusPoints() {
    return dataCache.bonusPoints || DEFAULT_BONUS_POINTS;
}

// All golf state in one call - use destructuring at call site:
// const { teams, holeScores, shotguns, bonuses, scoringEnabled } = getGolfData();
function getGolfData() {
    return {
        teams: dataCache.golfTeams || {},
        holeScores: dataCache.golfHoleScores || {},
        shotguns: dataCache.golfShotguns || {},
        bonuses: dataCache.golfBonuses || { bestFront: '', bestBack: '', overallWinner: '' },
        scoringEnabled: dataCache.golfScoringEnabled || {}
    };
}

// Individual accessors (convenience for callers that only need one piece)
function getGolfTeams() { return getGolfData().teams; }
function getGolfHoleScores() { return getGolfData().holeScores; }
function getGolfShotguns() { return getGolfData().shotguns; }
function getGolfBonuses() { return getGolfData().bonuses; }
function getGolfScoringEnabled() { return getGolfData().scoringEnabled; }

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
        maxQuestions: game.maxQuestions || MAX_TRIVIA_QUESTIONS,
        description: game.description || ''
    };
}

function saveTriviaGame(game) {
    writeToFirebase('triviaGame', game);
}

function saveTriviaDescription() {
    const input = document.getElementById('triviaDescriptionInput');
    if (!input) return;
    const game = getTriviaGame();
    game.description = input.value.trim();
    saveTriviaGame(game);
}

// Determine which events have data (completed)
function getCompletedEvents() {
    const completed = { golf: false, trivia: false };

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

    // Custom events: check each for any round results
    const customEvents = getCustomEvents();
    Object.values(customEvents).forEach(event => {
        const hasResults = Object.values(event.rounds || {}).some(round =>
            round.results && Object.keys(round.results).length > 0
        );
        if (hasResults) {
            completed[event.id] = true;
        }
    });

    // Trivia: Check if game is complete or has any points
    const triviaGame = getTriviaGame();
    if (triviaGame.status === 'complete') {
        completed.trivia = true;
    }

    return completed;
}

// Calculate golf team total from hole scores
function calculateGolfTeamTotal(teamNum) {
    const holeScores = getGolfHoleScores();
    const teamScores = holeScores[teamNum] || {};
    const shotguns = getGolfShotguns();
    const bonusPoints = getBonusPoints();

    let total = 0;
    for (let hole = 1; hole <= HOLE_COUNT; hole++) {
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

// Predictions data accessors
function getPredictions() {
    const data = dataCache.predictions || {};
    return {
        items: data.items || [],
        maxPredictions: data.maxPredictions || MAX_PREDICTIONS
    };
}

function savePredictions(predictions) {
    writeToFirebase('predictions', predictions);
}
