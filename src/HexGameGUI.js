const http = require('http');
const fs = require('fs');
const path = require('path');
const { HexGame } = require('./HexGame');

/**
 * Web-based GUI interface for the Hex Game
 */
class HexGameGUI {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
        this.games = new Map(); // Store multiple game sessions
        this.gameCounter = 0;
    }

    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🎮 Hex Game GUI Server started!`);
            console.log(`🌐 Open your browser and go to: http://localhost:${this.port}`);
            console.log(`🔷 Enjoy playing Hex with the graphical interface!`);
        });
    }

    handleRequest(req, res) {
        const url = req.url;
        const method = req.method;

        // Enable CORS for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Serve static files
        if (method === 'GET') {
            if (url === '/' || url === '/index.html') {
                this.serveFile(res, 'gui/index.html', 'text/html');
            } else if (url === '/style.css') {
                this.serveFile(res, 'gui/style.css', 'text/css');
            } else if (url === '/script.js') {
                this.serveFile(res, 'gui/script.js', 'text/javascript');
            } else {
                this.send404(res);
            }
        }
        // Handle API requests
        else if (method === 'POST') {
            if (url === '/api/new-game') {
                this.handleNewGame(req, res);
            } else if (url === '/api/make-move') {
                this.handleMakeMove(req, res);
            } else if (url === '/api/get-game-state') {
                this.handleGetGameState(req, res);
            } else if (url === '/api/get-ai-move') {
                this.handleGetAIMove(req, res);
            } else {
                this.send404(res);
            }
        } else {
            this.send404(res);
        }
    }

    serveFile(res, filePath, contentType) {
        const fullPath = path.join(__dirname, filePath);
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                console.log(`File not found: ${fullPath}`);
                this.send404(res);
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }

    send404(res) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }

    sendJSON(res, data, statusCode = 200) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    handleNewGame(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { boardSize, gameMode } = JSON.parse(body);
                const gameId = `game_${++this.gameCounter}`;
                const game = new HexGame(boardSize || 11, gameMode || 'human-vs-human');
                this.games.set(gameId, game);

                this.sendJSON(res, {
                    success: true,
                    gameId: gameId,
                    gameState: this.getGameStateData(game)
                });
            } catch (error) {
                this.sendJSON(res, {
                    success: false,
                    message: 'Invalid request data'
                }, 400);
            }
        });
    }

    handleMakeMove(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { gameId, row, col } = JSON.parse(body);
                const game = this.games.get(gameId);
                
                if (!game) {
                    this.sendJSON(res, {
                        success: false,
                        message: 'Game not found'
                    }, 404);
                    return;
                }

                const result = game.makeMove(row, col);
                
                this.sendJSON(res, {
                    success: result.success,
                    message: result.message,
                    gameState: this.getGameStateData(game)
                });
            } catch (error) {
                this.sendJSON(res, {
                    success: false,
                    message: 'Invalid request data'
                }, 400);
            }
        });
    }

    handleGetGameState(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { gameId } = JSON.parse(body);
                const game = this.games.get(gameId);
                
                if (!game) {
                    this.sendJSON(res, {
                        success: false,
                        message: 'Game not found'
                    }, 404);
                    return;
                }

                this.sendJSON(res, {
                    success: true,
                    gameState: this.getGameStateData(game)
                });
            } catch (error) {
                this.sendJSON(res, {
                    success: false,
                    message: 'Invalid request data'
                }, 400);
            }
        });
    }

    handleGetAIMove(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { gameId } = JSON.parse(body);
                const game = this.games.get(gameId);
                
                if (!game) {
                    this.sendJSON(res, {
                        success: false,
                        message: 'Game not found'
                    }, 404);
                    return;
                }

                const aiMove = game.getAIMove();
                
                this.sendJSON(res, {
                    success: true,
                    move: aiMove,
                    gameState: this.getGameStateData(game)
                });
            } catch (error) {
                this.sendJSON(res, {
                    success: false,
                    message: 'Error getting AI move'
                }, 500);
            }
        });
    }

    getGameStateData(game) {
        return {
            board: game.getBoardState(),
            currentPlayer: game.getCurrentPlayer().number,
            currentPlayerName: game.getCurrentPlayer().name,
            currentPlayerIsHuman: game.getCurrentPlayer().isHuman,
            gameOver: game.gameOver,
            winner: game.winner,
            gameMode: game.gameMode,
            boardSize: game.board.size,
            moveHistory: game.getMoveHistory(),
            players: game.players.map(p => ({
                number: p.number,
                name: p.name,
                isHuman: p.isHuman
            }))
        };
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Hex Game GUI Server stopped');
        }
    }
}

module.exports = { HexGameGUI };