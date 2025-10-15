// imports
const cookie = require('@fastify/cookie');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const multipart = require ('@fastify/multipart');
const fastify = require('fastify')({   logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        colorize : true
      }
    }
  } });
const { _INIT_DB } = require('./db.js'); // chemin relatif selon ton projet

// global containers, for rooms ws (accessibles depuis toutes les routes)
fastify.decorate("roomsMap", new Map());
fastify.decorate("matchsMap", new Map());
fastify.decorate("closedWsUsersSet", new Set());


// register CORS (our frontend)
fastify.register(cors, {
  origin: 'http://localhost:5173', // ✅ must match EXACTLY
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// JWT
fastify.register(cookie);
fastify.register(multipart);
fastify.register(jwt, {
        secret: 'laclesecrete_a_mettre_dans_fichier_env', // !!!!! ENV !!!
        cookie: {
          cookieName: "token",
          signed : false
        }
});


fastify.decorate('setAuthCookie', function setAuthCookie(reply, token) {
  /**
   * Flag indicating whether we're running in prod or dev mode
   * so we can hopefully fix CORS / cookie issues
   * @constant {boolean} isProd - true if NODE_ENV is set to 'production', false otherwise
   * @constant {number} maxAge - 7 days in seconds
   */
  const isProd = process.env.NODE_ENV === 'production';
  reply.setCookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return reply;
});

// register routes
fastify.register(require('./routes/users.js'));
// fastify.register(require('./routes/matchmaking.js'));


// START SERV
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
        request.user = decoded;
        await fastify.updateLastOnline(decoded.id); // Update last_online here
    } catch (err)
    {
        return reply.code(401).send({success:false, error:"invalid_token"})    
    }
});




// Route GET /api (pour tests uniquement)
fastify.get('/api', async (request, reply) => {
  return {
    status: 'ok',
    message: 'pong de ses morts'
  };
});
