const { HexBoard } = require('./HexBoard');
const { Player, AIPlayer } = require('./Player');

/**
 * Main game class that manages the Hex game state and flow
 */
class HexGame {
    constructor(boardSize = 11, gameMode = 'human-vs-human') {
        this.board = new HexBoard(boardSize);
        this.gameMode = gameMode;
        this.currentPlayerIndex = 0;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        
        this.initializePlayers();
    }

    initializePlayers() {
        this.players = [];
        
        switch (this.gameMode) {
            case 'human-vs-human':
                this.players = [
                    new Player(1, 'Player 1', true),
                    new Player(2, 'Player 2', true)
                ];
                break;
            case 'human-vs-ai':
                this.players = [
                    new Player(1, 'Human', true),
                    new AIPlayer(2, 'Computer', 'medium')
                ];
                break;
            case 'ai-vs-ai':
                this.players = [
                    new AIPlayer(1, 'Computer 1', 'medium'),
                    new AIPlayer(2, 'Computer 2', 'medium')
                ];
                break;
            default:
                throw new Error(`Unknown game mode: ${this.gameMode}`);
        }
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getOtherPlayer() {
        return this.players[1 - this.currentPlayerIndex];
    }

    /**
     * Make a move at the specified position
     */
    makeMove(row, col) {
        if (this.gameOver) {
            return { success: false, message: 'Game is already over' };
        }

        const currentPlayer = this.getCurrentPlayer();
        
        if (!this.board.isValidPosition(row, col)) {
            return { success: false, message: 'Invalid position' };
        }

        const cell = this.board.getCell(row, col);
        if (!cell.isEmpty()) {
            return { success: false, message: 'Position already occupied' };
        }

        // Make the move
        this.board.makeMove(row, col, currentPlayer.number);
        this.moveHistory.push({
            player: currentPlayer.number,
            row: row,
            col: col,
            move: this.moveHistory.length + 1
        });

        // Check for win
        if (this.board.checkWin(currentPlayer.number)) {
            this.gameOver = true;
            this.winner = currentPlayer;
            return { 
                success: true, 
                message: `${currentPlayer.name} wins!`,
                gameOver: true,
                winner: currentPlayer
            };
        }

        // Check for draw (board full)
        if (this.board.getEmptyCells().length === 0) {
            this.gameOver = true;
            return { 
                success: true, 
                message: 'Game ends in a draw!',
                gameOver: true,
                winner: null
            };
        }

        // Switch to next player
        this.switchPlayer();
        
        return { 
            success: true, 
            message: 'Move successful',
            gameOver: false
        };
    }

    /**
     * Make a move using string notation (e.g., "A1", "B5")
     */
    makeMoveFromString(moveString) {
        const parsed = this.parseMove(moveString);
        if (!parsed) {
            return { success: false, message: 'Invalid move format. Use format like A1, B5, etc.' };
        }
        return this.makeMove(parsed.row, parsed.col);
    }

    /**
     * Parse move string like "A1" to coordinates
     */
    parseMove(moveString) {
        if (!moveString || moveString.length < 2) {
            return null;
        }

        const colChar = moveString.charAt(0).toUpperCase();
        const rowString = moveString.slice(1);
        
        const col = colChar.charCodeAt(0) - 65; // A=0, B=1, etc.
        const row = parseInt(rowString) - 1; // 1-based to 0-based
        
        if (isNaN(row) || col < 0 || col >= this.board.size || row < 0 || row >= this.board.size) {
            return null;
        }
        
        return { row, col };
    }

    /**
     * Convert coordinates to string notation
     */
    coordinatesToString(row, col) {
        const colChar = String.fromCharCode(65 + col);
        const rowNum = row + 1;
        return `${colChar}${rowNum}`;
    }

    switchPlayer() {
        this.currentPlayerIndex = 1 - this.currentPlayerIndex;
    }

    /**
     * Get AI move if current player is AI
     */
    getAIMove() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer.isHuman) {
            return null;
        }
        return currentPlayer.makeMove(this.board);
    }

    /**
     * Reset the game
     */
    reset() {
        this.board = new HexBoard(this.board.size);
        this.currentPlayerIndex = 0;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
    }

    /**
     * Get game status
     */
    getStatus() {
        return {
            gameOver: this.gameOver,
            winner: this.winner,
            currentPlayer: this.getCurrentPlayer(),
            moveCount: this.moveHistory.length,
            boardSize: this.board.size,
            gameMode: this.gameMode
        };
    }

    /**
     * Get move history
     */
    getMoveHistory() {
        return [...this.moveHistory];
    }

    /**
     * Get a copy of the board state
     */
    getBoardState() {
        const state = [];
        for (let row = 0; row < this.board.size; row++) {
            state[row] = [];
            for (let col = 0; col < this.board.size; col++) {
                const cell = this.board.getCell(row, col);
                state[row][col] = cell.player;
            }
        }
        return state;
    }

    /**
     * Display the current board
     */
    displayBoard() {
        return this.board.toString();
    }

    /**
     * Display game information
     */
    displayGameInfo() {
        let info = '\n=== HEX GAME ===\n';
        info += `Board Size: ${this.board.size}x${this.board.size}\n`;
        info += `Game Mode: ${this.gameMode}\n`;
        info += `Moves Played: ${this.moveHistory.length}\n\n`;
        
        info += 'Players:\n';
        for (const player of this.players) {
            const indicator = player === this.getCurrentPlayer() ? ' <- CURRENT' : '';
            info += `  ${player.toString()}${indicator}\n`;
        }
        
        info += '\nGoals:\n';
        info += '  Player 1 (X): Connect TOP to BOTTOM\n';
        info += '  Player 2 (O): Connect LEFT to RIGHT\n\n';
        
        return info;
    }
}

module.exports = { HexGame };