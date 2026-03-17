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

  /**
   * Add an operation to history
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
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.nextId = 1;
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