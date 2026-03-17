/**
 * TCP Client Service for RoboPLC JSON-RPC communication
 * 
 * Pattern: JSON send/receive with write shutdown
 * (Not newline-delimited like gRPC)
 */
export class TcpClient {
  constructor(_host: string, _port: number) {}

  /**
   * Send JSON-RPC request and await response
   * Pattern: send JSON → shutdown write → receive JSON response
   */
  async sendRequest<T>(method: string, params?: unknown): Promise<T> {
    // TODO: Implement actual TCP socket communication
    // For now, return placeholder
    return { success: true, method, params } as T;
  }

  /**
   * Get signal data from device
   */
  async getSignal(_deviceId: string, _signalGroup: string, _field: string): Promise<number | null> {
    // TODO: Implement signal fetching
    return null;
  }
}

/**
 * HTTP Client Service for RoboPLC HTTP API
 */
export class HttpClient {
  private baseUrl: string;

  constructor(host: string, port: number) {
    this.baseUrl = `http://${host}:${port}`;
  }

  async get<T>(path: string): Promise<T> {
    // TODO: Implement HTTP fetch
    const response = await fetch(`${this.baseUrl}${path}`);
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    // TODO: Implement HTTP POST
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json() as Promise<T>;
  }
}
