# HexGame

A classic Hex board game implementation supporting 1-2 players with AI opponent.

## 🎯 About the Game

Hex is a strategic connection game for two players played on a hexagonal grid. The goal is to form an unbroken chain of your pieces linking two opposite sides of the board.

- **Player 1 (X)**: Connect the top edge to the bottom edge
- **Player 2 (O)**: Connect the left edge to the right edge

## 🚀 Features

- ✅ Support for 1-2 players
- 🤖 AI opponent with multiple difficulty levels
- 📏 Multiple board sizes (7x7, 9x9, 11x11, 13x13)
- 🎮 Interactive command-line interface
- 🌐 **NEW!** Web-based graphical interface
- 🧪 Comprehensive test suite
- 📖 Clear game rules and help system

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/AlexShadow3/HexGame.git
cd HexGame
```

2. Install dependencies:
```bash
npm install
```

## 🎮 How to Play

### Command Line Interface (CLI)
```bash
npm start
# or
npm run start:cli
```

### 🌐 Graphical Interface (GUI) - NEW!
```bash
npm run start:gui
```
Then open your browser and go to: `http://localhost:3000`

The web interface provides:
- 🎨 Beautiful visual hexagonal board
- 🖱️ Click-to-play interaction
- 📱 Responsive design for mobile and desktop
- 🎯 Visual game state indicators
- 🤖 Seamless AI integration

### Game Modes
1. **Human vs Computer** - Play against AI opponent
2. **Human vs Human** - Two players on same computer
3. **AI vs AI** - Watch computer players battle

### Making Moves
- Use column letter + row number format: `A1`, `B5`, `K11`
- Columns are labeled A, B, C, ... (left to right)
- Rows are numbered 1, 2, 3, ... (top to bottom)

### Special Commands
- `help` - Show move help
- `menu` - Return to main menu

## 📋 Game Rules

### Objective
- **Player 1 (X)**: Create a connected path from the top edge to the bottom edge
- **Player 2 (O)**: Create a connected path from the left edge to the right edge

### Gameplay
1. Players alternate placing their pieces on empty hexagonal cells
2. Once placed, pieces cannot be moved or removed
3. A winning path must be continuous through adjacent cells
4. Corner cells count as part of both adjacent edges
5. The first player to complete their connection wins
6. Hex cannot end in a draw (mathematical proof exists)

### Strategy Tips
- Control the center of the board
- Block your opponent's potential connections
- Create multiple threatening paths
- Plan several moves ahead

## 🏗️ Project Structure

```
HexGame/
├── src/
│   ├── HexBoard.js      # Board representation and game logic
│   ├── HexGame.js       # Main game controller
│   ├── Player.js        # Player classes (Human & AI)
│   ├── HexGameCLI.js    # Command-line interface
│   ├── HexGameGUI.js    # Web-based graphical interface (NEW!)
│   ├── gui/             # Frontend assets (NEW!)
│   │   ├── index.html   # Main HTML page
│   │   ├── style.css    # CSS styling
│   │   └── script.js    # Frontend JavaScript
│   └── index.js         # Entry point
├── tests/
│   ├── HexBoard.test.js # Board logic tests
│   ├── HexGame.test.js  # Game controller tests
│   └── Player.test.js   # Player logic tests
├── package.json
└── README.md
```

## 🧪 Testing

Run the complete test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## 🤖 AI Implementation

The AI player includes two difficulty levels:

### Easy Mode
- Makes random valid moves
- Good for beginners learning the game

### Medium Mode
- Prioritizes winning moves when available
- Attempts to block opponent's winning moves
- Makes strategic moves toward game objectives
- Prefers center positions for better board control

## 🎨 Board Visualization

The game displays a hexagonal board with clear visual indicators:

```
   A B C D E F G H I J K 
 1 . . . . . . . . . . . 
 2  . . . . . . . . . . . 
 3   . . . . . . . . . . . 
 4    . . . X . . . . . . . 
 5     . . . . . . . . . . . 
 6      . . . . . O . . . . . 
 7       . . . . . . . . . . . 
 8        . . . . . . . . . . . 
 9         . . . . . . . . . . . 
10          . . . . . . . . . . . 
11           . . . . . . . . . . . 
```

- `.` = Empty cell
- `X` = Player 1 piece
- `O` = Player 2 piece

## 🔧 Development

### Running in Development
```bash
npm start
```

### Code Style
The project follows standard JavaScript conventions with:
- Clear class and method names
- Comprehensive JSDoc comments
- Modular design with separation of concerns
- Extensive test coverage

## 📜 API Reference

### HexBoard Class
- `makeMove(row, col, player)` - Place a piece on the board
- `checkWin(player)` - Check if player has won
- `getNeighbors(row, col)` - Get adjacent cells
- `getEmptyCells()` - Get all available moves

### HexGame Class
- `makeMove(row, col)` - Make a move and update game state
- `makeMoveFromString(moveString)` - Make move using notation like "A1"
- `getAIMove()` - Get AI's chosen move
- `reset()` - Reset game to initial state

### HexGameGUI Class (NEW!)
- `start()` - Start the web server
- `handleNewGame()` - Create new game session
- `handleMakeMove()` - Process player moves
- `handleGetAIMove()` - Get AI move via API
- `getGameStateData()` - Get complete game state

### Player Classes
- `Player` - Human player representation
- `AIPlayer` - AI player with strategic move selection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- [x] ~~Web-based UI interface~~ ✅ **COMPLETED!**
- [ ] Online multiplayer support
- [ ] Advanced AI with minimax algorithm
- [ ] Game replay and analysis
- [ ] Tournament mode
- [ ] Custom board shapes
- [ ] Move hints and analysis

## 🙏 Acknowledgments

- Hex game invented by Piet Hein and independently by John Nash
- Inspired by classic board game implementations
- Built with Node.js and Jest for testing