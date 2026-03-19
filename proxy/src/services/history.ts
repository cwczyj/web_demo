/**
 * In-memory operation history service
 * Stores the last 100 operations (read/write) for debugging/monitoring
 */

export interface SignalValues {
  x_value: number;
  y_value: number;
  z_value: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  type: 'read' | 'write';
  values?: SignalValues;
  success: boolean;
  error?: string;
}

const MAX_HISTORY_SIZE = 100;

class OperationHistory {
  private history: HistoryEntry[] = [];
  private nextId: number = 1;
  private lastReadLogTime: number = 0;
  private readLogInterval: number = 30000; // 30s 记录一次读操作日志

  /**
   * 添加操作到历史（无节流）
   */
  addOperation(
    type: 'read' | 'write',
    values: SignalValues | undefined,
    success: boolean,
    error?: string
  ): HistoryEntry {
    const entry: HistoryEntry = {
      id: this.nextId++,
      timestamp: new Date().toISOString(),
      type,
      values,
      success,
      error,
    };

    this.history.push(entry);

    // Keep only the last MAX_HISTORY_SIZE entries
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(-MAX_HISTORY_SIZE);
    }

    return entry;
  }

  /**
   * Get all history entries
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * 添加读操作到历史（30s 节流，避免频繁重复记录）
   * @returns 如果记录了操作则返回 true，否则返回 false
   */
  addReadOperationThrottled(
    values: SignalValues | undefined,
    success: boolean,
    error?: string
  ): boolean {
    const now = Date.now();
    if (now - this.lastReadLogTime >= this.readLogInterval) {
      this.lastReadLogTime = now;
      this.addOperation('read', values, success, error);
      return true;
    }
    return false;
  }

  /**
   * 设置读操作日志记录间隔（毫秒）
   */
  setReadLogInterval(intervalMs: number): void {
    this.readLogInterval = intervalMs;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.nextId = 1;
    this.lastReadLogTime = 0;
  }

  /**
   * Get history count
   */
  getCount(): number {
    return this.history.length;
  }
}

// Singleton instance
export const operationHistory = new OperationHistory();