#!/usr/bin/env node

const { HexGameCLI } = require('./HexGameCLI');

// Check if we're running directly or being imported
if (require.main === module) {
    // Running directly, start the CLI
    const cli = new HexGameCLI();
    cli.start();
}

// Export for testing purposes
module.exports = {
    HexGameCLI,
    HexGame: require('./HexGame').HexGame,
    HexBoard: require('./HexBoard').HexBoard,
    Player: require('./Player').Player,
    AIPlayer: require('./Player').AIPlayer
};