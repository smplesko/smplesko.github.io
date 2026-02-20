// Dird Plesk Memorial - Firebase & Data Layer
// Firebase init, data cache, defaults, listeners, and all data accessors
// Depends on: config.js, utils.js (for showSaveError, applyTheme)

// ===== FIREBASE INITIALIZATION =====
// Configuration loaded from config.js (APP_CONFIG)
firebase.initializeApp(APP_CONFIG.firebase);
const db = firebase.database();

// ===== LOCAL DATA CACHE =====
// This cache is synced with Firebase in real-time
let dataCache = {
    players: null,
    triviaPoints: null,
    bonusPoints: null,
    golfTeams: null,
    golfScores: null,
    golfShotguns: null,
    golfScoringEnabled: null,
    golfIndividualBonuses: null,
    customEvents: null,
    triviaGame: null,
    siteSettings: null,
    predictions: null
};

let firebaseReady = false;

// ===== CONFIGURATION CONSTANTS =====
const MAX_PLAYERS = 12;
const MAX_TRIVIA_QUESTIONS = 16;
const MAX_PREDICTIONS = 16;
const DEFAULT_GOLF_BASE_POINTS = 10; // Default base points per nine when score equals par

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
    onboardingComplete: false,
    featuresEnabled: {
        golf: true,
        events: true,
        trivia: true,
        predictions: true
    },
    eventLocks: {
        golf: false,
        trivia: false,
        predictions: false
    },
    golfSettings: {
        format: 'Scramble',
        scoringType: 'Stableford',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        enabled: true,
        front9Par: 36,
        back9Par: 36,
        basePointsPer9: 10
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
    description: '',  // Optional sub-description shown on trivia page
    scheduledDate: '',
    scheduledTime: ''
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
        { path: 'golfScores', default: {} },
        { path: 'golfShotguns', default: {} },
        { path: 'golfScoringEnabled', default: {} },
        { path: 'golfIndividualBonuses', default: { longDrive: { player: '', points: 5 }, closestPin: { player: '', points: 5 } } },
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
    // Always update hero settings
    if (path === 'siteSettings') {
        applyHeroSettings();
    }

    // Update player grid and schedule on home
    if (path === 'players' && isHomePage()) {
        renderPlayerGrid();
    }
    if ((path === 'siteSettings' || path === 'triviaGame' || path === 'customEvents') && isHomePage()) {
        renderWeekendSchedule();
    }

    // Update leaderboards
    if (isPage('leaderboard')) {
        renderLeaderboards();
    }

    // Update golf scorecard
    if (path.startsWith('golf') && isPage('golf')) {
        renderGolfScorecard();
    }

    // Update events page
    if (path === 'customEvents' && isPage('events')) {
        renderEventsPage();
    }

    // Update trivia page
    if (path === 'triviaGame' && isPage('trivia')) {
        renderTriviaPage();
        if (isAdmin()) {
            renderTriviaGameControls();
        }
    }

    // Update admin page
    if (isPage('admin')) {
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
    if (path === 'predictions' && isPage('predictions')) {
        renderPredictionsPage();
    }

    // Update profile
    if (isPage('profile')) {
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
    // Create slot if it doesn't exist
    if (!players[slot]) {
        players[slot] = { name: '', isAdmin: slot === 1 };
    }
    players[slot].name = newName;
    writeToFirebase('players', players);
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
// const { teams, scores, shotguns, scoringEnabled } = getGolfData();
function getGolfData() {
    return {
        teams: dataCache.golfTeams || {},
        scores: dataCache.golfScores || {},
        shotguns: dataCache.golfShotguns || {},
        scoringEnabled: dataCache.golfScoringEnabled || {}
    };
}

// Individual accessors (convenience for callers that only need one piece)
function getGolfTeams() { return getGolfData().teams; }
function getGolfScores() { return getGolfData().scores; }
function getGolfShotguns() { return getGolfData().shotguns; }
function getGolfScoringEnabled() { return getGolfData().scoringEnabled; }
function getGolfIndividualBonuses() {
    return dataCache.golfIndividualBonuses || { longDrive: { player: '', points: 5 }, closestPin: { player: '', points: 5 } };
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
        maxQuestions: game.maxQuestions || MAX_TRIVIA_QUESTIONS,
        description: game.description || '',
        scheduledDate: game.scheduledDate || '',
        scheduledTime: game.scheduledTime || ''
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

    // Golf: Check if any team has scores entered
    const golfScores = getGolfScores();
    if (Object.keys(golfScores).length > 0) {
        for (const teamNum of Object.keys(golfScores)) {
            const ts = golfScores[teamNum] || {};
            if (ts.front9 != null && ts.front9 !== '' || ts.back9 != null && ts.back9 !== '') {
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

    // Predictions: Check if any predictions are finalized
    const predictions = getPredictions();
    const hasFinalized = predictions.items && predictions.items.some(p => p.finalized);
    if (hasFinalized) {
        completed.predictions = true;
    }

    return completed;
}

// Get golf par and scoring settings
function getGolfParSettings() {
    const settings = getSiteSettings();
    const golf = settings.golfSettings || {};
    return {
        front9Par: golf.front9Par || 36,
        back9Par: golf.back9Par || 36,
        basePointsPer9: golf.basePointsPer9 || DEFAULT_GOLF_BASE_POINTS
    };
}

// Calculate points for a nine: base points adjusted by strokes vs par
function calculateNinePoints(score, par, basePoints) {
    if (score == null || score === '') return 0;
    return basePoints - (score - par);
}

// Determine which teams win each bonus (lowest raw score wins)
// Returns arrays to handle ties — all tied teams receive the bonus
function calculateGolfBonusWinners() {
    const { teams, scores } = getGolfData();

    let bestFront = { teams: [], score: Infinity };
    let bestBack = { teams: [], score: Infinity };
    let bestOverall = { teams: [], score: Infinity };

    Object.keys(teams).forEach(teamNum => {
        const ts = scores[teamNum] || {};
        const front9 = ts.front9;
        const back9 = ts.back9;

        if (front9 != null && front9 !== '') {
            if (front9 < bestFront.score) {
                bestFront = { teams: [String(teamNum)], score: front9 };
            } else if (front9 === bestFront.score) {
                bestFront.teams.push(String(teamNum));
            }
        }

        if (back9 != null && back9 !== '') {
            if (back9 < bestBack.score) {
                bestBack = { teams: [String(teamNum)], score: back9 };
            } else if (back9 === bestBack.score) {
                bestBack.teams.push(String(teamNum));
            }
        }

        if (front9 != null && front9 !== '' && back9 != null && back9 !== '') {
            const total = front9 + back9;
            if (total < bestOverall.score) {
                bestOverall = { teams: [String(teamNum)], score: total };
            } else if (total === bestOverall.score) {
                bestOverall.teams.push(String(teamNum));
            }
        }
    });

    return {
        bestFront: bestFront.teams,
        bestBack: bestBack.teams,
        overallWinner: bestOverall.teams
    };
}

// Full breakdown of a team's golf scoring
function getGolfTeamBreakdown(teamNum) {
    const scores = getGolfScores();
    const shotguns = getGolfShotguns();
    const bonusPoints = getBonusPoints();
    const par = getGolfParSettings();
    const bonusWinners = calculateGolfBonusWinners();

    const ts = scores[teamNum] || {};
    const front9Score = ts.front9;
    const back9Score = ts.back9;

    const front9Points = calculateNinePoints(front9Score, par.front9Par, par.basePointsPer9);
    const back9Points = calculateNinePoints(back9Score, par.back9Par, par.basePointsPer9);
    const totalPoints = front9Points + back9Points;

    const teamStr = String(teamNum);
    const frontBonus = bonusWinners.bestFront.includes(teamStr) ? bonusPoints.bestFront : 0;
    const backBonus = bonusWinners.bestBack.includes(teamStr) ? bonusPoints.bestBack : 0;
    const overallBonus = bonusWinners.overallWinner.includes(teamStr) ? bonusPoints.overallWinner : 0;

    const teamShotguns = shotguns[teamNum] || 0;
    const shotgunPoints = teamShotguns * bonusPoints.shotgun;

    const grandTotal = totalPoints + frontBonus + backBonus + overallBonus + shotgunPoints;

    return {
        front9Score: front9Score,
        back9Score: back9Score,
        totalScore: (front9Score != null && front9Score !== '' ? front9Score : 0) +
                    (back9Score != null && back9Score !== '' ? back9Score : 0),
        front9Points,
        back9Points,
        totalPoints,
        frontBonus,
        backBonus,
        overallBonus,
        shotgunCount: teamShotguns,
        shotgunPoints,
        grandTotal
    };
}

// Calculate golf team grand total (used by leaderboard)
function calculateGolfTeamTotal(teamNum) {
    return getGolfTeamBreakdown(teamNum).grandTotal;
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
