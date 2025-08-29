// Socket.io client for Hex Game Multiplayer
let socket = null;
let currentGame = null;
let currentGameId = null;
let isMyTurn = false;
let myPlayerNumber = null;
let waitingGameId = null;

// Initialize socket connection
function initSocket() {
    if (socket) return;
    
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        hideError();
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showError('Connection lost. Please refresh the page.');
    });
    
    // Queue events
    socket.on('queue-joined', (data) => {
        document.getElementById('queue-position').textContent = data.position;
        document.getElementById('queue-status').classList.remove('hidden');
    });
    
    // Game events
    socket.on('game-started', (data) => {
        handleGameStarted(data);
    });
    
    socket.on('game-created', (data) => {
        handleGameCreated(data);
    });
    
    socket.on('lobby-created', (data) => {
        handleLobbyCreated(data);
    });
    
    socket.on('player-joined-lobby', (data) => {
        handlePlayerJoinedLobby(data);
    });
    
    socket.on('joined-game', (data) => {
        handleJoinedGame(data);
    });
    
    socket.on('move-made', (data) => {
        handleMoveMade(data);
    });
    
    socket.on('game-ended', (data) => {
        handleGameEnded(data);
    });
    
    socket.on('player-disconnected', (data) => {
        showStatus(`${data.playerName} disconnected from the game`);
    });
    
    // Analysis events
    socket.on('hints-received', (data) => {
        showHints(data.hints);
    });
    
    socket.on('analysis-received', (data) => {
        showAnalysis(data.analysis);
    });
    
    // Error handling
    socket.on('error', (data) => {
        showError(data.message);
    });
}

// Screen navigation functions
function showMainMenu() {
    hideAllScreens();
    document.getElementById('menu-screen').classList.add('active');
    if (socket) {
        socket.emit('leave-queue');
    }
    document.getElementById('queue-status').classList.add('hidden');
}

function showQuickMatchScreen() {
    hideAllScreens();
    document.getElementById('quickmatch-screen').classList.add('active');
    initSocket();
}

function showCreateGameScreen() {
    hideAllScreens();
    document.getElementById('creategame-screen').classList.add('active');
    initSocket();
}

function showJoinGameScreen() {
    hideAllScreens();
    document.getElementById('joingame-screen').classList.add('active');
    initSocket();
}

function showPracticeScreen() {
    hideAllScreens();
    document.getElementById('practice-screen').classList.add('active');
    initSocket();
}

function showGameScreen() {
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
}

// Game functions
function joinQueue() {
    const playerName = document.getElementById('player-name').value.trim();
    const boardSize = parseInt(document.getElementById('board-size').value);
    const boardShape = document.getElementById('board-shape').value;
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    socket.emit('join-queue', {
        playerName: playerName,
        boardSize: boardSize,
        boardShape: boardShape
    });
}

function leaveQueue() {
    socket.emit('leave-queue');
    document.getElementById('queue-status').classList.add('hidden');
}

function createGame() {
    const playerName = document.getElementById('create-player-name').value.trim();
    const gameMode = document.getElementById('create-game-mode').value;
    const boardSize = parseInt(document.getElementById('create-board-size').value);
    const boardShape = document.getElementById('create-board-shape').value;
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    if (gameMode === 'human-vs-human') {
        // Create multiplayer lobby
        socket.emit('create-lobby', {
            playerName: playerName,
            boardSize: boardSize,
            boardShape: boardShape
        });
    } else {
        // Create AI game
        const aiDifficulty = document.getElementById('create-ai-difficulty').value;
        socket.emit('create-game', {
            playerName: playerName,
            gameMode: gameMode,
            boardSize: boardSize,
            boardShape: boardShape,
            aiDifficulty: gameMode.includes('hard') ? 'hard' : aiDifficulty
        });
    }
}

function joinGame() {
    const playerName = document.getElementById('join-player-name').value.trim();
    const gameId = document.getElementById('game-id').value.trim();
    
    if (!playerName || !gameId) {
        showError('Please enter your name and game ID');
        return;
    }
    
    socket.emit('join-game', {
        playerName: playerName,
        gameId: gameId
    });
}

function startPractice() {
    const playerName = document.getElementById('practice-player-name').value.trim();
    const aiDifficulty = document.getElementById('ai-difficulty').value;
    const boardSize = parseInt(document.getElementById('practice-board-size').value);
    
    if (!playerName) {
        showError('Please enter your name');
        return;
    }
    
    socket.emit('create-game', {
        playerName: playerName,
        gameMode: aiDifficulty === 'hard' ? 'human-vs-ai-hard' : 'human-vs-ai',
        boardSize: boardSize,
        boardShape: 'hexagon',
        aiDifficulty: aiDifficulty
    });
}

function makeMove(row, col) {
    if (!isMyTurn || !currentGameId) {
        return;
    }
    
    socket.emit('make-move', {
        gameId: currentGameId,
        row: row,
        col: col
    });
}

function getHints() {
    if (!currentGameId) return;
    
    socket.emit('get-hints', {
        gameId: currentGameId,
        count: 3
    });
}

function analyzePosition() {
    if (!currentGameId) return;
    
    socket.emit('analyze-position', {
        gameId: currentGameId
    });
}

// Game event handlers
function handleGameStarted(data) {
    currentGameId = data.gameId;
    currentGame = data.gameState;
    
    // Determine my player number based on socket ID
    if (data.playerIds) {
        const mySocketId = socket.id;
        myPlayerNumber = data.playerIds.indexOf(mySocketId) + 1;
    } else {
        myPlayerNumber = 1; // Default for AI games
    }
    
    document.getElementById('player1-name').textContent = data.players[0].name;
    document.getElementById('player2-name').textContent = data.players[1].name;
    
    isMyTurn = data.gameState.currentPlayer === myPlayerNumber;
    
    // Hide any waiting displays
    document.getElementById('game-created-status').classList.add('hidden');
    document.getElementById('queue-status').classList.add('hidden');
    
    showGameScreen();
    renderBoard(data.gameState);
    updateGameStatus(data.gameState);
    
    showStatus(`Game started! Playing on ${data.boardSize}x${data.boardSize} ${data.boardShape} board`);
}

