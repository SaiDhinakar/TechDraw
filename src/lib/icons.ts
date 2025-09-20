import { storageManager, type Icon } from './storage';
import { generateId, validateImageFile, fileToBase64 } from './utils';

export interface IconCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export const DEFAULT_CATEGORIES: IconCategory[] = [
  { id: 'general', name: 'General', description: 'General purpose icons', color: '#64748b' },
  { id: 'technology', name: 'Technology', description: 'Tech and software icons', color: '#3b82f6' },
  { id: 'business', name: 'Business', description: 'Business and finance icons', color: '#10b981' },
  { id: 'ui', name: 'UI Elements', description: 'User interface icons', color: '#8b5cf6' },
  { id: 'arrows', name: 'Arrows', description: 'Arrow and direction icons', color: '#f59e0b' },
  { id: 'shapes', name: 'Shapes', description: 'Basic geometric shapes', color: '#ef4444' },
  { id: 'people', name: 'People', description: 'People and users', color: '#06b6d4' },
  { id: 'devices', name: 'Devices', description: 'Hardware and devices', color: '#84cc16' },
];

class IconManager {
  private categories: IconCategory[] = DEFAULT_CATEGORIES;

  async initialize(): Promise<void> {
    // Load any existing icons and set up default categories if needed
    await this.loadDefaultIcons();
  }

  async uploadIcon(file: File, category: string, tags: string[] = []): Promise<Icon> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const base64Data = await fileToBase64(file);
    const icon: Omit<Icon, 'createdAt'> = {
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      category,
      format: this.getFormatFromMimeType(file.type),
      data: base64Data,
      size: file.size,
      tags,
    };

    return await storageManager.saveIcon(icon);
  }

  async uploadMultipleIcons(files: File[], category: string, tags: string[] = []): Promise<Icon[]> {
    const icons: Icon[] = [];
    
    for (const file of files) {
      try {
        const icon = await this.uploadIcon(file, category, tags);
        icons.push(icon);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
    
    return icons;
  }

  async getIconsByCategory(category: string): Promise<Icon[]> {
    return await storageManager.getIconsByCategory(category);
  }

  async getAllIcons(): Promise<Icon[]> {
    return await storageManager.getAllIcons();
  }

  async searchIcons(query: string): Promise<Icon[]> {
    const allIcons = await this.getAllIcons();
    const lowercaseQuery = query.toLowerCase();
    
    return allIcons.filter(icon => 
      icon.name.toLowerCase().includes(lowercaseQuery) ||
      icon.category.toLowerCase().includes(lowercaseQuery) ||
      icon.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async deleteIcon(id: string): Promise<void> {
    return await storageManager.deleteIcon(id);
  }

  async updateIconMetadata(id: string, updates: Partial<Pick<Icon, 'name' | 'category' | 'tags'>>): Promise<Icon | null> {
    const existing = await storageManager.getIcon(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    return await storageManager.saveIcon(updated);
  }

  async createCustomCategory(category: Omit<IconCategory, 'id'>): Promise<IconCategory> {
    const newCategory: IconCategory = {
      ...category,
      id: generateId(),
    };
    
    this.categories.push(newCategory);
    return newCategory;
  }

  getCategories(): IconCategory[] {
    return this.categories;
  }

  getCategoryById(id: string): IconCategory | undefined {
    return this.categories.find(cat => cat.id === id);
  }

  private getFormatFromMimeType(mimeType: string): 'png' | 'svg' | 'jpg' {
    switch (mimeType) {
      case 'image/svg+xml':
        return 'svg';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
      default:
        return 'png';
    }
  }

  private async loadDefaultIcons(): Promise<void> {
    // Check if we need to load default icons from the existing icons folder
    const existingIcons = await this.getAllIcons();
    if (existingIcons.length > 0) return;

    // In a real implementation, you might want to load default icons
    // For now, we'll just ensure the categories are available
    console.log('Icon manager initialized with', this.categories.length, 'categories');
  }

  async exportIcons(): Promise<Blob> {
    const icons = await this.getAllIcons();
    const exportData = {
      icons,
      categories: this.categories,
      exported: new Date().toISOString(),
    };
    
    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  }

  async importIcons(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      let imported = 0;
      const errors: string[] = [];
      
      if (data.icons && Array.isArray(data.icons)) {
        for (const iconData of data.icons) {
          try {
            await storageManager.saveIcon(iconData);
            imported++;
          } catch (error) {
            errors.push(`Failed to import icon ${iconData.name}: ${error}`);
          }
        }
      }
      
      return { imported, errors };
    } catch (error) {
      throw new Error('Invalid import file format');
    }
  }

  // Utility methods for icon rendering
  renderIconAsDataUrl(icon: Icon): string {
    return icon.data;
  }

  createIconElement(icon: Icon, size: number = 24): HTMLElement {
    const element = document.createElement(icon.format === 'svg' ? 'div' : 'img');
    
    if (icon.format === 'svg') {
      // For SVG, we need to extract the SVG content from the data URL
      const svgContent = atob(icon.data.split(',')[1]);
      element.innerHTML = svgContent;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
    } else {
      (element as HTMLImageElement).src = icon.data;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
    }
    
    element.className = 'icon-element';
    element.title = icon.name;
    
    return element;
  }

  getIconStats(): Promise<{
    totalIcons: number;
    iconsByCategory: Record<string, number>;
    totalSize: number;
    formatBreakdown: Record<string, number>;
  }> {
    return this.getAllIcons().then(icons => {
      const iconsByCategory: Record<string, number> = {};
      const formatBreakdown: Record<string, number> = {};
      let totalSize = 0;

      icons.forEach(icon => {
        iconsByCategory[icon.category] = (iconsByCategory[icon.category] || 0) + 1;
        formatBreakdown[icon.format] = (formatBreakdown[icon.format] || 0) + 1;
        totalSize += icon.size;
      });

      return {
        totalIcons: icons.length,
        iconsByCategory,
        totalSize,
        formatBreakdown,
      };
    });
  }
}

export const iconManager = new IconManager();