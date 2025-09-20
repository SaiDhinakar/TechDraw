import { storageManager, type UserPreferences } from './storage';

interface APIKeys {
  openrouter?: string;
  groq?: string;
  gemini?: string;
}

class SettingsService {
  private apiKeys: APIKeys = {};
  private preferences: UserPreferences | null = null;

  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.preferences = await storageManager.getPreferences();
      if (this.preferences?.apiKeys) {
        this.apiKeys = this.preferences.apiKeys;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveAPIKey(provider: keyof APIKeys, apiKey: string): Promise<void> {
    this.apiKeys[provider] = apiKey;
    await this.saveSettings();
  }

  getAPIKey(provider: keyof APIKeys): string | undefined {
    return this.apiKeys[provider];
  }

  async removeAPIKey(provider: keyof APIKeys): Promise<void> {
    delete this.apiKeys[provider];
    await this.saveSettings();
  }

  hasAPIKey(provider: keyof APIKeys): boolean {
    return !!this.apiKeys[provider];
  }

  getAllAPIKeys(): APIKeys {
    return { ...this.apiKeys };
  }

  private async saveSettings(): Promise<void> {
    try {
      const currentPreferences = await storageManager.getPreferences();
      const updatedPreferences: UserPreferences = {
        theme: currentPreferences?.theme || 'light',
        defaultNodeStyle: currentPreferences?.defaultNodeStyle || {},
        defaultEdgeStyle: currentPreferences?.defaultEdgeStyle || {},
        aiProvider: currentPreferences?.aiProvider || 'openrouter',
        apiKeys: this.apiKeys,
        autoSave: currentPreferences?.autoSave ?? true,
        gridSnap: currentPreferences?.gridSnap ?? true,
      };

      await storageManager.savePreferences(updatedPreferences);
      this.preferences = updatedPreferences;
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async getPreferences(): Promise<UserPreferences | null> {
    if (!this.preferences) {
      await this.loadSettings();
    }
    return this.preferences;
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();
    const updated: UserPreferences = {
      theme: updates.theme ?? current?.theme ?? 'light',
      defaultNodeStyle: updates.defaultNodeStyle ?? current?.defaultNodeStyle ?? {},
      defaultEdgeStyle: updates.defaultEdgeStyle ?? current?.defaultEdgeStyle ?? {},
      aiProvider: updates.aiProvider ?? current?.aiProvider ?? 'openrouter',
      apiKeys: updates.apiKeys ?? current?.apiKeys ?? {},
      autoSave: updates.autoSave ?? current?.autoSave ?? true,
      gridSnap: updates.gridSnap ?? current?.gridSnap ?? true,
    };

    await storageManager.savePreferences(updated);
    this.preferences = updated;
    
    // Update local API keys
    if (updates.apiKeys) {
      this.apiKeys = updates.apiKeys;
    }
  }
}

export const settingsService = new SettingsService();