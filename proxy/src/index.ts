import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { signalsRoutes } from './routes/signals.js';
import { devicesRoutes } from './routes/devices.js';

const fastify = Fastify({
  logger: true,
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const TCP_PORT = parseInt(process.env.TCP_PORT || '8080', 10);
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8081', 10);

async function main() {
  // Register CORS
  await fastify.register(cors, {
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Register routes
  await fastify.register(healthRoutes, { prefix: '/api/health' });
  await fastify.register(signalsRoutes, { prefix: '/api/signals' });
  await fastify.register(devicesRoutes, { prefix: '/api/devices' });

  // Root route
  fastify.get('/', async () => {
    return {
      message: 'RoboPLC Proxy Server',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        signals: '/api/signals (GET /read, POST /write)',
        devices: '/api/devices/status',
      },
    };
  });

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Proxy server listening on port ${PORT}`);
    fastify.log.info(`Proxy targets: TCP:${TCP_PORT}, HTTP:${HTTP_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