function handleGameCreated(data) {
    currentGameId = data.gameId;
    currentGame = data.gameState;
    myPlayerNumber = 1;
    isMyTurn = data.gameState.currentPlayer === myPlayerNumber;
    
    showGameScreen();
    renderBoard(data.gameState);
    updateGameStatus(data.gameState);
    
    showStatus(`Game created! Game ID: ${data.gameId}`);
}

function handleJoinedGame(data) {
    currentGameId = data.gameId;
    currentGame = data.gameState;
    
    if (data.isSpectator) {
        myPlayerNumber = null;
        isMyTurn = false;
        showStatus('Joined as spectator');
    } else {
        myPlayerNumber = 2;
        isMyTurn = data.gameState.currentPlayer === myPlayerNumber;
    }
    
    showGameScreen();
    renderBoard(data.gameState);
    updateGameStatus(data.gameState);
}

function handleMoveMade(data) {
    currentGame = data.gameState;
    isMyTurn = data.gameState.currentPlayer === myPlayerNumber;
    
    renderBoard(data.gameState);
    updateGameStatus(data.gameState);
    
    if (data.result.gameOver) {
        handleGameEnded({
            winner: data.result.winner,
            gameState: data.gameState
        });
    }
}

function handleGameEnded(data) {
    if (data.winner) {
        const winnerName = data.winner.name;
        showStatus(`🎉 Game Over! ${winnerName} wins!`);
    } else {
        showStatus('Game ended');
    }
    
    isMyTurn = false;
}

// Board rendering
function renderBoard(gameState) {
    const boardContainer = document.getElementById('hex-board');
    const board = gameState.boardState;
    const size = board.length;
    
    boardContainer.innerHTML = '';
    boardContainer.style.gridTemplateColumns = `repeat(${size}, 30px)`;
    
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement('div');
            cell.className = 'hex-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (board[row][col] === 1) {
                cell.classList.add('player1');
                cell.textContent = 'X';
            } else if (board[row][col] === 2) {
                cell.classList.add('player2');
                cell.textContent = 'O';
            }
            
            if (board[row][col] === 0 && isMyTurn) {
                cell.addEventListener('click', () => makeMove(row, col));
            }
            
            boardContainer.appendChild(cell);
        }
    }
}

function updateGameStatus(gameState) {
    const currentPlayerElement = document.getElementById('current-player');
    if (gameState.currentPlayerName) {
        currentPlayerElement.textContent = gameState.currentPlayerName;
    }
    
    if (isMyTurn && myPlayerNumber) {
        showStatus('Your turn - click on an empty cell to make your move');
    } else if (myPlayerNumber) {
        showStatus(`Waiting for ${gameState.currentPlayerName}'s move...`);
    } else {
        showStatus(`${gameState.currentPlayerName}'s turn`);
    }
}

// Utility functions
function showStatus(message) {
    document.getElementById('status-message').textContent = message;
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorElement.classList.remove('hidden');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showHints(hints) {
    let message = 'Move suggestions:\n';
    hints.forEach((hint, index) => {
        message += `${index + 1}. Row ${hint.row}, Col ${hint.col} (Score: ${hint.score.toFixed(2)}) - ${hint.explanation}\n`;
    });
    alert(message);
}

function showAnalysis(analysis) {
    let message = `Position Analysis:\n`;
    message += `Strength: Player 1: ${analysis.strength.player1.toFixed(2)}, Player 2: ${analysis.strength.player2.toFixed(2)}\n`;
    message += `Advantage: ${analysis.advantage > 0 ? 'Player 1' : 'Player 2'} (+${Math.abs(analysis.advantage).toFixed(2)})\n`;
    message += `Phase: ${analysis.phase}\n`;
    message += `Total moves: ${analysis.totalMoves}`;
    alert(message);
}

function handleLobbyCreated(data) {
    waitingGameId = data.gameId;
    
    document.getElementById('created-game-id').textContent = data.gameId;
    document.getElementById('game-created-status').classList.remove('hidden');
    
    showStatus(`Lobby created! Share the Game ID: ${data.gameId}`);
}

function handlePlayerJoinedLobby(data) {
    if (waitingGameId === data.gameId) {
        document.getElementById('waiting-message').textContent = `${data.playerName} joined! Starting game...`;
    }
}

function copyGameId() {
    const gameId = document.getElementById('created-game-id').textContent;
    navigator.clipboard.writeText(gameId).then(() => {
        showStatus('Game ID copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = gameId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatus('Game ID copied to clipboard!');
    });
}

function cancelWaitingGame() {
    if (waitingGameId) {
        socket.emit('cancel-lobby', { gameId: waitingGameId });
        waitingGameId = null;
    }
    document.getElementById('game-created-status').classList.add('hidden');
    showMainMenu();
}

function toggleAIDifficulty() {
    const gameMode = document.getElementById('create-game-mode').value;
    const aiGroup = document.getElementById('ai-difficulty-group');
    
    if (gameMode === 'human-vs-human') {
        aiGroup.style.display = 'none';
    } else {
        aiGroup.style.display = 'block';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    showMainMenu();
    // Initialize AI difficulty toggle
    setTimeout(() => {
        if (document.getElementById('create-game-mode')) {
            toggleAIDifficulty();
        }
    }, 100);
});