const { HexBoard, HexCell } = require('../src/HexBoard');

describe('HexCell', () => {
    test('should create empty cell', () => {
        const cell = new HexCell(0, 0);
        expect(cell.row).toBe(0);
        expect(cell.col).toBe(0);
        expect(cell.player).toBeNull();
        expect(cell.isEmpty()).toBe(true);
    });

    test('should set player ownership', () => {
        const cell = new HexCell(1, 2);
        cell.player = 1;
        expect(cell.isEmpty()).toBe(false);
        expect(cell.isOwnedBy(1)).toBe(true);
        expect(cell.isOwnedBy(2)).toBe(false);
    });
});

describe('HexBoard', () => {
    let board;

    beforeEach(() => {
        board = new HexBoard(5); // Use smaller board for testing
    });

    test('should create board with correct size', () => {
        expect(board.size).toBe(5);
        expect(board.board.length).toBe(5);
        expect(board.board[0].length).toBe(5);
    });

    test('should initialize all cells as empty', () => {
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = board.getCell(row, col);
                expect(cell).not.toBeNull();
                expect(cell.isEmpty()).toBe(true);
            }
        }
    });

    test('should validate positions correctly', () => {
        expect(board.isValidPosition(0, 0)).toBe(true);
        expect(board.isValidPosition(4, 4)).toBe(true);
        expect(board.isValidPosition(-1, 0)).toBe(false);
        expect(board.isValidPosition(0, -1)).toBe(false);
        expect(board.isValidPosition(5, 0)).toBe(false);
        expect(board.isValidPosition(0, 5)).toBe(false);
    });

    test('should make moves correctly', () => {
        expect(board.makeMove(0, 0, 1)).toBe(true);
        expect(board.getCell(0, 0).player).toBe(1);
        
        // Should not allow move on occupied cell
        expect(board.makeMove(0, 0, 2)).toBe(false);
        
        // Should not allow move on invalid position
        expect(board.makeMove(-1, 0, 1)).toBe(false);
    });

    test('should get neighbors correctly', () => {
        const neighbors = board.getNeighbors(2, 2); // Center cell
        expect(neighbors.length).toBe(6);
        
        const cornerNeighbors = board.getNeighbors(0, 0); // Corner cell
        expect(cornerNeighbors.length).toBe(2);
        
        const edgeNeighbors = board.getNeighbors(0, 2); // Edge cell
        expect(edgeNeighbors.length).toBe(4);
    });

    test('should detect vertical win for player 1', () => {
        // Create a vertical path from top to bottom
        for (let row = 0; row < 5; row++) {
            board.makeMove(row, 0, 1);
        }
        expect(board.checkWin(1)).toBe(true);
        expect(board.checkWin(2)).toBe(false);
    });

    test('should detect horizontal win for player 2', () => {
        // Create a horizontal path from left to right
        for (let col = 0; col < 5; col++) {
            board.makeMove(0, col, 2);
        }
        expect(board.checkWin(2)).toBe(true);
        expect(board.checkWin(1)).toBe(false);
    });

    test('should detect diagonal winning path', () => {
        // Create a connected path for player 1 from top to bottom
        // Using hex adjacency rules: top-right diagonal
        board.makeMove(0, 0, 1);
        board.makeMove(0, 1, 1); // top-right neighbor
        board.makeMove(1, 1, 1);
        board.makeMove(1, 2, 1); // top-right neighbor  
        board.makeMove(2, 2, 1);
        board.makeMove(2, 3, 1); // top-right neighbor
        board.makeMove(3, 3, 1);
        board.makeMove(3, 4, 1); // top-right neighbor
        board.makeMove(4, 4, 1);
        
        expect(board.checkWin(1)).toBe(true);
    });

    test('should not detect win for incomplete path', () => {
        // Incomplete vertical path
        board.makeMove(0, 0, 1);
        board.makeMove(1, 0, 1);
        board.makeMove(2, 0, 1);
        // Missing row 3
        board.makeMove(4, 0, 1);
        
        expect(board.checkWin(1)).toBe(false);
    });

    test('should get empty cells correctly', () => {
        const initialEmpty = board.getEmptyCells();
        expect(initialEmpty.length).toBe(25);
        
        board.makeMove(0, 0, 1);
        board.makeMove(1, 1, 2);
        
        const afterMoves = board.getEmptyCells();
        expect(afterMoves.length).toBe(23);
    });

    test('should generate string representation', () => {
        board.makeMove(0, 0, 1);
        board.makeMove(1, 1, 2);
        
        const boardString = board.toString();
        expect(boardString).toContain('X'); // Player 1
        expect(boardString).toContain('O'); // Player 2
        expect(boardString).toContain('.'); // Empty cells
        expect(boardString).toContain('A'); // Column headers
    });
});