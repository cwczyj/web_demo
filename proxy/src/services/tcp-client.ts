import * as net from 'net';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  m: string;
  p?: Record<string, unknown>;
  i: number;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  r?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number;
  i?: number;
}

/**
 * TCP Client for RoboPLC JSON-RPC communication
 *
 * Protocol Pattern:
 * 1. Connect to TCP server
 * 2. Write JSON request
 * 3. Shutdown write side (signals server we're done sending)
 * 4. Read response until EOF
 * 5. Parse JSON-RPC response
 *
 * This is NOT newline-delimited - the server waits for write shutdown
 * before processing the request.
 */
export class TcpClient {
  private host: string;
  private port: number;
  private connectTimeout: number;
  private readTimeout: number;
  private maxRetries: number;
  private requestId: number = 0;

  constructor(options: {
    host: string;
    port: number;
    connectTimeout?: number;
    readTimeout?: number;
    maxRetries?: number;
  }) {
    this.host = options.host;
    this.port = options.port;
    this.connectTimeout = options.connectTimeout ?? 5000;
    this.readTimeout = options.readTimeout ?? 10000;
    this.maxRetries = options.maxRetries ?? 3;
  }

  private nextId(): number {
    return ++this.requestId;
  }

  async sendRequest<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const id = this.nextId();
    const request: JsonRpcRequest = { jsonrpc: '2.0', m: method, p: params, i: id };
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (error instanceof JsonRpcError) throw error;

        console.warn(`TCP request attempt ${attempt}/${this.maxRetries} failed: ${lastError.message}`);
        if (attempt < this.maxRetries) {
          await this.delay(100 * Math.pow(2, attempt - 1));
        }
      }
    }
    throw new Error(`TCP request failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  private executeRequest<T>(request: JsonRpcRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let responseData = Buffer.alloc(0);
      let connectTimer: NodeJS.Timeout | undefined;
      let readTimer: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (connectTimer) clearTimeout(connectTimer);
        if (readTimer) clearTimeout(readTimer);
        socket.removeAllListeners();
      };

      connectTimer = setTimeout(() => {
        cleanup();
        socket.destroy();
        reject(new Error(`Connection timeout after ${this.connectTimeout}ms`));
      }, this.connectTimeout);

      socket.connect({ host: this.host, port: this.port }, () => {
        clearTimeout(connectTimer);
        readTimer = setTimeout(() => {
          cleanup();
          socket.destroy();
          reject(new Error(`Read timeout after ${this.readTimeout}ms`));
        }, this.readTimeout);

        socket.write(JSON.stringify(request));
        socket.end();
      });

      socket.on('data', (data: Buffer) => {
        responseData = Buffer.concat([responseData, data]);
      });

      socket.on('close', (hadError) => {
        cleanup();
        if (hadError) return reject(new Error('Socket closed with error'));
        if (responseData.length === 0) return reject(new Error('No response data received'));

        try {
          const response: JsonRpcResponse<T> = JSON.parse(responseData.toString('utf-8'));
          if (response.jsonrpc !== '2.0') return reject(new Error('Invalid JSON-RPC response'));
          
          const responseId = response.id ?? response.i ?? 0;
          if (responseId !== request.i) return reject(new Error(`Response ID mismatch`));
          if (response.error) return reject(new JsonRpcError(response.error.code, response.error.message, response.error.data));
          
          const result = response.result ?? response.r;
          if (result === undefined) return reject(new Error('No result in response'));
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      socket.on('error', (err) => {
        cleanup();
        reject(new Error(`Socket error: ${err.message}`));
      });
    });
  }

  close(): void {}

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class JsonRpcError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(`JSON-RPC Error ${code}: ${message}`);
    this.name = 'JsonRpcError';
  }
}

export const roboplcTcpClient = new TcpClient({
  host: process.env.TCP_HOST || 'localhost',
  port: parseInt(process.env.TCP_PORT || '8080', 10),
  connectTimeout: 5000,
  readTimeout: 10000,
  maxRetries: 3,
});