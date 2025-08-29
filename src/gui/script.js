class HexGameClient {
    constructor() {
        this.gameId = null;
        this.gameState = null;
        this.isProcessing = false;
        
        this.initializeEventListeners();
        this.showScreen('menu-screen');
    }

    initializeEventListeners() {
        // Menu screen
        document.getElementById('start-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('show-rules').addEventListener('click', () => this.showScreen('rules-screen'));
        
        // Rules screen
        document.getElementById('back-from-rules').addEventListener('click', () => this.showScreen('menu-screen'));
        
        // Game screen
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('menu-screen'));
        
        // Game over screen
        document.getElementById('play-again').addEventListener('click', () => this.startNewGame());
        document.getElementById('back-to-menu-final').addEventListener('click', () => this.showScreen('menu-screen'));
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
    }

    showLoading(show = true) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    async startNewGame() {
        const gameMode = document.getElementById('game-mode').value;
        const boardSize = parseInt(document.getElementById('board-size').value);
        
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/new-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameMode: gameMode,
                    boardSize: boardSize
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameId = data.gameId;
                this.gameState = data.gameState;
                this.updateGameUI();
                this.showScreen('game-screen');
                
                // If AI vs AI, start the AI game loop
                if (gameMode === 'ai-vs-ai') {
                    this.startAIGameLoop();
                }
                // If it's human vs AI and AI goes first
                else if (gameMode === 'human-vs-ai' && !this.gameState.currentPlayerIsHuman) {
                    setTimeout(() => this.makeAIMove(), 1000);
                }
            } else {
                alert('Failed to start game: ' + data.message);
            }
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game. Please try again.');
        }
        
        this.showLoading(false);
    }

    async makeMove(row, col) {
        if (this.isProcessing || this.gameState.gameOver) {
            return;
        }

        this.isProcessing = true;
        
        try {
            const response = await fetch('/api/make-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameId: this.gameId,
                    row: row,
                    col: col
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.gameState = data.gameState;
                this.updateGameUI();
                
                // Check for game over
                if (this.gameState.gameOver) {
                    setTimeout(() => this.showGameOver(), 1000);
                } else {
                    // If it's now AI's turn, make AI move
                    if (!this.gameState.currentPlayerIsHuman && this.gameState.gameMode !== 'human-vs-human') {
                        setTimeout(() => this.makeAIMove(), 1000);
                    }
                }
            } else {
                alert('Invalid move: ' + data.message);
            }
        } catch (error) {
            console.error('Error making move:', error);
            alert('Failed to make move. Please try again.');
        }
        
        this.isProcessing = false;
    }

    async makeAIMove() {
        if (this.gameState.gameOver) {
            return;
        }

        this.showLoading(true);
        
        try {
            const response = await fetch('/api/get-ai-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameId: this.gameId
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.move) {
                // Make the AI move
                await this.makeMove(data.move.row, data.move.col);
            } else {
                console.error('AI move failed:', data.message);
            }
        } catch (error) {
            console.error('Error getting AI move:', error);
        }
        
        this.showLoading(false);
    }

    async startAIGameLoop() {
        while (!this.gameState.gameOver) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for viewing
            if (!this.gameState.gameOver) {
                await this.makeAIMove();
            }
        }
    }

    updateGameUI() {
        if (!this.gameState) return;

        // Update player information
        this.updatePlayerInfo();
        
        // Update board
        this.renderBoard();
        
        // Update status
        this.updateGameStatus();
    }

    updatePlayerInfo() {
        const player1Element = document.getElementById('player1');
        const player2Element = document.getElementById('player2');
        const currentPlayerElement = document.getElementById('current-player');
        
        // Update player names
        player1Element.querySelector('.player-name').textContent = this.gameState.players[0].name;
        player2Element.querySelector('.player-name').textContent = this.gameState.players[1].name;
        
        // Update current player indicator
        player1Element.classList.toggle('active', this.gameState.currentPlayer === 1);
        player2Element.classList.toggle('active', this.gameState.currentPlayer === 2);
        
        currentPlayerElement.textContent = this.gameState.currentPlayerName;
    }

    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        const boardSize = this.gameState.boardSize;
        
        for (let row = 0; row < boardSize; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'board-row';
            
            for (let col = 0; col < boardSize; col++) {
                const cellElement = document.createElement('div');
                cellElement.className = 'hex-cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                const cellValue = this.gameState.board[row][col];
                
                if (cellValue === 1) {
                    cellElement.classList.add('player1', 'occupied');
                    cellElement.innerHTML = '<div class="hex-cell-content">X</div>';
                } else if (cellValue === 2) {
                    cellElement.classList.add('player2', 'occupied');
                    cellElement.innerHTML = '<div class="hex-cell-content">O</div>';
                } else {
                    // Empty cell - add click listener if it's human's turn
                    if (this.gameState.currentPlayerIsHuman && !this.gameState.gameOver) {
                        cellElement.addEventListener('click', (e) => {
                            const row = parseInt(e.target.dataset.row);
                            const col = parseInt(e.target.dataset.col);
                            this.makeMove(row, col);
                        });
                    }
                }
                
                rowElement.appendChild(cellElement);
            }
            
            boardElement.appendChild(rowElement);
        }
    }

    updateGameStatus() {
        const statusElement = document.getElementById('status-message');
        const moveCountElement = document.getElementById('move-count');
        
        moveCountElement.textContent = `Moves: ${this.gameState.moveHistory.length}`;
        
        if (this.gameState.gameOver) {
            const winner = this.gameState.players.find(p => p.number === this.gameState.winner);
            statusElement.textContent = `🎉 ${winner.name} wins!`;
        } else if (this.gameState.currentPlayerIsHuman) {
            statusElement.textContent = 'Click on an empty cell to make your move';
        } else {
            statusElement.textContent = 'Computer is thinking...';
        }
    }

    showGameOver() {
        if (!this.gameState.gameOver) return;
        
        const winner = this.gameState.players.find(p => p.number === this.gameState.winner);
        const titleElement = document.getElementById('game-over-title');
        const messageElement = document.getElementById('game-over-message');
        
        titleElement.textContent = '🎉 Game Over!';
        messageElement.textContent = `${winner.name} wins by connecting their path!`;
        
        this.showScreen('game-over-screen');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HexGameClient();
});