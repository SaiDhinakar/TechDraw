import { openDB, type IDBPDatabase } from 'idb';

export interface Diagram {
  id: string;
  name: string;
  description?: string;
  diagramType?: 'container' | 'architecture' | 'flowchart';
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface Icon {
  id: string;
  name: string;
  category: string;
  format: 'png' | 'svg' | 'jpg';
  data: string; // base64 encoded
  size: number;
  createdAt: Date;
  tags?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultNodeStyle: any;
  defaultEdgeStyle: any;
  aiProvider: 'openrouter' | 'groq' | 'gemini';
  apiKeys: {
    openrouter?: string;
    groq?: string;
    gemini?: string;
  };
  autoSave: boolean;
  gridSnap: boolean;
}

const DB_NAME = 'techdraw';
const DB_VERSION = 1;
const STORES = {
  DIAGRAMS: 'diagrams',
  ICONS: 'icons',
  PREFERENCES: 'preferences',
} as const;

class StorageManager {
  private db: IDBPDatabase | null = null;
  private fallbackToLocalStorage = false;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Diagrams store
          if (!db.objectStoreNames.contains(STORES.DIAGRAMS)) {
            const diagramStore = db.createObjectStore(STORES.DIAGRAMS, { keyPath: 'id' });
            diagramStore.createIndex('name', 'name', { unique: false });
            diagramStore.createIndex('createdAt', 'createdAt', { unique: false });
            diagramStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }

          // Icons store
          if (!db.objectStoreNames.contains(STORES.ICONS)) {
            const iconStore = db.createObjectStore(STORES.ICONS, { keyPath: 'id' });
            iconStore.createIndex('category', 'category', { unique: false });
            iconStore.createIndex('name', 'name', { unique: false });
            iconStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }

