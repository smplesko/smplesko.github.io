// Dird Plesk Memorial - Authentication & User Management
// Login, logout, admin check, password modal, UI state
// Depends on: firebase.js (for getPlayerBySlot)

// ===== CURRENT USER MANAGEMENT =====

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

// ===== PASSWORD MODAL =====

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

// ===== UI STATE =====

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
