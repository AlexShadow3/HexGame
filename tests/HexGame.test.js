const { HexGame } = require('../src/HexGame');

describe('HexGame', () => {
    let game;

    beforeEach(() => {
        game = new HexGame(5, 'human-vs-human'); // Small board for testing
    });

    test('should initialize game correctly', () => {
        expect(game.board.size).toBe(5);
        expect(game.gameMode).toBe('human-vs-human');
        expect(game.players.length).toBe(2);
        expect(game.currentPlayerIndex).toBe(0);
        expect(game.gameOver).toBe(false);
        expect(game.winner).toBeNull();
        expect(game.moveHistory.length).toBe(0);
    });

    test('should initialize different game modes correctly', () => {
        const humanVsAI = new HexGame(5, 'human-vs-ai');
        expect(humanVsAI.players[0].isHuman).toBe(true);
        expect(humanVsAI.players[1].isHuman).toBe(false);

        const aiVsAI = new HexGame(5, 'ai-vs-ai');
        expect(aiVsAI.players[0].isHuman).toBe(false);
        expect(aiVsAI.players[1].isHuman).toBe(false);
    });

    test('should handle valid moves correctly', () => {
        const result = game.makeMove(0, 0);
        expect(result.success).toBe(true);
        expect(result.gameOver).toBe(false);
        expect(game.getCurrentPlayer().number).toBe(2); // Should switch to player 2
        expect(game.moveHistory.length).toBe(1);
    });

    test('should reject invalid moves', () => {
        // Move outside board
        let result = game.makeMove(-1, 0);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid position');

        result = game.makeMove(5, 0);
        expect(result.success).toBe(false);

        // Move on occupied position
        game.makeMove(0, 0);
        result = game.makeMove(0, 0);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Position already occupied');
    });

    test('should detect win condition', () => {
        // Create winning path for player 1 (vertical)
        game.makeMove(0, 0); // Player 1
        game.makeMove(0, 1); // Player 2
        game.makeMove(1, 0); // Player 1
        game.makeMove(0, 2); // Player 2
        game.makeMove(2, 0); // Player 1
        game.makeMove(0, 3); // Player 2
        game.makeMove(3, 0); // Player 1
        game.makeMove(0, 4); // Player 2
        
        const result = game.makeMove(4, 0); // Player 1 wins
        expect(result.success).toBe(true);
        expect(result.gameOver).toBe(true);
        expect(game.winner.number).toBe(1);
    });

    test('should parse move strings correctly', () => {
        expect(game.parseMove('A1')).toEqual({ row: 0, col: 0 });
        expect(game.parseMove('B2')).toEqual({ row: 1, col: 1 });
        expect(game.parseMove('E5')).toEqual({ row: 4, col: 4 });
        expect(game.parseMove('a1')).toEqual({ row: 0, col: 0 }); // Case insensitive
        
        // Invalid moves
        expect(game.parseMove('Z1')).toBeNull();
        expect(game.parseMove('A0')).toBeNull();
        expect(game.parseMove('A6')).toBeNull();
        expect(game.parseMove('')).toBeNull();
        expect(game.parseMove('AA')).toBeNull();
    });

    test('should convert coordinates to string', () => {
        expect(game.coordinatesToString(0, 0)).toBe('A1');
        expect(game.coordinatesToString(1, 1)).toBe('B2');
        expect(game.coordinatesToString(4, 4)).toBe('E5');
    });

    test('should handle move from string', () => {
        const result = game.makeMoveFromString('A1');
        expect(result.success).toBe(true);
        expect(game.board.getCell(0, 0).player).toBe(1);

        const invalidResult = game.makeMoveFromString('Z9');
        expect(invalidResult.success).toBe(false);
    });

    test('should switch players correctly', () => {
        expect(game.getCurrentPlayer().number).toBe(1);
        game.makeMove(0, 0);
        expect(game.getCurrentPlayer().number).toBe(2);
        game.makeMove(0, 1);
        expect(game.getCurrentPlayer().number).toBe(1);
    });

    test('should get AI move for AI players', () => {
        const aiGame = new HexGame(5, 'human-vs-ai');
        aiGame.switchPlayer(); // Switch to AI player
        
        const move = aiGame.getAIMove();
        expect(move).not.toBeNull();
        expect(aiGame.board.isValidPosition(move.row, move.col)).toBe(true);
    });

    test('should return null for human player AI move', () => {
        const move = game.getAIMove(); // Current player is human
        expect(move).toBeNull();
    });

    test('should reset game correctly', () => {
        game.makeMove(0, 0);
        game.makeMove(0, 1);
        
        game.reset();
        
        expect(game.currentPlayerIndex).toBe(0);
        expect(game.gameOver).toBe(false);
        expect(game.winner).toBeNull();
        expect(game.moveHistory.length).toBe(0);
        expect(game.board.getEmptyCells().length).toBe(25);
    });

    test('should get game status correctly', () => {
        const status = game.getStatus();
        expect(status.gameOver).toBe(false);
        expect(status.winner).toBeNull();
        expect(status.currentPlayer.number).toBe(1);
        expect(status.moveCount).toBe(0);
        expect(status.boardSize).toBe(5);
        expect(status.gameMode).toBe('human-vs-human');
    });

    test('should track move history', () => {
        game.makeMove(0, 0);
        game.makeMove(1, 1);
        
        const history = game.getMoveHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toEqual({
            player: 1,
            row: 0,
            col: 0,
            move: 1
        });
        expect(history[1]).toEqual({
            player: 2,
            row: 1,
            col: 1,
            move: 2
        });
    });

    test('should get board state correctly', () => {
        game.makeMove(0, 0); // Player 1
        game.makeMove(1, 1); // Player 2
        
        const state = game.getBoardState();
        expect(state[0][0]).toBe(1);
        expect(state[1][1]).toBe(2);
        expect(state[0][1]).toBeNull();
    });

    test('should prevent moves after game over', () => {
        // Create winning condition - a proper connected path
        // Create vertical path for player 1
        game.makeMove(0, 0); // Player 1
        game.makeMove(0, 1); // Player 2
        game.makeMove(1, 0); // Player 1
        game.makeMove(0, 2); // Player 2
        game.makeMove(2, 0); // Player 1
        game.makeMove(0, 3); // Player 2
        game.makeMove(3, 0); // Player 1
        game.makeMove(0, 4); // Player 2
        
        // This should win for player 1
        const winResult = game.makeMove(4, 0);
        expect(winResult.gameOver).toBe(true);
        expect(game.gameOver).toBe(true);
        
        // Try to make another move
        const result = game.makeMove(1, 2);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Game is already over');
    });

    test('should display board and game info', () => {
        const boardDisplay = game.displayBoard();
        expect(boardDisplay).toContain('A');
        expect(boardDisplay).toContain('.');
        
        const gameInfo = game.displayGameInfo();
        expect(gameInfo).toContain('HEX GAME');
        expect(gameInfo).toContain('Board Size');
        expect(gameInfo).toContain('Game Mode');
        expect(gameInfo).toContain('Player 1');
        expect(gameInfo).toContain('Player 2');
    });
});