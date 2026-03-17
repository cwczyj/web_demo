import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get('/', async () => {
    return {
      status: 'ok',
      tcp_connected: false,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/ready', async () => {
    return {
      ready: true,
      uptime: process.uptime(),
    };
  });
}
