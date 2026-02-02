// Dird Plesk Memorial - Trivia Module
// Trivia game engine, admin controls, player view, CSV import
// Depends on: utils.js, firebase.js, auth.js

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

    let html = '';

    // Trivia description field
    html += `
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; color: var(--silver);">Trivia Description (shown to players)</label>
            <input type="text" id="triviaDescriptionInput" value="${game.description || ''}" placeholder="e.g., 16 rounds of trivia covering sports, history, and pop culture"
                   style="width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 1em;"
                   onchange="saveTriviaDescription()">
        </div>
    `;

    html += '<h4 style="color: var(--gold); margin-bottom: 15px;">Trivia Questions (max 16)</h4>';

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

    // Show trivia description if set
    let html = '';
    if (game.description) {
        html += `<div class="section-card" style="margin-bottom: 15px;"><p style="opacity: 0.85;">${game.description}</p></div>`;
    }

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
