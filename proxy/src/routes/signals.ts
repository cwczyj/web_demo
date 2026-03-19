import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { roboplcTcpClient, JsonRpcError } from '../services/tcp-client.js';
import { operationHistory, type SignalValues } from '../services/history.js';

const DEVICE_ID = 'Test-Dobot';
const READ_GROUP_NAME = 'real_time_position_and_euler';
const WRITE_GROUP_NAME = 'position_and_euler';
const REQUIRED_FIELDS: (keyof SignalValues)[] = ['x_value', 'y_value', 'z_value', 'rx', 'ry', 'rz'];

interface WriteSignalBody {
  x_value?: unknown;
  y_value?: unknown;
  z_value?: unknown;
  rx?: unknown;
  ry?: unknown;
  rz?: unknown;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function validateSignalValues(body: WriteSignalBody): { valid: true; values: SignalValues } | { valid: false; error: string } {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in body)) {
      missingFields.push(field);
    } else if (!isValidNumber(body[field])) {
      invalidFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return { valid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (invalidFields.length > 0) {
    return { valid: false, error: `Invalid number values for fields: ${invalidFields.join(', ')}` };
  }

  return {
    valid: true,
    values: {
      x_value: body.x_value as number,
      y_value: body.y_value as number,
      z_value: body.z_value as number,
      rx: body.rx as number,
      ry: body.ry as number,
      rz: body.rz as number,
    },
  };
}

// Map server response field names to our expected format
// Server response format: {"success":true,"data":{"group_name":"...","result":{"fields":[{"name":"real_time_x_value","value":353.0445},...]}}}
function mapSignalResponse(serverData: Record<string, unknown>): SignalValues {
  const result = serverData.data as Record<string, unknown> | undefined;
  if (!result) {
    return { x_value: 0, y_value: 0, z_value: 0, rx: 0, ry: 0, rz: 0 };
  }

  const innerResult = result.result as Record<string, unknown> | undefined;
  if (!innerResult) {
    return { x_value: 0, y_value: 0, z_value: 0, rx: 0, ry: 0, rz: 0 };
  }

  const fields = innerResult.fields as Array<Record<string, unknown>> | undefined;
  if (!fields) {
    return { x_value: 0, y_value: 0, z_value: 0, rx: 0, ry: 0, rz: 0 };
  }

  const valueMap: Record<string, number> = {};
  for (const field of fields) {
    const name = field.name as string;
    const value = field.value as number;
    if (name && typeof value === 'number') {
      valueMap[name] = value;
    }
  }

  return {
    x_value: valueMap.x_value ?? 0,
    y_value: valueMap.y_value ?? 0,
    z_value: valueMap.z_value ?? 0,
    rx: valueMap.rx ?? 0,
    ry: valueMap.ry ?? 0,
    rz: valueMap.rz ?? 0,
  };
}

export async function signalsRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get('/read', async (_request, reply) => {
    try {
      const result = await roboplcTcpClient.sendRequest<Record<string, unknown>>(
        'read_signal_group',
        {
          device_id: DEVICE_ID,
          group_name: READ_GROUP_NAME,
        }
      );

      const mappedValues = mapSignalResponse(result);
      // 输入寄存器每 10ms 读取一次，但日志每 30s 记录一次
      operationHistory.addReadOperationThrottled(mappedValues, true);

      return {
        success: true,
        data: mappedValues,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // 错误情况总是记录日志
      operationHistory.addOperation('read', undefined, false, errorMessage);

      if (error instanceof JsonRpcError) {
        reply.code(500);
        return {
          success: false,
          error: error.message,
        };
      }

      if (error instanceof Error) {
        if (
          error.message.includes('Connection timeout') ||
          error.message.includes('Socket error') ||
          error.message.includes('No response data') ||
          error.message.includes('Socket closed') ||
          error.message.includes('TCP request failed')
        ) {
          reply.code(503);
          return {
            success: false,
            error: 'Service unavailable: unable to connect to RoboPLC',
          };
        }

        if (error.message.includes('Read timeout')) {
          reply.code(504);
          return {
            success: false,
            error: 'Gateway timeout: RoboPLC response timed out',
          };
        }
      }

      reply.code(500);
      return {
        success: false,
        error: errorMessage,
      };
    }
  });

  fastify.post('/write', async (request, reply) => {
    const body = request.body as WriteSignalBody;
    const validation = validateSignalValues(body);

    if (!validation.valid) {
      operationHistory.addOperation('write', undefined, false, validation.error);
      return reply.status(400).send({
        success: false,
        error: validation.error,
      });
    }

    try {
      const result = await roboplcTcpClient.sendRequest<Record<string, unknown>>('write_signal_group', {
        device_id: DEVICE_ID,
        group_name: WRITE_GROUP_NAME,
        data: validation.values,
      });

      // Server response format: {"success":true,"data":{"group_name":"...","result":{"latency_us":...,"writes":6}}}
      const data = result.data as Record<string, unknown> | undefined;
      const writeSuccess = result.success === true || data?.success === true;
      const innerResult = data?.result;
      
      operationHistory.addOperation('write', validation.values, writeSuccess);
      return reply.status(200).send({
        success: writeSuccess,
        result: innerResult ?? result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operationHistory.addOperation('write', validation.values, false, errorMessage);

      if (error instanceof JsonRpcError) {
        return reply.status(500).send({
          success: false,
          error: errorMessage,
        });
      }

      if (error instanceof Error) {
        if (
          error.message.includes('Connection timeout') ||
          error.message.includes('Socket error') ||
          error.message.includes('No response data') ||
          error.message.includes('Socket closed') ||
          error.message.includes('TCP request failed')
        ) {
          return reply.status(503).send({
            success: false,
            error: 'Service unavailable: unable to connect to RoboPLC',
          });
        }

        if (error.message.includes('Read timeout')) {
          return reply.status(504).send({
            success: false,
            error: 'Gateway timeout: RoboPLC response timed out',
          });
        }
      }

      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  fastify.get('/history', async () => {
    return { history: operationHistory.getHistory() };
  });

  fastify.delete('/history', async () => {
    operationHistory.clearHistory();
    return { success: true };
  });
}