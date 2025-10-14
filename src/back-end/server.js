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

// register CORS
fastify.register(cors, {
  origin:['https://localhost:4430'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
// fastify.listen({ port: 3010, host: '0.0.0.0' }, function (err, address) {
//   if (err) {
//     fastify.log.error(err)
//     process.exit(1)
//   }
// })

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
