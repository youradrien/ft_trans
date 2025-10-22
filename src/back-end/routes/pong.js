const { db } = require('../db.js');
// -------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------
// --------------------------------      PONG                 --------------------------------------------
// -------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------

async function pong_routes(fastify, options)
{
    // PONG DATAS
    fastify.get('/api/pong/status', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        const USER__ID = request.user.id;
        return reply.send({ success: true, data: {
            activeRooms: fastify.p_rooms.size,
            onlinePlayers:  fastify.p_waitingPlayers.size + (fastify.p_rooms.size * 2), // or count from user sessions
            queuedPlayers:  fastify.p_waitingPlayers.size,
            joinedQueue: fastify.p_waitingPlayers.has(USER__ID) ? true : false
        } });
    });


    // PONG MATCHMAKING
    fastify.get('/api/pong/ws', { websocket: true }, async (connection, req) => {
        const { p_waitingPlayers, p_rooms } = fastify;
        let USER_ID;

        // manually authenticate first
        // also parse req to find user id
        try {
            await fastify.authenticate(req);
            USER_ID = req.user.id;
        } catch (err) {
            console.log('JWT verification failed:', err.message);
            connection.socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
            connection.socket.close();
            return;
        }
        
        console.log(`User ${USER_ID} connected via WebSocket`);
        // user is already in room?
        for (const [roomId, players] of fastify.p_rooms.entries()) {
            if (players.includes(USER_ID)) {
                connection.socket.send(JSON.stringify({ type: 'error', message: 'already in a room' }));
                connection.socket.close();
                return;
            }
        }
        // user is already in queue??
        if (fastify.p_waitingPlayers.has(USER_ID)) {
            connection.socket.send(JSON.stringify({ type: 'error', message: 'already in queue' }));
            connection.socket.close();
            return ;
            // return reply.send({ success: false, message: 'already in queue' });
        }
         // add user to waiting queue
        p_waitingPlayers.set(USER_ID, connection.socket);


        // 2 players -> create new game
        const waitingEntries = [...p_waitingPlayers.entries()];
        if (p_waitingPlayers.length >= 2)
        {
            const [p1Id, p1Socket] = waitingEntries[0];
            const [p2Id, p2Socket] = waitingEntries[1];

            p_waitingPlayers.delete(p1Id);
            p_waitingPlayers.delete(p2Id);

            const game_id = `${Date.now()}_${p1Id}_${p2Id}`;
            const game = {
                id: game_id,
                players: [p1Id, p2Id],
                sockets: [p1Socket, p2Socket],
                paddles: { p1: 50, p2: 50 },
                ball: { x: 100, y: 100, vx: 2, vy: 2 },
                scores: { p1: 0, p2: 0 }
            };
            p_rooms.set(game_id, game);

            // notify users w their ws
            p1Socket.send(JSON.stringify({ type: 'start', role: 'p1', game_id }));
            p2Socket.send(JSON.stringify({ type: 'start', role: 'p2', game_id }));

            startGameLoop(game);
        }else{
            connection.socket.send(JSON.stringify({
                type: 'waiting',
                message: 'You joined the queue. Waiting for another player...',
                queueLength: p_waitingPlayers.size
            }));
        }
        // notify everyone: queue/rooms update
        for (const [_id, socket] of p_waitingPlayers.entries()) {
            if(_id !== USER_ID){
                socket.send(JSON.stringify({
                    type: 'waiting-update',
                    message: 'Queue updated',
                    queueLength: p_waitingPlayers.size
                }));
            }
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
            // cleanup from queue
            if (p_waitingPlayers.has(USER_ID)) {
                p_waitingPlayers.delete(USER_ID);
            }
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

