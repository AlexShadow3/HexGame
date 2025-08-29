#!/usr/bin/env node

const { HexGameCLI } = require('./HexGameCLI');
const { HexGameGUI } = require('./HexGameGUI');

// Check if we're running directly or being imported
if (require.main === module) {
    // Check command line arguments for interface mode
    const args = process.argv.slice(2);
    const mode = args.includes('--gui') || args.includes('-g') ? 'gui' : 'cli';
    
    if (mode === 'gui') {
        // Start the GUI web server
        const gui = new HexGameGUI();
        gui.start();
    } else {
        // Start the CLI (default)
        const cli = new HexGameCLI();
        cli.start();
    }
}

// Export for testing purposes
module.exports = {
    HexGameCLI,
    HexGameGUI,
    HexGame: require('./HexGame').HexGame,
    HexBoard: require('./HexBoard').HexBoard,
    Player: require('./Player').Player,
    AIPlayer: require('./Player').AIPlayer
};