const http = require('http');
const path = require('path');
const fs = require('fs');
const socketIo = require('socket.io');
const { HexGame } = require('./HexGame');
const { Tournament } = require('./Tournament');
const { Player, AIPlayer } = require('./Player');

/**
 * Online multiplayer server for Hex Game
 */
class HexMultiplayerServer {
    constructor(port = 3001) {
        this.port = port;
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.activeGames = new Map();
        this.waitingPlayers = [];
        this.tournaments = new Map();
        this.playerSessions = new Map();
        
        this.setupSocketHandlers();
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 Hex Multiplayer Server started on port ${this.port}`);
            console.log(`🎮 Visit http://localhost:${this.port} to play online!`);
        });
    }

    /**
     * Handle HTTP requests to serve static files
     */
    handleHttpRequest(req, res) {
        let filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './multiplayer/index.html';
        }
        
        // Map URLs to actual file paths
        const publicPath = path.join(__dirname, filePath);
        
        // Security check to prevent directory traversal
        if (!publicPath.startsWith(path.join(__dirname, 'multiplayer'))) {
            if (req.url === '/') {
                filePath = './multiplayer/index.html';
            } else {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
        }
        
        const actualPath = path.join(__dirname, filePath);
        
        fs.readFile(actualPath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end('Server error');
                }
                return;
            }
            
            // Set content type based on file extension
            const ext = path.extname(actualPath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json'
            };
            
            const contentType = mimeTypes[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Player connected: ${socket.id}`);
            
            socket.on('join-queue', (data) => this.handleJoinQueue(socket, data));
            socket.on('leave-queue', () => this.handleLeaveQueue(socket));
            socket.on('make-move', (data) => this.handleMakeMove(socket, data));
            socket.on('create-game', (data) => this.handleCreateGame(socket, data));
            socket.on('join-game', (data) => this.handleJoinGame(socket, data));
            socket.on('get-hints', (data) => this.handleGetHints(socket, data));
            socket.on('analyze-position', (data) => this.handleAnalyzePosition(socket, data));
            socket.on('save-game', (data) => this.handleSaveGame(socket, data));
            socket.on('load-game', (data) => this.handleLoadGame(socket, data));
            socket.on('create-tournament', (data) => this.handleCreateTournament(socket, data));
            socket.on('join-tournament', (data) => this.handleJoinTournament(socket, data));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /**
     * Handle player joining matchmaking queue
     */
    handleJoinQueue(socket, data) {
        const { playerName, difficulty = 'medium', boardSize = 11, boardShape = 'hexagon' } = data;
        
        // Remove from queue if already waiting
        this.handleLeaveQueue(socket);
        
        const playerInfo = {
            socket: socket,
            id: socket.id,
            name: playerName,
            difficulty: difficulty,
            boardSize: boardSize,
            boardShape: boardShape,
            joinTime: Date.now()
        };
        
        this.waitingPlayers.push(playerInfo);
        this.playerSessions.set(socket.id, playerInfo);
        
        socket.emit('queue-joined', { position: this.waitingPlayers.length });
        
        // Try to match players
        this.tryMatchPlayers();
    }

    /**
     * Try to match waiting players
     */
    tryMatchPlayers() {
        if (this.waitingPlayers.length < 2) return;
        
        // Simple matching - pair first two compatible players
        for (let i = 0; i < this.waitingPlayers.length - 1; i++) {
            for (let j = i + 1; j < this.waitingPlayers.length; j++) {
                const player1 = this.waitingPlayers[i];
                const player2 = this.waitingPlayers[j];
                
                // Check compatibility
                if (player1.boardSize === player2.boardSize && 
                    player1.boardShape === player2.boardShape) {
                    
                    // Create game
                    this.createMultiplayerGame(player1, player2);
                    
                    // Remove from queue
                    this.waitingPlayers.splice(j, 1);
                    this.waitingPlayers.splice(i, 1);
                    
                    return;
                }
            }
        }
    }

    /**
     * Create a multiplayer game between two players
     */
    createMultiplayerGame(player1, player2) {
        const gameId = this.generateGameId();
        const game = new HexGame(player1.boardSize, 'online-multiplayer', player1.boardShape);
        
        // Set up players
        game.players = [
            new Player(1, player1.name, true),
            new Player(2, player2.name, true)
        ];
        
        const gameSession = {
            game: game,
            players: [player1, player2],
            spectators: [],
            createdAt: Date.now()
        };
        
        this.activeGames.set(gameId, gameSession);
        
        // Join socket rooms
        player1.socket.join(gameId);
        player2.socket.join(gameId);
        
        // Notify players
        this.io.to(gameId).emit('game-started', {
            gameId: gameId,
            players: [
                { name: player1.name, number: 1 },
                { name: player2.name, number: 2 }
            ],
            gameState: this.getGameState(game),
            boardSize: player1.boardSize,
            boardShape: player1.boardShape
        });
        
        console.log(`Game ${gameId} started: ${player1.name} vs ${player2.name}`);
    }

    /**
     * Handle player leaving queue
     */
    handleLeaveQueue(socket) {
        this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== socket.id);
    }

    /**
     * Handle making a move
     */
    handleMakeMove(socket, data) {
        const { gameId, row, col } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        const game = gameSession.game;
        const currentPlayer = game.getCurrentPlayer();
        
        // Verify it's the player's turn
        const playerIndex = gameSession.players.findIndex(p => p.id === socket.id);
        if (playerIndex === -1 || playerIndex !== game.currentPlayerIndex) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }
        
        // Make move
        const result = game.makeMove(row, col);
        
        if (result.success) {
            // Broadcast move to all players in the game
            this.io.to(gameId).emit('move-made', {
                row: row,
                col: col,
                player: currentPlayer.number,
                gameState: this.getGameState(game),
                result: result
            });
            
            // Check if game ended
            if (result.gameOver) {
                this.handleGameEnd(gameId, gameSession);
            }
        } else {
            socket.emit('error', { message: result.message });
        }
    }

    /**
     * Handle game ending
     */
    handleGameEnd(gameId, gameSession) {
        const game = gameSession.game;
        
        this.io.to(gameId).emit('game-ended', {
            winner: game.winner ? {
                name: game.winner.name,
                number: game.winner.number
            } : null,
            gameState: this.getGameState(game),
            analysis: game.analyzeGame()
        });
        
        // Clean up after delay
        setTimeout(() => {
            this.activeGames.delete(gameId);
        }, 30000); // Keep for 30 seconds for final analysis
    }

    /**
     * Handle creating a custom game
     */
    handleCreateGame(socket, data) {
        const { playerName, boardSize = 11, boardShape = 'hexagon', gameMode = 'human-vs-ai', aiDifficulty = 'medium' } = data;
        
        const gameId = this.generateGameId();
        const game = new HexGame(boardSize, gameMode, boardShape);
        
        // Set up players based on game mode
        if (gameMode === 'human-vs-ai') {
            game.players = [
                new Player(1, playerName, true),
                new AIPlayer(2, 'Computer', aiDifficulty)
            ];
        } else if (gameMode === 'human-vs-ai-hard') {
            game.players = [
                new Player(1, playerName, true),
                new AIPlayer(2, 'Computer', 'hard')
            ];
        }
        
        const gameSession = {
            game: game,
            players: [{ socket: socket, id: socket.id, name: playerName }],
            spectators: [],
            createdAt: Date.now()
        };
        
        this.activeGames.set(gameId, gameSession);
        socket.join(gameId);
        
        socket.emit('game-created', {
            gameId: gameId,
            gameState: this.getGameState(game)
        });
    }

    /**
     * Handle joining an existing game as spectator
     */
    handleJoinGame(socket, data) {
        const { gameId, playerName } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        // Add as spectator
        gameSession.spectators.push({
            socket: socket,
            id: socket.id,
            name: playerName
        });
        
        socket.join(gameId);
        
        socket.emit('joined-game', {
            gameId: gameId,
            gameState: this.getGameState(gameSession.game),
            isSpectator: true
        });
    }

    /**
     * Handle getting move hints
     */
    handleGetHints(socket, data) {
        const { gameId, count = 3 } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        const hints = gameSession.game.getMoveHints(count);
        socket.emit('hints-received', { hints: hints });
    }

    /**
     * Handle position analysis request
     */
    handleAnalyzePosition(socket, data) {
        const { gameId } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        const analysis = gameSession.game.analyzePosition();
        socket.emit('analysis-received', { analysis: analysis });
    }

    /**
     * Handle save game request
     */
    handleSaveGame(socket, data) {
        const { gameId } = data;
        const gameSession = this.activeGames.get(gameId);
        
        if (!gameSession) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }
        
        const gameData = gameSession.game.saveGame();
        socket.emit('game-saved', { gameData: gameData });
    }

    /**
     * Handle load game request
     */
    handleLoadGame(socket, data) {
        const { gameData, playerName } = data;
        
        try {
            const game = HexGame.loadGame(gameData);
            const gameId = this.generateGameId();
            
            const gameSession = {
                game: game,
                players: [{ socket: socket, id: socket.id, name: playerName }],
                spectators: [],
                createdAt: Date.now(),
                isReplay: true
            };
            
            this.activeGames.set(gameId, gameSession);
            socket.join(gameId);
            
            socket.emit('game-loaded', {
                gameId: gameId,
                gameState: this.getGameState(game),
                replayData: game.getReplayData()
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to load game: ' + error.message });
        }
    }

    /**
     * Handle tournament creation
     */
    handleCreateTournament(socket, data) {
        const { name, participants, format = 'round-robin' } = data;
        
        const tournamentId = this.generateGameId();
        const tournament = new Tournament(name, participants, format);
        
        this.tournaments.set(tournamentId, tournament);
        
        socket.emit('tournament-created', {
            tournamentId: tournamentId,
            status: tournament.getStatus()
        });
    }

    /**
     * Get game state for transmission
     */
    getGameState(game) {
        return {
            boardState: game.getBoardState(),
            currentPlayer: game.getCurrentPlayer().number,
            currentPlayerName: game.getCurrentPlayer().name,
            gameOver: game.gameOver,
            winner: game.winner,
            moveHistory: game.getMoveHistory(),
            players: game.players.map(p => ({
                number: p.number,
                name: p.name,
                isHuman: p.isHuman
            }))
        };
    }

    /**
     * Handle player disconnect
     */
    handleDisconnect(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove from waiting queue
        this.handleLeaveQueue(socket);
        
        // Handle active games
        for (const [gameId, gameSession] of this.activeGames) {
            const playerIndex = gameSession.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Notify other players
                socket.to(gameId).emit('player-disconnected', {
                    playerId: socket.id,
                    playerName: gameSession.players[playerIndex].name
                });
                
                // Mark game as abandoned after delay
                setTimeout(() => {
                    if (this.activeGames.has(gameId)) {
                        this.activeGames.delete(gameId);
                    }
                }, 60000); // 1 minute grace period
            }
            
            // Remove from spectators
            gameSession.spectators = gameSession.spectators.filter(s => s.id !== socket.id);
        }
        
        this.playerSessions.delete(socket.id);
    }

    /**
     * Generate unique game ID
     */
    generateGameId() {
        return 'game_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            activeGames: this.activeGames.size,
            waitingPlayers: this.waitingPlayers.length,
            tournaments: this.tournaments.size,
            totalConnections: this.playerSessions.size
        };
    }
}

module.exports = { HexMultiplayerServer };