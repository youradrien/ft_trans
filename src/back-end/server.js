// imports
const cookie = require('@fastify/cookie');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const multipart = require ('@fastify/multipart');
const websocket = require('@fastify/websocket');

// Configure Pino logger for better structured logging
const isDevelopment = process.env.NODE_ENV !== 'production';

const fastify = require('fastify')({
  logger: isDevelopment ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  } : {
    // Production: output raw JSON for ELK
    level: 'info',
    serializers: {
      req: (request) => ({
        method: request.method,
        url: request.url,
        path: request.routerPath,
        parameters: request.params,
        headers: {
          host: request.headers.host,
          userAgent: request.headers['user-agent'],
          referer: request.headers.referer
        },
        remoteAddress: request.ip,
        remotePort: request.socket?.remotePort
      }),
      res: (reply) => ({
        statusCode: reply.statusCode
      })
    }
  },
  // Request ID generation for tracing
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'request_id',
  disableRequestLogging: false
});
const { db, _INIT_DB } = require('./db.js'); // chemin relatif selon ton projet


// global containers, for rooms ws (accessibles depuis toutes les routes)
fastify.decorate("p_rooms", new Map());   // game rooms -> [player1, player2]
fastify.decorate("p_waitingPlayers", new Map());        // matchId -> game state


// CORS (our frontend)
fastify.register(cors, {
  origin: 'http://localhost:5173', // ✅ must match EXACTLY
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
// JWT
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
fastify.register(cookie);
fastify.register(multipart);
fastify.register(jwt, {
        secret: jwtSecret || 'laclesecrete_a_mettre_dans_fichier_env', // !!!!! ENV !!!
        cookie: {
          cookieName: "token",
          signed : false
        }
});
// websocket
fastify.register(websocket);

// Add request logging hook with enriched context
fastify.addHook('onRequest', async (request, reply) => {
  const logData = {
    event_type: 'request_received',
    method: request.method,
    url: request.url
  };
  // Only add user_id if user is authenticated (keep it as number)
  if (request.user?.id) {
    logData.user_id = request.user.id;
  }
  request.log.info(logData);
});

// Add response logging hook
fastify.addHook('onResponse', async (request, reply) => {
  const logData = {
    event_type: 'request_completed',
    method: request.method,
    url: request.url,
    status_code: reply.statusCode,
    response_time: reply.elapsedTime
  };
  // Only add user_id if user is authenticated (keep it as number)
  if (request.user?.id) {
    logData.user_id = request.user.id;
  }
  request.log.info(logData);
});

// routes (REST api, ws)
fastify.register(require('./routes/users.js'));
fastify.register(require('./routes/pong.js'));


// START SERV, and link db
const start = async () => {
    try {
      await _INIT_DB(); // ✅ DB init here <------------
      await fastify.listen({ port: 3010, host: '0.0.0.0' });
      console.log('🚀 server is running at http://localhost:3010');
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
};
start();
// ! important cuhh
fastify.decorate('db', (db));


// last time seen (user field)
fastify.decorate('updateLastOnline', async function(userId) {
  if (!userId) return; // guard clause

  try {
    await fastify.db.run(
      "UPDATE users SET last_online = datetime('now') WHERE id = ?",
      [userId]
    );
  } catch (err) {
    fastify.log.error(`Failed to update last_online for user ${userId}:`, err);
  }
});

// authentification "middleware"
fastify.decorate("authenticate", async function(request, reply)
{
    try {
        const token = request.cookies.token;
        if (!token)
        {
          return reply.code(401).send({success:false, error:"no_token_in_cookie"})
        }
        const decoded = await request.jwtVerify(token);
        // console.log('Decoded JWT:', decoded);
        request.user = decoded;
        await fastify.updateLastOnline(decoded.id); // Update last_online here
    } catch (err)
    {
        return reply.code(401).send({success:false, error:"invalid_token"})    
    }
});

fastify.decorate('setAuthCookie', function(reply, token) {
  const isProd = process.env.NODE_ENV === 'production';
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path : '/',
    maxAge: 7 * 24 * 60 * 60
  });
  return reply;
});

// Route GET /api (pour tests uniquement)
fastify.get('/api', async (request, reply) => {
  return {
    status: 'ok',
    message: 'pong de ses morts'
  };
});

