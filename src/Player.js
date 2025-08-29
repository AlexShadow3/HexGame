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
}

module.exports = { Player, AIPlayer };