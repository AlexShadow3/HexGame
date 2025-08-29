#!/usr/bin/env node

const { HexGame } = require('../src/HexGame');

/**
 * Demo script to showcase HexGame functionality
 */
function runDemo() {
    console.log('🔷 HEX GAME DEMO 🔷\n');
    
    // Demo 1: Human vs AI game simulation
    console.log('=== DEMO 1: Human vs AI Game Simulation ===');
    const game1 = new HexGame(7, 'human-vs-ai');
    
    console.log('Initial board:');
    console.log(game1.displayBoard());
    
    // Simulate some moves
    const moves = ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7'];
    
    console.log('Playing moves:', moves.join(', '));
    for (const move of moves) {
        const result = game1.makeMoveFromString(move);
        console.log(`Move ${move}: ${result.success ? 'Success' : 'Failed - ' + result.message}`);
        
        if (result.gameOver) {
            console.log(`🎉 Game Over! ${result.winner ? result.winner.name + ' wins!' : 'Draw!'}`);
            break;
        }
        
        // AI move if current player is AI
        if (!game1.getCurrentPlayer().isHuman) {
            const aiMove = game1.getAIMove();
            if (aiMove) {
                const aiResult = game1.makeMove(aiMove.row, aiMove.col);
                const aiMoveStr = game1.coordinatesToString(aiMove.row, aiMove.col);
                console.log(`AI played: ${aiMoveStr}`);
                
                if (aiResult.gameOver) {
                    console.log(`🎉 Game Over! ${aiResult.winner ? aiResult.winner.name + ' wins!' : 'Draw!'}`);
                    break;
                }
            }
        }
    }
    
    console.log('\nFinal board:');
    console.log(game1.displayBoard());
    console.log('Game status:', game1.getStatus());
    
    // Demo 2: AI vs AI quick game
    console.log('\n=== DEMO 2: AI vs AI Quick Game ===');
    const game2 = new HexGame(5, 'ai-vs-ai');
    
    let moveCount = 0;
    const maxMoves = 10;
    
    while (!game2.gameOver && moveCount < maxMoves) {
        const currentPlayer = game2.getCurrentPlayer();
        const aiMove = game2.getAIMove();
        
        if (aiMove) {
            const result = game2.makeMove(aiMove.row, aiMove.col);
            const moveStr = game2.coordinatesToString(aiMove.row, aiMove.col);
            console.log(`${currentPlayer.name} (${currentPlayer.symbol}) played: ${moveStr}`);
            
            if (result.gameOver) {
                console.log(`🎉 ${result.winner ? result.winner.name + ' wins!' : 'Draw!'}`);
                break;
            }
        }
        moveCount++;
    }
    
    console.log('\nFinal board:');
    console.log(game2.displayBoard());
    
    // Demo 3: Test win detection
    console.log('\n=== DEMO 3: Win Detection Test ===');
    const game3 = new HexGame(5, 'human-vs-human');
    
    // Create a winning path for player 1 (vertical)
    console.log('Creating winning path for Player 1 (X):');
    const winningMoves = [
        { move: 'A1', player: 1 },
        { move: 'A2', player: 2 },
        { move: 'B2', player: 1 },
        { move: 'A3', player: 2 },
        { move: 'C3', player: 1 },
        { move: 'A4', player: 2 },
        { move: 'D4', player: 1 },
        { move: 'A5', player: 2 },
        { move: 'E5', player: 1 } // This should create a winning path
    ];
    
    for (let i = 0; i < winningMoves.length; i++) {
        const { move, player } = winningMoves[i];
        
        // Ensure correct player is making the move
        while (game3.getCurrentPlayer().number !== player) {
            game3.switchPlayer();
        }
        
        const result = game3.makeMoveFromString(move);
        console.log(`Player ${player} played ${move}: ${result.success ? 'Success' : 'Failed'}`);
        
        if (result.gameOver) {
            console.log(`🎉 ${result.winner.name} wins!`);
            break;
        }
    }
    
    console.log('\nFinal board:');
    console.log(game3.displayBoard());
    
    console.log('\n=== DEMO COMPLETE ===');
    console.log('✅ All core features demonstrated:');
    console.log('  - Human vs AI gameplay');
    console.log('  - AI vs AI gameplay');
    console.log('  - Win condition detection');
    console.log('  - Move validation');
    console.log('  - Board visualization');
    console.log('  - Multiple game modes');
}

// Run the demo
if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };