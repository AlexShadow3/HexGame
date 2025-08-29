const { HexGame } = require('./HexGame');
const { Player, AIPlayer } = require('./Player');

/**
 * Tournament system for managing multiple Hex games
 */
class Tournament {
    constructor(name, participants, format = 'round-robin') {
        this.name = name;
        this.participants = participants;
        this.format = format;
        this.games = [];
        this.results = {};
        this.standings = [];
        this.completed = false;
        this.currentRound = 0;
        this.rounds = [];
        
        this.initializeResults();
        this.generateSchedule();
    }

    /**
     * Initialize results tracking for all participants
     */
    initializeResults() {
        for (const participant of this.participants) {
            this.results[participant.name] = {
                wins: 0,
                losses: 0,
                draws: 0,
                points: 0,
                gamesPlayed: 0
            };
        }
    }

    /**
     * Generate tournament schedule based on format
     */
    generateSchedule() {
        switch (this.format) {
            case 'round-robin':
                this.generateRoundRobinSchedule();
                break;
            case 'single-elimination':
                this.generateSingleEliminationSchedule();
                break;
            case 'swiss':
                this.generateSwissSchedule();
                break;
            default:
                throw new Error(`Unknown tournament format: ${this.format}`);
        }
    }

    /**
     * Generate round-robin schedule (everyone plays everyone)
     */
    generateRoundRobinSchedule() {
        const participants = [...this.participants];
        
        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const game1 = {
                    player1: participants[i],
                    player2: participants[j],
                    gameId: this.games.length + 1,
                    round: 1,
                    completed: false,
                    result: null
                };
                
                // Second game with colors swapped
                const game2 = {
                    player1: participants[j],
                    player2: participants[i],
                    gameId: this.games.length + 2,
                    round: 2,
                    completed: false,
                    result: null
                };
                
                this.games.push(game1, game2);
            }
        }
        
        this.rounds = this.organizegamesIntoRounds();
    }

    /**
     * Generate single elimination bracket
     */
    generateSingleEliminationSchedule() {
        const participants = [...this.participants];
        let round = 1;
        let currentParticipants = participants;
        
        while (currentParticipants.length > 1) {
            const roundGames = [];
            const nextRoundParticipants = [];
            
            for (let i = 0; i < currentParticipants.length; i += 2) {
                if (i + 1 < currentParticipants.length) {
                    const game = {
                        player1: currentParticipants[i],
                        player2: currentParticipants[i + 1],
                        gameId: this.games.length + 1,
                        round: round,
                        completed: false,
                        result: null,
                        isElimination: true
                    };
                    
                    this.games.push(game);
                    roundGames.push(game);
                } else {
                    // Bye - player advances automatically
                    nextRoundParticipants.push(currentParticipants[i]);
                }
            }
            
            round++;
            currentParticipants = nextRoundParticipants;
        }
    }

    /**
     * Generate Swiss system schedule (partial implementation)
     */
    generateSwissSchedule() {
        // Swiss system generates pairings round by round based on current standings
        // This is a simplified version - just generates first round
        const participants = [...this.participants];
        
        for (let i = 0; i < participants.length; i += 2) {
            if (i + 1 < participants.length) {
                const game = {
                    player1: participants[i],
                    player2: participants[i + 1],
                    gameId: this.games.length + 1,
                    round: 1,
                    completed: false,
                    result: null
                };
                
                this.games.push(game);
            }
        }
    }

    /**
     * Organize games into rounds for round-robin
     */
    organizegamesIntoRounds() {
        const rounds = {};
        
        for (const game of this.games) {
            if (!rounds[game.round]) {
                rounds[game.round] = [];
            }
            rounds[game.round].push(game);
        }
        
        return rounds;
    }

    /**
     * Play a specific game
     */
    async playGame(gameIndex, boardSize = 11, boardShape = 'hexagon') {
        if (gameIndex >= this.games.length) {
            throw new Error('Invalid game index');
        }
        
        const gameInfo = this.games[gameIndex];
        if (gameInfo.completed) {
            throw new Error('Game already completed');
        }
        
        // Create game with tournament participants
        const game = new HexGame(boardSize, 'tournament', boardShape);
        game.players = [
            this.createTournamentPlayer(gameInfo.player1, 1),
            this.createTournamentPlayer(gameInfo.player2, 2)
        ];
        
        // Auto-play if both are AI
        if (!game.players[0].isHuman && !game.players[1].isHuman) {
            while (!game.gameOver) {
                const currentPlayer = game.getCurrentPlayer();
                const move = currentPlayer.makeMove(game.board);
                if (move) {
                    game.makeMove(move.row, move.col);
                }
            }
        }
        
        // Record result
        gameInfo.completed = true;
        gameInfo.result = {
            winner: game.winner,
            moveCount: game.moveHistory.length,
            gameData: game.saveGame()
        };
        
        this.updateResults(gameInfo);
        this.updateStandings();
        
        return gameInfo;
    }

    /**
     * Create a player for tournament based on participant info
     */
    createTournamentPlayer(participant, playerNumber) {
        if (participant.isHuman) {
            return new Player(playerNumber, participant.name, true);
        } else {
            return new AIPlayer(playerNumber, participant.name, participant.difficulty || 'medium');
        }
    }

    /**
     * Update results after a game
     */
    updateResults(gameInfo) {
        const player1Stats = this.results[gameInfo.player1.name];
        const player2Stats = this.results[gameInfo.player2.name];
        
        player1Stats.gamesPlayed++;
        player2Stats.gamesPlayed++;
        
        if (gameInfo.result.winner) {
            if (gameInfo.result.winner.number === 1) {
                player1Stats.wins++;
                player1Stats.points += 3;
                player2Stats.losses++;
            } else {
                player2Stats.wins++;
                player2Stats.points += 3;
                player1Stats.losses++;
            }
        } else {
            // Draw
            player1Stats.draws++;
            player1Stats.points += 1;
            player2Stats.draws++;
            player2Stats.points += 1;
        }
    }

    /**
     * Update tournament standings
     */
    updateStandings() {
        this.standings = Object.keys(this.results).map(name => ({
            name: name,
            ...this.results[name],
            winRate: this.results[name].gamesPlayed > 0 ? 
                (this.results[name].wins / this.results[name].gamesPlayed * 100).toFixed(1) : '0.0'
        }));
        
        // Sort by points, then by win rate
        this.standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return parseFloat(b.winRate) - parseFloat(a.winRate);
        });
        
        // Check if tournament is completed
        this.completed = this.games.every(game => game.completed);
    }

    /**
     * Get current tournament status
     */
    getStatus() {
        const totalGames = this.games.length;
        const completedGames = this.games.filter(g => g.completed).length;
        
        return {
            name: this.name,
            format: this.format,
            participants: this.participants.length,
            totalGames: totalGames,
            completedGames: completedGames,
            progress: totalGames > 0 ? (completedGames / totalGames * 100).toFixed(1) : '0.0',
            completed: this.completed,
            standings: this.standings
        };
    }

    /**
     * Get next game to be played
     */
    getNextGame() {
        return this.games.find(game => !game.completed);
    }

    /**
     * Play all remaining games automatically (for AI tournaments)
     */
    async playAllGames(boardSize = 11, boardShape = 'hexagon') {
        for (let i = 0; i < this.games.length; i++) {
            if (!this.games[i].completed) {
                await this.playGame(i, boardSize, boardShape);
            }
        }
        
        return this.getStatus();
    }

    /**
     * Export tournament results
     */
    exportResults() {
        return {
            tournament: {
                name: this.name,
                format: this.format,
                completed: this.completed,
                participants: this.participants.length
            },
            standings: this.standings,
            games: this.games.map(game => ({
                gameId: game.gameId,
                round: game.round,
                player1: game.player1.name,
                player2: game.player2.name,
                completed: game.completed,
                winner: game.result?.winner?.name || null,
                moves: game.result?.moveCount || 0
            })),
            summary: this.getStatus()
        };
    }
}

module.exports = { Tournament };