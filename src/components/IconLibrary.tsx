import React, { useState, useEffect, useRef } from 'react';
import { Search, Grid3X3, List, RefreshCw, Upload } from 'lucide-react';
import { publicIconService, type PublicIcon } from '../lib/dynamicIcons';
import { cn } from '../lib/utils';

interface IconLibraryProps {
  onIconDragStart?: (icon: PublicIcon, event: React.DragEvent) => void;
  onIconSelect?: (icon: PublicIcon) => void;
  selectedIconId?: string;
  compact?: boolean;
}

export const IconLibrary: React.FC<IconLibraryProps> = ({ 
  onIconDragStart,
  onIconSelect, 
  selectedIconId,
  compact = false 
}) => {
  const [icons, setIcons] = useState<PublicIcon[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<PublicIcon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadIcons();
  }, []);

  useEffect(() => {
    filterIcons();
  }, [searchQuery, icons]);

  const loadIcons = async () => {
    try {
      const allIcons = await publicIconService.getAllIcons();
      setIcons(allIcons);
      setFilteredIcons(allIcons);
    } catch (error) {
      console.error('Failed to load icons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIcons = () => {
    if (!searchQuery.trim()) {
      setFilteredIcons(icons);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    const filtered = icons.filter(icon => {
      const iconName = icon.name.toLowerCase();
      
      // Direct match
      if (iconName.includes(query)) {
        return true;
      }
      
      // Try variations with spaces and dashes
      const queryWithSpaces = query.replace(/-/g, ' ').replace(/_/g, ' ');
      const queryWithDashes = query.replace(/\s+/g, '-').replace(/_/g, '-');
      const queryWithUnderscores = query.replace(/\s+/g, '_').replace(/-/g, '_');
      
      const nameWithSpaces = iconName.replace(/-/g, ' ').replace(/_/g, ' ');
      const nameWithDashes = iconName.replace(/\s+/g, '-').replace(/_/g, '-');
      const nameWithUnderscores = iconName.replace(/\s+/g, '_').replace(/-/g, '_');
      
      return nameWithSpaces.includes(queryWithSpaces) ||
             nameWithDashes.includes(queryWithDashes) ||
             nameWithUnderscores.includes(queryWithUnderscores) ||
             iconName.includes(queryWithSpaces) ||
             iconName.includes(queryWithDashes) ||
             iconName.includes(queryWithUnderscores);
    });
    
    setFilteredIcons(filtered);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      // In a real app, you'd upload to a server
      // For now, just show a message
      const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') && 
        (file.name.endsWith('.png') || file.name.endsWith('.svg') || 
         file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))
      );
      
      if (validFiles.length > 0) {
        alert(`Upload functionality not implemented yet. Would upload ${validFiles.length} icon(s). Please manually add icons to the public/icons folder and refresh.`);
      } else {
        alert('Please select valid image files (.png, .svg, .jpg, .jpeg)');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDragStart = (icon: PublicIcon, event: React.DragEvent) => {
    // Set data for React Flow drop handling
    event.dataTransfer.setData('application/reactflow', 'custom');
    event.dataTransfer.setData('application/icon', JSON.stringify({
      name: icon.name,
      path: icon.path,
      fileName: icon.fileName
    }));
    event.dataTransfer.effectAllowed = 'move';
    
    onIconDragStart?.(icon, event);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border h-full flex flex-col')}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tech Icons</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setLoading(true);
                await publicIconService.refreshIcons();
                await loadIcons();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh icons from folder"
            >
              <RefreshCw size={16} />
            </button>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".png,.svg,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Upload new icons"
              >
                <Upload size={16} className={uploading ? 'animate-pulse' : ''} />
              </button>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Drag icons to canvas • {filteredIcons.length} icons available
        </div>
      </div>

      {/* Icons Grid/List */}
      <div className="flex-1 overflow-y-auto p-4">
        {icons.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No icons found</p>
              <p className="text-sm">Add icons to the public/icons folder or use the upload button</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              <Upload size={16} />
              Add Icons
            </button>
          </div>
        ) : filteredIcons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">No icons match your search</div>
            <div className="text-sm">Try a different search term</div>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid gap-3' 
              : 'space-y-2',
            compact 
              ? 'grid-cols-4' 
              : 'grid-cols-3 lg:grid-cols-4'
          )}>
            {filteredIcons.map(icon => (
              <IconItem
                key={icon.id}
                icon={icon}
                viewMode={viewMode}
                isSelected={selectedIconId === icon.id}
                onDragStart={(e) => handleDragStart(icon, e)}
                onSelect={() => onIconSelect?.(icon)}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface IconItemProps {
  icon: PublicIcon;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onDragStart?: (event: React.DragEvent) => void;
  onSelect?: () => void;
  compact?: boolean;
}

const IconItem: React.FC<IconItemProps> = ({ 
  icon, 
  viewMode, 
  isSelected = false, 
  onDragStart,
  onSelect,
  compact = false
}) => {
  const iconSize = compact ? 32 : 48;

  if (viewMode === 'grid') {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onClick={onSelect}
        className={cn(
          'relative group border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md',
          compact ? 'aspect-square' : 'aspect-square',
          isSelected
            ? 'border-primary-500 bg-primary-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
        title={`${icon.name} - Drag to canvas`}
      >
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={icon.path}
            alt={icon.name}
            className="max-w-full max-h-full object-contain"
            style={{ width: iconSize, height: iconSize }}
            loading="lazy"
          />
        </div>
        
        {!compact && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="truncate">{icon.name}</div>
          </div>
        )}

        {/* Drag indicator */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-sm',
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
      title={`${icon.name} - Drag to canvas`}
    >
      <div className="flex-shrink-0">
        <img
          src={icon.path}
          alt={icon.name}
          className="object-contain"
          style={{ width: iconSize, height: iconSize }}
          loading="lazy"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{icon.name}</div>
        <div className="text-xs text-gray-500 truncate">{icon.fileName}</div>
      </div>

      {/* Drag indicator */}
      <div className="flex-shrink-0 opacity-50">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
      </div>
    </div>
  );
};