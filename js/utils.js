// Dird Plesk Memorial - Utility Functions
// Shared helpers - depends on config.js for APP_CONFIG

// ===== INPUT VALIDATION =====

// Validation bounds constants
const VALIDATION_BOUNDS = {
    points: { min: 0, max: 100 },      // Point values per position
    score: { min: 0, max: 1000 },      // Individual/team scores
    bonusPoints: { min: 0, max: 50 },  // Bonus point awards
    shotguns: { min: 0, max: 18 },     // Shotgun count (max holes)
    rounds: { min: 1, max: 20 },       // Event round count
    teams: { min: 2, max: 12 },        // Team count
    players: { min: 2, max: 20 },      // Player count
    triviaPoints: { min: 1, max: 10 }, // Trivia question points
    predictionPoints: { min: 1, max: 10 } // Prediction question points
};

// Generic number validator - returns clamped value or default
function validateNumber(value, min, max, defaultVal) {
    const num = parseInt(value);
    if (isNaN(num)) return defaultVal !== undefined ? defaultVal : min;
    return Math.max(min, Math.min(max, num));
}

// Validate point values (0-100)
function validatePoints(value) {
    return validateNumber(value, VALIDATION_BOUNDS.points.min, VALIDATION_BOUNDS.points.max, 0);
}

// Validate scores (0-1000)
function validateScore(value) {
    return validateNumber(value, VALIDATION_BOUNDS.score.min, VALIDATION_BOUNDS.score.max, 0);
}

// Validate bonus points (0-50)
function validateBonusPoints(value) {
    return validateNumber(value, VALIDATION_BOUNDS.bonusPoints.min, VALIDATION_BOUNDS.bonusPoints.max, 0);
}

// Validate shotgun count (0-18)
function validateShotgunCount(value) {
    return validateNumber(value, VALIDATION_BOUNDS.shotguns.min, VALIDATION_BOUNDS.shotguns.max, 0);
}

// Validate round count (1-20)
function validateRoundCount(value) {
    return validateNumber(value, VALIDATION_BOUNDS.rounds.min, VALIDATION_BOUNDS.rounds.max, 1);
}

// Validate team count (2-12)
function validateTeamCount(value) {
    return validateNumber(value, VALIDATION_BOUNDS.teams.min, VALIDATION_BOUNDS.teams.max, 2);
}

// Validate player count against allowed values
function validatePlayerCount(value) {
    const allowed = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20];
    const num = parseInt(value);
    if (isNaN(num) || !allowed.includes(num)) return 12;
    return num;
}

// Validate trivia/prediction points (1-10)
function validateQuestionPoints(value) {
    return validateNumber(value, VALIDATION_BOUNDS.triviaPoints.min, VALIDATION_BOUNDS.triviaPoints.max, 1);
}

// Validate position (1 to MAX_PLAYERS)
function validatePosition(value, maxPositions) {
    maxPositions = maxPositions || 12;
    return validateNumber(value, 1, maxPositions, 0);
}

// Validate admin slot is within player count
function validateAdminSlot(value, playerCount) {
    playerCount = playerCount || 12;
    return validateNumber(value, 1, playerCount, 1);
}

// ===== SITE PASSWORD GATE =====
// Password validation (runs after config.js is loaded)
function checkSitePassword() {
    const input = document.getElementById('sitePassword');
    const error = document.getElementById('siteGateError');
    const STORAGE_KEY = 'siteAccessGranted';

    if (input.value.toLowerCase() === APP_CONFIG.sitePassword) {
        // Correct password - remember and show content
        localStorage.setItem(STORAGE_KEY, 'true');
        showSiteContent();
    } else {
        // Wrong password
        error.style.display = 'block';
        input.value = '';
        input.focus();
    }
}

// Ordinal suffix helper (1st, 2nd, 3rd, etc.)
function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ===== THEME MANAGEMENT =====

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

// ===== PAGE ROUTING HELPERS =====

// Check if current page matches name (handles both /page and /page.html)
function isPage(name, path) {
    const p = path || window.location.pathname;
    return p === '/' + name || p === '/' + name + '.html';
}

