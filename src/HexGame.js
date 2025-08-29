const { HexBoard } = require('./HexBoard');
const { Player, AIPlayer } = require('./Player');

/**
 * Main game class that manages the Hex game state and flow
 */
class HexGame {
    constructor(boardSize = 11, gameMode = 'human-vs-human', boardShape = 'hexagon') {
        this.board = new HexBoard(boardSize, boardShape);
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
            case 'human-vs-ai-hard':
                this.players = [
                    new Player(1, 'Human', true),
                    new AIPlayer(2, 'Computer', 'hard')
                ];
                break;
            case 'ai-vs-ai':
                this.players = [
                    new AIPlayer(1, 'Computer 1', 'medium'),
                    new AIPlayer(2, 'Computer 2', 'medium')
                ];
                break;
            case 'tournament':
                // Players will be set externally by tournament manager
                this.players = [];
                break;
            case 'online-multiplayer':
                // Players will be set externally by multiplayer server
                this.players = [];
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

    /**
     * Save game to JSON format
     */
    saveGame() {
        const gameData = {
            timestamp: new Date().toISOString(),
            boardSize: this.board.size,
            gameMode: this.gameMode,
            moveHistory: [...this.moveHistory],
            players: this.players.map(p => ({
                number: p.number,
                name: p.name,
                isHuman: p.isHuman,
                difficulty: p.difficulty || null
            })),
            gameOver: this.gameOver,
            winner: this.winner ? {
                number: this.winner.number,
                name: this.winner.name
            } : null,
            finalBoardState: this.getBoardState()
        };
        
        return JSON.stringify(gameData, null, 2);
    }

    /**
     * Load game from JSON format
     */
    static loadGame(jsonData) {
        const gameData = JSON.parse(jsonData);
        
        // Create new game with same parameters
        const game = new HexGame(gameData.boardSize, gameData.gameMode);
        
        // Restore players with same names and difficulties
        game.players = gameData.players.map(playerData => {
            if (playerData.isHuman) {
                return new Player(playerData.number, playerData.name, true);
            } else {
                const { AIPlayer } = require('./Player');
                return new AIPlayer(playerData.number, playerData.name, playerData.difficulty || 'medium');
            }
        });
        
        // Replay all moves
        for (const move of gameData.moveHistory) {
            game.makeMove(move.row, move.col);
        }
        
        return game;
    }

    /**
     * Get game replay data for step-by-step analysis
     */
    getReplayData() {
        const steps = [];
        
        // Create temporary game to replay moves
        const tempGame = new HexGame(this.board.size, this.gameMode);
        tempGame.players = [...this.players];
        
        // Add initial state
        steps.push({
            moveNumber: 0,
            boardState: tempGame.getBoardState(),
            currentPlayer: tempGame.getCurrentPlayer(),
            move: null,
            gameOver: false,
            winner: null
        });
        
        // Replay each move
        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];
            const result = tempGame.makeMove(move.row, move.col);
            
            steps.push({
                moveNumber: i + 1,
                boardState: tempGame.getBoardState(),
                currentPlayer: tempGame.getCurrentPlayer(),
                move: {
                    ...move,
                    notation: String.fromCharCode(65 + move.col) + (move.row + 1)
                },
                gameOver: result.gameOver,
                winner: result.winner
            });
        }
        