          // Preferences store
          if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
            db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error);
      this.fallbackToLocalStorage = true;
    }
  }

  // Diagram methods
  async saveDiagram(diagram: Omit<Diagram, 'createdAt' | 'updatedAt'>): Promise<Diagram> {
    const now = new Date();
    const diagramWithTimestamps: Diagram = {
      ...diagram,
      createdAt: now,
      updatedAt: now,
    };

    if (this.fallbackToLocalStorage) {
      const diagrams = this.getLocalStorageArray('diagrams');
      const existingIndex = diagrams.findIndex((d: Diagram) => d.id === diagram.id);

      if (existingIndex >= 0) {
        diagrams[existingIndex] = { ...diagramWithTimestamps, createdAt: diagrams[existingIndex].createdAt };
      } else {
        diagrams.push(diagramWithTimestamps);
      }

      localStorage.setItem('diagrams', JSON.stringify(diagrams));
      return diagramWithTimestamps;
    }

    if (!this.db) throw new Error('Database not initialized');

    const existingDiagram = await this.db.get(STORES.DIAGRAMS, diagram.id);
    const finalDiagram = {
      ...diagramWithTimestamps,
      createdAt: existingDiagram?.createdAt || now,
    };

    await this.db.put(STORES.DIAGRAMS, finalDiagram);
    return finalDiagram;
  }

  async getDiagram(id: string): Promise<Diagram | null> {
    if (this.fallbackToLocalStorage) {
      const diagrams = this.getLocalStorageArray('diagrams');
      return diagrams.find((d: Diagram) => d.id === id) || null;
    }

    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get(STORES.DIAGRAMS, id) || null;
  }

  async getAllDiagrams(): Promise<Diagram[]> {
    if (this.fallbackToLocalStorage) {
      return this.getLocalStorageArray('diagrams');
    }

    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll(STORES.DIAGRAMS);
  }

  async deleteDiagram(id: string): Promise<void> {
    if (this.fallbackToLocalStorage) {
      const diagrams = this.getLocalStorageArray('diagrams');
      const filtered = diagrams.filter((d: Diagram) => d.id !== id);
      localStorage.setItem('diagrams', JSON.stringify(filtered));
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete(STORES.DIAGRAMS, id);
  }

  // Icon methods
  async saveIcon(icon: Omit<Icon, 'createdAt'>): Promise<Icon> {
    const iconWithTimestamp: Icon = {
      ...icon,
      createdAt: new Date(),
    };

    if (this.fallbackToLocalStorage) {
      const icons = this.getLocalStorageArray('icons');
      const existingIndex = icons.findIndex((i: Icon) => i.id === icon.id);

      if (existingIndex >= 0) {
        icons[existingIndex] = iconWithTimestamp;
      } else {
        icons.push(iconWithTimestamp);
      }

      localStorage.setItem('icons', JSON.stringify(icons));
      return iconWithTimestamp;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.put(STORES.ICONS, iconWithTimestamp);
    return iconWithTimestamp;
  }

  async getIcon(id: string): Promise<Icon | null> {
    if (this.fallbackToLocalStorage) {
      const icons = this.getLocalStorageArray('icons');
      return icons.find((i: Icon) => i.id === id) || null;
    }

    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get(STORES.ICONS, id) || null;
  }

  async getIconsByCategory(category: string): Promise<Icon[]> {
    if (this.fallbackToLocalStorage) {
      const icons = this.getLocalStorageArray('icons');
      return icons.filter((i: Icon) => i.category === category);
    }

    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex(STORES.ICONS, 'category', category);
  }

  async getAllIcons(): Promise<Icon[]> {
    if (this.fallbackToLocalStorage) {
      return this.getLocalStorageArray('icons');
    }

    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAll(STORES.ICONS);
  }

  async deleteIcon(id: string): Promise<void> {
    if (this.fallbackToLocalStorage) {
      const icons = this.getLocalStorageArray('icons');
      const filtered = icons.filter((i: Icon) => i.id !== id);
      localStorage.setItem('icons', JSON.stringify(filtered));
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete(STORES.ICONS, id);
  }

  // Preferences methods
  async savePreferences(preferences: UserPreferences): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.setItem('preferences', JSON.stringify(preferences));
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    await this.db.put(STORES.PREFERENCES, { key: 'userPreferences', value: preferences });
  }

  async getPreferences(): Promise<UserPreferences | null> {
    if (this.fallbackToLocalStorage) {
      const stored = localStorage.getItem('preferences');
      return stored ? JSON.parse(stored) : null;
    }

    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.get(STORES.PREFERENCES, 'userPreferences');
    return result?.value || null;
  }

  // Utility methods
  private getLocalStorageArray(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Error parsing localStorage ${key}:`, error);
      return [];
    }
  }

  async exportData(): Promise<{ diagrams: Diagram[]; icons: Icon[]; preferences: UserPreferences | null }> {
    const [diagrams, icons, preferences] = await Promise.all([
      this.getAllDiagrams(),
      this.getAllIcons(),
      this.getPreferences(),
    ]);

    return { diagrams, icons, preferences };
  }

  async importData(data: { diagrams?: Diagram[]; icons?: Icon[]; preferences?: UserPreferences }): Promise<void> {
    if (data.diagrams) {
      for (const diagram of data.diagrams) {
        await this.saveDiagram(diagram);
      }
    }

    if (data.icons) {
      for (const icon of data.icons) {
        await this.saveIcon(icon);
      }
    }

    if (data.preferences) {
      await this.savePreferences(data.preferences);
    }
  }

  async clearAllData(): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.removeItem('diagrams');
      localStorage.removeItem('icons');
      localStorage.removeItem('preferences');
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([STORES.DIAGRAMS, STORES.ICONS, STORES.PREFERENCES], 'readwrite');
    await Promise.all([
      transaction.objectStore(STORES.DIAGRAMS).clear(),
      transaction.objectStore(STORES.ICONS).clear(),
      transaction.objectStore(STORES.PREFERENCES).clear(),
    ]);
  }

  get isUsingLocalStorage(): boolean {
    return this.fallbackToLocalStorage;
  }
}

export const storageManager = new StorageManager();