import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { iconManager, type IconCategory } from '../lib/icons';
import type { Icon } from '../lib/storage';
import { cn } from '../lib/utils';

interface IconPickerProps {
  selectedIcon?: Icon | null;
  onIconSelect: (icon: Icon | null) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconSelect,
  placeholder = 'Select an icon',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && icons.length === 0) {
      loadIcons();
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      filterIcons();
    }
  }, [selectedCategory, searchQuery, isOpen]);

  const loadIcons = async () => {
    setLoading(true);
    try {
      const allIcons = await iconManager.getAllIcons();
      setIcons(allIcons);
    } catch (error) {
      console.error('Failed to load icons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = () => {
    const cats = iconManager.getCategories();
    setCategories(cats);
  };

  const filterIcons = async () => {
    try {
      let filtered: Icon[];
      
      if (searchQuery) {
        filtered = await iconManager.searchIcons(searchQuery);
      } else if (selectedCategory === 'all') {
        filtered = await iconManager.getAllIcons();
      } else {
        filtered = await iconManager.getIconsByCategory(selectedCategory);
      }
      
      setIcons(filtered);
    } catch (error) {
      console.error('Failed to filter icons:', error);
    }
  };

  const handleIconSelect = (icon: Icon) => {
    onIconSelect(icon);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onIconSelect(null);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 border border-gray-300 rounded-md bg-white text-left w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          sizeClasses[size]
        )}
      >
        {selectedIcon ? (
          <>
            <img
              src={selectedIcon.data}
              alt={selectedIcon.name}
              className="flex-shrink-0 object-contain"
              style={{ width: iconSizes[size], height: iconSizes[size] }}
            />
            <span className="flex-1 truncate">{selectedIcon.name}</span>
          </>
        ) : (
          <span className="flex-1 text-gray-500">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'flex-shrink-0 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
          size={16}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-hidden">
            <div className="p-3 border-b">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Icons Grid */}
            <div className="p-2 overflow-y-auto max-h-64">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : icons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No icons found</p>
                </div>
              ) : (
                <>
                  {/* Clear Selection Option */}
                  <div
                    onClick={handleClearSelection}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded text-sm text-gray-600 mb-2 border-b"
                  >
                    <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs">None</span>
                    </div>
                    <span>No icon</span>
                  </div>

                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 gap-1">
                    {icons.map(icon => (
                      <div
                        key={icon.id}
                        onClick={() => handleIconSelect(icon)}
                        className={cn(
                          'p-2 rounded cursor-pointer transition-colors aspect-square flex items-center justify-center',
                          selectedIcon?.id === icon.id
                            ? 'bg-primary-100 border border-primary-300'
                            : 'hover:bg-gray-50 border border-transparent'
                        )}
                        title={icon.name}
                      >
                        <img
                          src={icon.data}
                          alt={icon.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};