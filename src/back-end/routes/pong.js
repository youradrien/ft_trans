const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { pipeline } = require ('stream/promises');
const { db } = require('../db.js'); // chemin relatif selon ton projet

// -------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------
// --------------------------------      PONG                 --------------------------------------------
// -------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------

async function pong_routes(fastify, options)
{
    // PONG DATAS
    fastify.get('/api/pong/status', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        return reply.send({ success: true, data: {
            activeRooms: fastify.p_rooms.size,
            onlinePlayers: (14) + fastify.p_rooms.size * 2 // or count from user sessions
        } });
    });


    // PONG MATCHMAKING
    fastify.get('/api/pong', { websocket: true }, async (connection, req) => {
        const { p_waitingPlayers, p_rooms } = fastify;
        // manually authenticate first
        try {
            await fastify.authenticate(req);
        } catch (err) {
            connection.socket.close(); // Close socket if not authenticated
            return;
        }

        console.log('Player connected');
        const user = req.user; // comes from jwtVerify()
        console.log('Authenticated user:', user.id);

        // push player to waiting queue
        p_waitingPlayers.push(connection.socket);

        // 2 players -> create new game
        if (p_waitingPlayers.length >= 2)
        {
            const player1 = p_waitingPlayers.shift();
            const player2 = p_waitingPlayers.shift();
            const gameId = Date.now().toString();
            const game = {
                id: gameId,
                players: [player1, player2],
                paddles: { p1: 50, p2: 50 },
                ball: { x: 100, y: 100, vx: 2, vy: 2 },
                scores: { p1: 0, p2: 0 }
            };
            p_rooms.set(gameId, game);

            player1.send(JSON.stringify({ type: 'start', role: 'p1', gameId }));
            player2.send(JSON.stringify({ type: 'start', role: 'p2', gameId }));
            startGameLoop(game);
        }

        // incoming messages from players
        connection.socket.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                const game = p_rooms.get(data.gameId);
                if (!game) return;

                if (data.type === 'paddle_move') {
                    game.paddles[data.role] = data.position;
                }
            } catch (err) {
                console.error('Invalid message:', message);
            }
        });

        connection.socket.on('close', () => {
            console.log('Player disconnected');
            // TODO: Handle disconnection, cleanup, etc.
        });
    });
}
module.exports = pong_routes;

function startGameLoop(game){
  const interval = setInterval(() => {
        // Simple ball physics
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;

        // Bounce off top/bottom
        if (game.ball.y <= 0 || game.ball.y >= 200) {
        game.ball.vy *= -1;
        }

        // Bounce or score
        if (game.ball.x <= 0) {
        game.scores.p2++;
        resetBall(game);
        } else if (game.ball.x >= 300) {
        game.scores.p1++;
        resetBall(game);
        }

        // Broadcast game state to both players
        const payload = JSON.stringify({
        type: 'state',
        ball: game.ball,
        paddles: game.paddles,
        scores: game.scores
        });

        game.players.forEach(socket => {
        if (socket.readyState === 1) { // WebSocket.OPEN
            socket.send(payload);
        }
        });
  }, 1000 / 60); // 60 FPS

  // Optionally store interval in game to clear it later
  game.interval = interval;
}

function resetBall(game) {
  game.ball.x = 150;
  game.ball.y = 100;
  game.ball.vx *= -1; // send toward scoring player
  game.ball.vy = (Math.random() - 0.5) * 4;
}

