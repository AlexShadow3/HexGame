/**
 * Represents a single cell in the Hex board
 */
class HexCell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.player = null; // null, 1, or 2
    }

    isEmpty() {
        return this.player === null;
    }

    isOwnedBy(playerNumber) {
        return this.player === playerNumber;
    }
}

/**
 * Represents the hexagonal game board
 */
class HexBoard {
    constructor(size = 11, shape = 'hexagon') {
        this.size = size;
        this.shape = shape;
        this.board = [];
        this.initializeBoard();
    }

    initializeBoard() {
        for (let row = 0; row < this.size; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.size; col++) {
                if (this.isCellValidForShape(row, col)) {
                    this.board[row][col] = new HexCell(row, col);
                } else {
                    this.board[row][col] = null; // Invalid cell for this shape
                }
            }
        }
    }

    /**
     * Check if a cell is valid for the current board shape
     */
    isCellValidForShape(row, col) {
        switch (this.shape) {
            case 'hexagon':
                return true; // All cells valid for standard hexagon
            case 'diamond':
                // Diamond shape - remove corners
                const center = Math.floor(this.size / 2);
                const distance = Math.abs(row - center) + Math.abs(col - center);
                return distance <= center;
            case 'triangle':
                // Triangle shape - upper triangle
                return col <= row;
            case 'parallelogram':
                // Standard parallelogram (same as hexagon for now)
                return true;
            default:
                return true;
        }
    }

    isValidPosition(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return false;
        }
        return this.isCellValidForShape(row, col) && this.board[row][col] !== null;
    }

    getCell(row, col) {
        if (!this.isValidPosition(row, col)) {
            return null;
        }
        return this.board[row][col];
    }

    makeMove(row, col, playerNumber) {
        const cell = this.getCell(row, col);
        if (!cell || !cell.isEmpty()) {
            return false;
        }
        cell.player = playerNumber;
        return true;
    }

    /**
     * Get neighboring cells for a given position
     * In hex grid, each cell has 6 neighbors
     */
    getNeighbors(row, col) {
        const neighbors = [];
        // Hex grid neighbor offsets
        const offsets = [
            [-1, 0],  // top
            [-1, 1],  // top-right
            [0, 1],   // right
            [1, 0],   // bottom
            [1, -1],  // bottom-left
            [0, -1]   // left
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            const cell = this.getCell(newRow, newCol);
            if (cell) {
                neighbors.push(cell);
            }
        }
        return neighbors;
    }

    /**
     * Check if a player has won by connecting opposite sides
     * Player 1 connects top to bottom (rows 0 to size-1)
     * Player 2 connects left to right (cols 0 to size-1)
     */
    checkWin(playerNumber) {
        if (playerNumber === 1) {
            return this.checkVerticalConnection();
        } else if (playerNumber === 2) {
            return this.checkHorizontalConnection();
        }
        return false;
    }

    checkVerticalConnection() {
        // Check if player 1 connects top row to bottom row
        const visited = new Set();
        
        // Start from all pieces in the top row
        for (let col = 0; col < this.size; col++) {
            const startCell = this.getCell(0, col);
            if (startCell && startCell.isOwnedBy(1)) {
                if (this.dfsVertical(startCell, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkHorizontalConnection() {
        // Check if player 2 connects left column to right column
        const visited = new Set();
        
        // Start from all pieces in the left column
        for (let row = 0; row < this.size; row++) {
            const startCell = this.getCell(row, 0);
            if (startCell && startCell.isOwnedBy(2)) {
                if (this.dfsHorizontal(startCell, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    dfsVertical(cell, visited) {
        const key = `${cell.row},${cell.col}`;
        if (visited.has(key)) return false;
        visited.add(key);

        // If we reached the bottom row, we have a winning path
        if (cell.row === this.size - 1) {
            return true;
        }

        // Explore neighbors
        const neighbors = this.getNeighbors(cell.row, cell.col);
        for (const neighbor of neighbors) {
            if (neighbor.isOwnedBy(1) && !visited.has(`${neighbor.row},${neighbor.col}`)) {
                if (this.dfsVertical(neighbor, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    dfsHorizontal(cell, visited) {
        const key = `${cell.row},${cell.col}`;
        if (visited.has(key)) return false;
        visited.add(key);

        // If we reached the right column, we have a winning path
        if (cell.col === this.size - 1) {
            return true;
        }

        // Explore neighbors
        const neighbors = this.getNeighbors(cell.row, cell.col);
        for (const neighbor of neighbors) {
            if (neighbor.isOwnedBy(2) && !visited.has(`${neighbor.row},${neighbor.col}`)) {
                if (this.dfsHorizontal(neighbor, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get all empty cells
     */
    getEmptyCells() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const cell = this.getCell(row, col);
                if (cell && cell.isEmpty()) {
                    emptyCells.push({ row, col });
                }
            }
        }
        return emptyCells;
    }

    /**
     * Create a visual representation of the board
     */
    toString() {
        let result = '   ';
        
        // Column headers
        for (let col = 0; col < this.size; col++) {
            result += String.fromCharCode(65 + col) + ' ';
        }
        result += '\n';

        for (let row = 0; row < this.size; row++) {
            // Row number
            result += (row + 1).toString().padStart(2) + ' ';
            
            // Indentation for hex shape
            result += ' '.repeat(row);
            
            for (let col = 0; col < this.size; col++) {
                const cell = this.getCell(row, col);
                let symbol = '.';
                if (cell.player === 1) symbol = 'X';
                else if (cell.player === 2) symbol = 'O';
                
                result += symbol + ' ';
            }
            result += '\n';
        }
        return result;
    }
}

module.exports = { HexBoard, HexCell };