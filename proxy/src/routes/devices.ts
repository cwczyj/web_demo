import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

const RUSTCODE_HTTP_URL = process.env.RUSTCODE_HTTP_URL || 'http://localhost:8081';
const TIMEOUT_MS = 5000;

export async function devicesRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get('/status', async (_request, reply) => {
    try {
      const response = await fetch(`${RUSTCODE_HTTP_URL}/api/devices`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        fastify.log.warn(`RustCode HTTP API returned ${response.status}`);
        return reply.code(502).send({
          devices: [],
          error: `Backend returned status ${response.status}`,
        });
      }

      const data = await response.json();
      return reply.send(data);
    } catch (error) {
      fastify.log.error(`Failed to fetch device status from RustCode: ${error}`);
      
      if (error instanceof Error && error.name === 'TimeoutError') {
        return reply.code(504).send({
          devices: [],
          error: 'Backend timeout',
        });
      }
      
      return reply.code(503).send({
        devices: [],
        error: 'Backend unavailable',
      });
    }
  });
}
