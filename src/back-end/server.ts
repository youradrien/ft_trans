// server.js
/*
const Fastify = require('fastify')

const fastify = Fastify({ logger: true })

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
*/
import Fastify from 'fastify';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const start = async () => {
  const fastify = Fastify();

  const db = await open({
    filename: './data.db',
    driver: sqlite3.Database,
  });

  fastify.get('/api/data', async (req, reply) => {
    const result = await db.all('SELECT * FROM your_table');
    return result;
  });

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
};

start();
