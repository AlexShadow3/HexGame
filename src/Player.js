/**
 * Represents a player in the Hex game
 */
class Player {
    constructor(number, name, isHuman = true) {
        this.number = number;
        this.name = name;
        this.isHuman = isHuman;
        this.symbol = number === 1 ? 'X' : 'O';
        this.goal = number === 1 ? 'top to bottom' : 'left to right';
    }

    toString() {
        return `Player ${this.number} (${this.name}) - ${this.symbol} - Goal: ${this.goal}`;
    }
}

/**
 * AI Player that can make automatic moves
 */
class AIPlayer extends Player {
    constructor(number, name = 'Computer', difficulty = 'easy') {
        super(number, name, false);
        this.difficulty = difficulty;
    }

    /**
     * Make a move using AI logic
     */
    makeMove(board) {
        const emptyCells = board.getEmptyCells();
        if (emptyCells.length === 0) {
            return null;
        }

        switch (this.difficulty) {
            case 'easy':
                return this.makeRandomMove(emptyCells);
            case 'medium':
                return this.makeMediumMove(board, emptyCells);
            case 'hard':
                return this.makeMinimaxMove(board, emptyCells);
            default:
                return this.makeRandomMove(emptyCells);
        }
    }

    makeRandomMove(emptyCells) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }

    makeMediumMove(board, emptyCells) {
        // Medium AI: Try to block opponent or advance own connection
        const myNumber = this.number;
        const opponentNumber = myNumber === 1 ? 2 : 1;

        // First, check if we can win
        for (const cell of emptyCells) {
            board.makeMove(cell.row, cell.col, myNumber);
            if (board.checkWin(myNumber)) {
                board.getCell(cell.row, cell.col).player = null; // Undo move
                return cell;
            }
            board.getCell(cell.row, cell.col).player = null; // Undo move
        }

        // Second, check if we need to block opponent
        for (const cell of emptyCells) {
            board.makeMove(cell.row, cell.col, opponentNumber);
            if (board.checkWin(opponentNumber)) {
                board.getCell(cell.row, cell.col).player = null; // Undo move
                return cell;
            }
            board.getCell(cell.row, cell.col).player = null; // Undo move
        }

        // Third, try to make a strategic move
        const strategicMove = this.findStrategicMove(board, emptyCells);
        if (strategicMove) {
            return strategicMove;
        }

        // Fall back to random move
        return this.makeRandomMove(emptyCells);
    }

    findStrategicMove(board, emptyCells) {
        // Look for moves that connect to existing pieces or advance toward goal
        const myNumber = this.number;
        let bestMoves = [];

        for (const cell of emptyCells) {
            let score = 0;
            const neighbors = board.getNeighbors(cell.row, cell.col);
            
            // Prefer moves that connect to existing pieces
            for (const neighbor of neighbors) {
                if (neighbor.isOwnedBy(myNumber)) {
                    score += 10;
                }
            }

            // For player 1 (vertical connection), prefer moves closer to center columns
            // For player 2 (horizontal connection), prefer moves closer to center rows
            if (myNumber === 1) {
                score += (board.size - Math.abs(cell.col - Math.floor(board.size / 2)));
            } else {
                score += (board.size - Math.abs(cell.row - Math.floor(board.size / 2)));
            }

            if (score > 0) {
                bestMoves.push({ cell, score });
            }
        }

        if (bestMoves.length === 0) {
            return null;
        }

        // Sort by score and pick the best move
        bestMoves.sort((a, b) => b.score - a.score);
        return bestMoves[0].cell;
    }

    /**
     * Make a move using minimax algorithm with alpha-beta pruning
     */
    makeMinimaxMove(board, emptyCells) {
        if (emptyCells.length === 0) return null;
        
        // For performance, limit depth based on remaining moves
        const maxDepth = emptyCells.length > 20 ? 3 : (emptyCells.length > 10 ? 4 : 5);
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const cell of emptyCells) {
            // Make move
            board.makeMove(cell.row, cell.col, this.number);
            
            // Evaluate position
            const score = this.minimax(board, maxDepth - 1, false, -Infinity, Infinity);
            
            // Undo move
            board.getCell(cell.row, cell.col).player = null;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = cell;
            }
        }
        
        return bestMove || this.makeRandomMove(emptyCells);
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     */
    minimax(board, depth, isMaximizing, alpha, beta) {
        const gameState = this.evaluatePosition(board);
        
        // Terminal cases
        if (gameState.isTerminal || depth === 0) {
            return gameState.score;
        }
        
        const emptyCells = board.getEmptyCells();
        const currentPlayer = isMaximizing ? this.number : (this.number === 1 ? 2 : 1);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            
            for (const cell of emptyCells) {
                board.makeMove(cell.row, cell.col, currentPlayer);
                const evaluation = this.minimax(board, depth - 1, false, alpha, beta);
                board.getCell(cell.row, cell.col).player = null;
                
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return maxEval;
        } else {
            let minEval = Infinity;
            
            for (const cell of emptyCells) {
                board.makeMove(cell.row, cell.col, currentPlayer);
                const evaluation = this.minimax(board, depth - 1, true, alpha, beta);
                board.getCell(cell.row, cell.col).player = null;
                
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return minEval;
        }
    }

    /**
     * Evaluate the current board position
     */
    evaluatePosition(board) {
        // Check for immediate wins
        if (board.checkWin(this.number)) {
            return { score: 10000, isTerminal: true };
        }
        if (board.checkWin(this.number === 1 ? 2 : 1)) {
            return { score: -10000, isTerminal: true };
        }
        
        // Check for draw
        if (board.getEmptyCells().length === 0) {
            return { score: 0, isTerminal: true };
        }
        
        // Evaluate position based on connectivity and positioning
        let score = 0;
        
        // Connection strength for both players
        const myConnectivity = this.calculateConnectivity(board, this.number);
        const opponentConnectivity = this.calculateConnectivity(board, this.number === 1 ? 2 : 1);
        
        score = myConnectivity - opponentConnectivity;
        
        return { score, isTerminal: false };
    }

    /**
     * Calculate connectivity strength for a player
     */
    calculateConnectivity(board, playerNumber) {
        let connectivity = 0;
        const visited = new Set();
        
        // Find all connected components for this player
        for (let row = 0; row < board.size; row++) {
            for (let col = 0; col < board.size; col++) {
                const cell = board.getCell(row, col);
                if (cell && cell.isOwnedBy(playerNumber) && !visited.has(`${row},${col}`)) {
                    const component = this.getConnectedComponent(board, row, col, playerNumber, visited);
                    connectivity += this.evaluateComponent(component, board.size, playerNumber);
                }
            }
        }
        
        return connectivity;
    }

    /**
     * Get all cells in a connected component
     */
    getConnectedComponent(board, startRow, startCol, playerNumber, visited) {
        const component = [];
        const stack = [{ row: startRow, col: startCol }];
        
        while (stack.length > 0) {
            const { row, col } = stack.pop();
            const key = `${row},${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const cell = board.getCell(row, col);
            if (cell && cell.isOwnedBy(playerNumber)) {
                component.push({ row, col });
                
                const neighbors = board.getNeighbors(row, col);
                for (const neighbor of neighbors) {
                    if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                        stack.push({ row: neighbor.row, col: neighbor.col });
                    }
                }
            }
        }
        
        return component;
    }

    /**
     * Evaluate the strength of a connected component
     */
    evaluateComponent(component, boardSize, playerNumber) {
        if (component.length === 0) return 0;
        
        let score = component.length * 10; // Base score for size
        
        if (playerNumber === 1) {
            // Player 1 wants to connect top to bottom
            const minRow = Math.min(...component.map(c => c.row));
            const maxRow = Math.max(...component.map(c => c.row));
            const span = maxRow - minRow;
            
            // Bonus for spanning multiple rows
            score += span * 50;
            
            // Bonus for reaching edges
            if (minRow === 0) score += 100; // Touching top
            if (maxRow === boardSize - 1) score += 100; // Touching bottom
        } else {
            // Player 2 wants to connect left to right
            const minCol = Math.min(...component.map(c => c.col));
            const maxCol = Math.max(...component.map(c => c.col));
            const span = maxCol - minCol;
            
            // Bonus for spanning multiple columns
            score += span * 50;
            
            // Bonus for reaching edges
            if (minCol === 0) score += 100; // Touching left
            if (maxCol === boardSize - 1) score += 100; // Touching right
        }
        
        return score;
    }
}

module.exports = { Player, AIPlayer };