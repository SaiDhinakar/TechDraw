import type { Node, Edge } from '@xyflow/react';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  // Save current state to history
  saveState(nodes: Node[], edges: Edge[]): void {
    // Remove any states after current index (for new branch)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now()
    };
    
    // Only save if state is different from current
    if (!this.isStateSame(newState, this.getCurrentState())) {
      this.history.push(newState);
      this.currentIndex++;
      
      // Maintain max history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.currentIndex--;
      }
    }
  }

  // Undo to previous state
  undo(): HistoryState | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.getCurrentState();
    }
    return null;
  }

  // Redo to next state
  redo(): HistoryState | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.getCurrentState();
    }
    return null;
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current state
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Clear history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Initialize with first state
  initialize(nodes: Node[], edges: Edge[]): void {
    this.clear();
    this.saveState(nodes, edges);
  }

  private isStateSame(state1: HistoryState | null, state2: HistoryState | null): boolean {
    if (!state1 || !state2) return false;
    
    return (
      JSON.stringify(state1.nodes) === JSON.stringify(state2.nodes) &&
      JSON.stringify(state1.edges) === JSON.stringify(state2.edges)
    );
  }

  // Get history info for debugging
  getHistoryInfo(): { current: number; total: number; canUndo: boolean; canRedo: boolean } {
    return {
      current: this.currentIndex,
      total: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
}

export const historyManager = new HistoryManager();