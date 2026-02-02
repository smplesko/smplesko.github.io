// Dird Plesk Memorial - Utility Functions
// Shared helpers with no dependencies on other modules

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
    return '<tr><td colspan="' + colspan + '" style="text-align: center; opacity: 0.7;">' + message + '</td></tr>';
}
