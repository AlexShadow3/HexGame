const readlineSync = require('readline-sync');
const { HexGame } = require('./HexGame');

/**
 * Command Line Interface for the Hex Game
 */
class HexGameCLI {
    constructor() {
        this.game = null;
    }

    start() {
        console.log('\n🔷 Welcome to HEX GAME! 🔷\n');
        console.log('Hex is a strategy game where you try to connect opposite sides of the board.');
        console.log('Player 1 (X) tries to connect TOP to BOTTOM');
        console.log('Player 2 (O) tries to connect LEFT to RIGHT\n');

        this.showMainMenu();
    }

    showMainMenu() {
        console.log('=== MAIN MENU ===');
        console.log('1. Play against Computer');
        console.log('2. Play against Human');
        console.log('3. Watch AI vs AI');
        console.log('4. Game Rules');
        console.log('5. Exit');

        const choice = readlineSync.question('\nSelect an option (1-5): ');

        switch (choice) {
            case '1':
                this.startGame('human-vs-ai');
                break;
            case '2':
                this.startGame('human-vs-human');
                break;
            case '3':
                this.startGame('ai-vs-ai');
                break;
            case '4':
                this.showRules();
                break;
            case '5':
                console.log('Thanks for playing! Goodbye! 👋');
                process.exit(0);
                break;
            default:
                console.log('Invalid choice. Please try again.');
                this.showMainMenu();
        }
    }

    startGame(gameMode) {
        const boardSize = this.askBoardSize();
        this.game = new HexGame(boardSize, gameMode);
        
        console.log(`\n🎮 Starting new game: ${gameMode}`);
        console.log(`📏 Board size: ${boardSize}x${boardSize}\n`);

        this.gameLoop();
    }

    askBoardSize() {
        console.log('\nSelect board size:');
        console.log('1. Small (7x7) - Quick game');
        console.log('2. Medium (11x11) - Standard');
        console.log('3. Large (15x15) - Long game');

        const choice = readlineSync.question('\nSelect size (1-3) [default: 2]: ') || '2';

        switch (choice) {
            case '1': return 7;
            case '3': return 15;
            default: return 11;
        }
    }

    gameLoop() {
        while (!this.game.gameOver) {
            this.displayGameState();
            
            const currentPlayer = this.game.getCurrentPlayer();
            
            if (currentPlayer.isHuman) {
                this.handleHumanMove();
            } else {
                this.handleAIMove();
            }
        }

        this.displayGameEnd();
    }

    displayGameState() {
        console.clear();
        console.log(this.game.displayGameInfo());
        console.log(this.game.displayBoard());
    }

    handleHumanMove() {
        const currentPlayer = this.game.getCurrentPlayer();
        console.log(`\n${currentPlayer.name}, it's your turn!`);
        console.log('Enter your move (e.g., A1, B5, K11) or "menu" to return to main menu:');

        const input = readlineSync.question('Your move: ').trim();

        if (input.toLowerCase() === 'menu') {
            console.log('\nReturning to main menu...');
            this.showMainMenu();
            return;
        }

        if (input.toLowerCase() === 'help') {
            this.showMoveHelp();
            this.handleHumanMove();
            return;
        }

        const result = this.game.makeMoveFromString(input);
        
        if (!result.success) {
            console.log(`❌ ${result.message}`);
            readlineSync.question('Press Enter to continue...');
            this.handleHumanMove();
        } else if (result.gameOver) {
            console.log(`✅ ${result.message}`);
        }
    }

    handleAIMove() {
        const currentPlayer = this.game.getCurrentPlayer();
        console.log(`\n🤖 ${currentPlayer.name} is thinking...`);
        
        // Add a small delay for dramatic effect
        this.sleep(1000);
        
        const move = this.game.getAIMove();
        if (move) {
            const result = this.game.makeMove(move.row, move.col);
            const moveString = this.game.coordinatesToString(move.row, move.col);
            
            if (result.success) {
                console.log(`🤖 ${currentPlayer.name} played: ${moveString}`);
                if (result.gameOver) {
                    console.log(`✅ ${result.message}`);
                }
            }
        }

        if (this.game.gameMode === 'ai-vs-ai') {
            readlineSync.question('Press Enter to continue...');
        }
    }

    displayGameEnd() {
        this.displayGameState();
        
        if (this.game.winner) {
            console.log(`\n🎉 GAME OVER! ${this.game.winner.name} wins! 🎉`);
        } else {
            console.log('\n🤝 GAME OVER! It\'s a draw! 🤝');
        }

        console.log(`\nGame Summary:`);
        console.log(`- Total moves: ${this.game.moveHistory.length}`);
        console.log(`- Game mode: ${this.game.gameMode}`);
        
        console.log('\nOptions:');
        console.log('1. Play again with same settings');
        console.log('2. Return to main menu');
        console.log('3. Exit');

        const choice = readlineSync.question('\nWhat would you like to do? (1-3): ');

        switch (choice) {
            case '1':
                this.game.reset();
                this.gameLoop();
                break;
            case '2':
                this.showMainMenu();
                break;
            case '3':
                console.log('Thanks for playing! Goodbye! 👋');
                process.exit(0);
                break;
            default:
                this.showMainMenu();
        }
    }

    showMoveHelp() {
        console.log('\n=== MOVE HELP ===');
        console.log('Enter moves using column letter + row number:');
        console.log('- Columns are labeled A, B, C, ... (left to right)');
        console.log('- Rows are numbered 1, 2, 3, ... (top to bottom)');
        console.log('Examples: A1, B5, K11');
        console.log('Special commands:');
        console.log('- "help" - Show this help');
        console.log('- "menu" - Return to main menu');
        readlineSync.question('\nPress Enter to continue...');
    }

    showRules() {
        console.log('\n=== HEX GAME RULES ===');
        console.log('🎯 OBJECTIVE:');
        console.log('  • Player 1 (X): Connect the TOP edge to the BOTTOM edge');
        console.log('  • Player 2 (O): Connect the LEFT edge to the RIGHT edge');
        console.log('');
        console.log('📋 HOW TO PLAY:');
        console.log('  • Players take turns placing their pieces on empty cells');
        console.log('  • Once placed, pieces cannot be moved or removed');
        console.log('  • A winning path must be continuous (connected neighbors)');
        console.log('  • Corner cells count as part of both adjacent edges');
        console.log('');
        console.log('🏆 WINNING:');
        console.log('  • First player to complete their connection wins');
        console.log('  • The game cannot end in a draw (mathematical proof exists)');
        console.log('');
        console.log('💡 STRATEGY TIPS:');
        console.log('  • Control the center of the board');
        console.log('  • Block your opponent\'s connections');
        console.log('  • Try to create multiple threatening paths');
        console.log('');

        readlineSync.question('Press Enter to return to main menu...');
        this.showMainMenu();
    }

    sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // Busy wait
        }
    }
}

module.exports = { HexGameCLI };