        return steps;
    }

    /**
     * Analyze game for statistics and insights
     */
    analyzeGame() {
        const analysis = {
            totalMoves: this.moveHistory.length,
            gameLength: this.gameOver ? 'completed' : 'in-progress',
            playerStats: {},
            moveAnalysis: {
                openingMoves: [],
                middleGame: [],
                endGame: []
            },
            efficiency: null
        };
        
        // Player statistics
        for (const player of this.players) {
            const playerMoves = this.moveHistory.filter(m => m.player === player.number);
            analysis.playerStats[player.number] = {
                name: player.name,
                totalMoves: playerMoves.length,
                averageTimePerMove: 'N/A', // Could be implemented with timing
                isHuman: player.isHuman,
                difficulty: player.difficulty || null
            };
        }
        
        // Move phase analysis
        const phases = Math.ceil(this.moveHistory.length / 3);
        for (let i = 0; i < this.moveHistory.length; i++) {
            const move = this.moveHistory[i];
            const notation = String.fromCharCode(65 + move.col) + (move.row + 1);
            
            if (i < phases) {
                analysis.moveAnalysis.openingMoves.push(notation);
            } else if (i < phases * 2) {
                analysis.moveAnalysis.middleGame.push(notation);
            } else {
                analysis.moveAnalysis.endGame.push(notation);
            }
        }
        
        // Game efficiency (how quickly was it decided)
        if (this.gameOver && this.winner) {
            const maxPossibleMoves = this.board.size * this.board.size;
            analysis.efficiency = {
                movesPlayed: this.moveHistory.length,
                maxPossible: maxPossibleMoves,
                efficiencyRatio: (this.moveHistory.length / maxPossibleMoves * 100).toFixed(1) + '%'
            };
        }
        
        return analysis;
    }

    /**
     * Get move hints for the current player
     */
    getMoveHints(count = 3) {
        if (this.gameOver) {
            return [];
        }

        const currentPlayer = this.getCurrentPlayer();
        const emptyCells = this.board.getEmptyCells();
        
        if (emptyCells.length === 0) {
            return [];
        }

        // Use AI to analyze best moves
        const aiAnalyzer = new AIPlayer(currentPlayer.number, 'Analyzer', 'hard');
        const hints = [];
        
        // Get evaluations for all possible moves
        for (const cell of emptyCells) {
            this.board.makeMove(cell.row, cell.col, currentPlayer.number);
            
            const evaluation = aiAnalyzer.evaluatePosition(this.board);
            const notation = String.fromCharCode(65 + cell.col) + (cell.row + 1);
            
            hints.push({
                row: cell.row,
                col: cell.col,
                notation: notation,
                score: evaluation.score,
                description: this.getHintDescription(cell, evaluation.score)
            });
            
            // Undo move
            this.board.getCell(cell.row, cell.col).player = null;
        }
        
        // Sort by score and return top hints
        hints.sort((a, b) => b.score - a.score);
        return hints.slice(0, count);
    }

    /**
     * Get description for a hint based on score and position
     */
    getHintDescription(cell, score) {
        if (score >= 10000) return "Winning move!";
        if (score >= 1000) return "Excellent strategic position";
        if (score >= 500) return "Strong connecting move";
        if (score >= 100) return "Good positional play";
        if (score >= 50) return "Reasonable move";
        if (score >= 0) return "Acceptable position";
        return "Defensive necessity";
    }

    /**
     * Analyze current position strength
     */
    analyzePosition() {
        if (this.gameOver) {
            return {
                gameStatus: 'Game Over',
                winner: this.winner?.name || 'Draw',
                analysis: 'Game has concluded'
            };
        }

        const currentPlayer = this.getCurrentPlayer();
        const opponent = this.getOtherPlayer();
        
        // Use AI to evaluate position
        const aiAnalyzer = new AIPlayer(currentPlayer.number, 'Analyzer', 'hard');
        const evaluation = aiAnalyzer.evaluatePosition(this.board);
        
        const currentConnectivity = aiAnalyzer.calculateConnectivity(this.board, currentPlayer.number);
        const opponentConnectivity = aiAnalyzer.calculateConnectivity(this.board, opponent.number);
        
        let positionAssessment;
        if (evaluation.score > 500) {
            positionAssessment = `${currentPlayer.name} has a strong advantage`;
        } else if (evaluation.score > 100) {
            positionAssessment = `${currentPlayer.name} has a slight advantage`;
        } else if (evaluation.score > -100) {
            positionAssessment = "Position is roughly equal";
        } else if (evaluation.score > -500) {
            positionAssessment = `${opponent.name} has a slight advantage`;
        } else {
            positionAssessment = `${opponent.name} has a strong advantage`;
        }
        
        return {
            gameStatus: 'In Progress',
            currentPlayer: currentPlayer.name,
            positionScore: evaluation.score,
            positionAssessment: positionAssessment,
            connectivity: {
                [currentPlayer.name]: currentConnectivity,
                [opponent.name]: opponentConnectivity
            },
            movesPlayed: this.moveHistory.length,
            emptyCells: this.board.getEmptyCells().length
        };
    }
}

module.exports = { HexGame };