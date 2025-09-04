const Fastify = require('fastify');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const start = async () => {
  const fastify = Fastify();

  // const db = await open({
  //   filename: './data.db',
  //   driver: sqlite3.Database,
  // });

  // /**
  //  * @param {import('fastify').FastifyRequest} req
  //  * @param {import('fastify').FastifyReply} reply
  //  */
  // fastify.get('/api/data', async (req, reply) => {
  //   const result = await db.all('SELECT * FROM your_table');
  //   return result;
  // });

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
};

start();