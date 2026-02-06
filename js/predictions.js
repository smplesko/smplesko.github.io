// Dird Plesk Memorial - Predictions Module
// Predictions CRUD, admin UI, player page, banner notifications
// Depends on: utils.js, firebase.js, auth.js

// ===== PREDICTIONS SYSTEM =====

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

// Submit prediction answer
function submitPredictionAnswer(predictionId, answer) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please log in first', 'warning');
        return;
    }

    const predictions = getPredictions();
    const predictionIndex = predictions.items.findIndex(p => p.id === predictionId);

    if (predictionIndex === -1) {
        showToast('Prediction not found', 'error');
        return;
    }

    const prediction = predictions.items[predictionIndex];

    // Check if already answered
    if (prediction.responses && prediction.responses[user]) {
        showToast('You have already answered this prediction', 'warning');
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
        showToast(`Maximum of ${predictions.maxPredictions} predictions reached`, 'warning');
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
        showToast('Prediction not found', 'error');
        return;
    }

    if (!confirm(`Set "${correctAnswer}" as the correct answer and finalize this prediction?`)) {
        return;
    }

    predictions.items[predictionIndex].correctAnswer = correctAnswer;
    predictions.items[predictionIndex].finalized = true;
    savePredictions(predictions);
    showToast('Prediction finalized! Points have been awarded.', 'success');
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
    if (isPage('predictions')) return;

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
        showToast('Please enter a question', 'warning');
        return;
    }

    let options;
    if (type === 'whoDoneIt') {
        options = getPlayerList();
    } else {
        const optionsText = document.getElementById('newPredictionOptions').value.trim();
        options = optionsText.split('\n').map(o => o.trim()).filter(o => o);
        if (options.length < 2) {
            showToast('Please enter at least 2 options', 'warning');
            return;
        }
    }

    if (createPrediction(question, type, options, pointValue)) {
        document.getElementById('newPredictionQuestion').value = '';
        document.getElementById('newPredictionOptions').value = '';
        document.getElementById('newPredictionPoints').value = '1';
        showToast('Prediction created!', 'success');
    }
}

function handleFinalizePrediction(predictionId) {
    const select = document.getElementById(`finalize_${predictionId}`);
    const correctAnswer = select.value;

    if (!correctAnswer) {
        showToast('Please select the correct answer', 'warning');
        return;
    }

    finalizePrediction(predictionId, correctAnswer);
}