// Check if on home page
function isHomePage(path) {
    const p = path || window.location.pathname;
    return p === '/' || p === '/index.html';
}

// ===== UI HELPERS =====

// Show save error banner (used by Firebase write failures)
function showSaveError() {
    // Avoid duplicate error banners
    if (document.getElementById('saveErrorBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'saveErrorBanner';
    banner.className = 'status-message error';
    banner.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1001; max-width: 400px; width: 90%;';
    banner.textContent = 'Failed to save. Check your connection and try again.';
    document.body.appendChild(banner);
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 5000);
}

// Mobile-friendly checkbox group for team selection
// Note: depends on getPlayerList() from firebase.js (resolved at call time)
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

// ===== TABLE BUILDERS =====

// Build tbody HTML for a ranked Rank/Player/Points table
// sortedEntries: [[name, points], ...] pre-sorted descending
// options.highlightPlayer: player name to highlight with "(You)" label
function buildRankedTableBody(sortedEntries, options) {
    var highlightPlayer = options && options.highlightPlayer;
    return sortedEntries.map(function(entry, idx) {
        var name = entry[0], points = entry[1];
        var rank = idx + 1;
        var rankClass = rank <= 3 ? 'rank-' + rank : '';
        var isHighlighted = highlightPlayer && name === highlightPlayer;
        var highlightStyle = isHighlighted ? ' style="background: rgba(201, 162, 39, 0.2);"' : '';
        var displayName = isHighlighted ? name + ' (You)' : name;
        return '<tr' + highlightStyle + '><td class="' + rankClass + '">' + rank + '</td><td>' + displayName + '</td><td>' + points + '</td></tr>';
    }).join('');
}

// Build a "no data" placeholder row for tables
function emptyTableRow(colspan, message) {
    return '<tr><td colspan="' + colspan + '" class="text-center text-muted">' + message + '</td></tr>';
}

// ===== DATE/TIME FORMATTING =====

// Unified date/time formatter for schedule displays
// Options:
//   shortWeekday: false = "Saturday" (default), true = "Sat"
function formatDateTime(date, time, options) {
    if (!date) return '';
    options = options || {};
    const shortWeekday = options.shortWeekday || false;

    const d = new Date(date + 'T00:00:00');
    const dateOptions = {
        weekday: shortWeekday ? 'short' : 'long',
        month: 'short',
        day: 'numeric'
    };
    let display = d.toLocaleDateString('en-US', dateOptions);

    if (time) {
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        display += ` @ ${h12}:${minutes} ${ampm}`;
    }
    return display;
}

// ===== TOAST NOTIFICATION SYSTEM =====

// Show a non-blocking toast notification
// Types: 'success' (green), 'error' (red), 'warning' (yellow), 'info' (blue)
function showToast(message, type, duration) {
    type = type || 'success';
    duration = duration || 3000;

    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    // Icon based on type
    const icons = {
        success: '&#10003;',
        error: '&#10007;',
        warning: '&#9888;',
        info: '&#8505;'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-visible'), 10);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);

    return toast;
}

// Confirmation dialog replacement for critical actions
// Returns a Promise that resolves to true/false
function showConfirm(message, options) {
    options = options || {};
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.innerHTML = `
            <div class="confirm-content">
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn" onclick="this.closest('.confirm-modal').dataset.result='false'; this.closest('.confirm-modal').remove()">
                        ${options.cancelText || 'Cancel'}
                    </button>
                    <button class="btn btn-gold" onclick="this.closest('.confirm-modal').dataset.result='true'; this.closest('.confirm-modal').remove()">
                        ${options.confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        `;

        // Handle click outside to cancel
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.dataset.result = 'false';
                modal.remove();
            }
        });

        // Observe removal to resolve promise
        const observer = new MutationObserver(() => {
            if (!document.contains(modal)) {
                observer.disconnect();
                resolve(modal.dataset.result === 'true');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        document.body.appendChild(modal);
    });
}
