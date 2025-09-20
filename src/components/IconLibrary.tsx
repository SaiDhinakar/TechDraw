import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Search, 
  Upload, 
  Grid3X3, 
  List, 
  Filter, 
  Trash2, 
  Image as ImageIcon
} from 'lucide-react';
import { iconManager, type IconCategory } from '../lib/icons';
import type { Icon } from '../lib/storage';
import { formatFileSize, cn } from '../lib/utils';

interface IconLibraryProps {
  onIconSelect?: (icon: Icon) => void;
  selectedIconId?: string;
  compact?: boolean;
}

export const IconLibrary: React.FC<IconLibraryProps> = ({ 
  onIconSelect, 
  selectedIconId,
  compact = false 
}) => {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadIcons();
    loadCategories();
  }, []);

  useEffect(() => {
    filterIcons();
  }, [selectedCategory, searchQuery]);

  const loadIcons = async () => {
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

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    
    setUploading(true);
    try {
      const category = selectedCategory === 'all' ? 'general' : selectedCategory;
      await iconManager.uploadMultipleIcons(files, category);
      await loadIcons();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteIcon = async (iconId: string) => {
    if (window.confirm('Are you sure you want to delete this icon?')) {
      try {
        await iconManager.deleteIcon(iconId);
        await loadIcons();
      } catch (error) {
        console.error('Failed to delete icon:', error);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg']
    },
    multiple: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border', compact ? 'h-64' : 'h-full')}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Icon Library</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3 py-1 text-sm rounded-full whitespace-nowrap',
              selectedCategory === 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'px-3 py-1 text-sm rounded-full whitespace-nowrap',
                selectedCategory === category.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-2 text-gray-400" size={24} />
          <p className="text-sm text-gray-600">
            {uploading
              ? 'Uploading...'
              : isDragActive
              ? 'Drop files here'
              : 'Drop files or click to upload'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports PNG, JPG, SVG (max 5MB)
          </p>
        </div>
      </div>

      {/* Icon Grid/List */}
      <div className={cn('p-4 overflow-y-auto', compact ? 'h-48' : 'flex-1')}>
        {icons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="mx-auto mb-2" size={48} />
            <p>No icons found</p>
            <p className="text-sm mt-1">Upload some icons to get started</p>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-6 gap-3' 
              : 'space-y-2'
          )}>
            {icons.map(icon => (
              <IconItem
                key={icon.id}
                icon={icon}
                viewMode={viewMode}
                isSelected={selectedIconId === icon.id}
                onSelect={() => onIconSelect?.(icon)}
                onDelete={() => handleDeleteIcon(icon.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface IconItemProps {
  icon: Icon;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

const IconItem: React.FC<IconItemProps> = ({ 
  icon, 
  viewMode, 
  isSelected = false, 
  onSelect, 
  onDelete 
}) => {
  if (viewMode === 'grid') {
    return (
      <div
        onClick={onSelect}
        className={cn(
          'relative group border rounded-lg p-3 cursor-pointer transition-all aspect-square',
          isSelected
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={icon.data}
            alt={icon.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {icon.name}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <img
          src={icon.data}
          alt={icon.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{icon.name}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{icon.category}</span>
          <span>•</span>
          <span>{formatFileSize(icon.size)}</span>
          <span>•</span>
          <span className="uppercase">{icon.format}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {icon.tags?.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {tag}
          </span>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-2"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};