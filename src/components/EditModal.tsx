import React, { useState, useEffect } from 'react';
import { X, Upload, Search } from 'lucide-react';
import { publicIconService } from '../lib/dynamicIcons';
import type { PublicIcon } from '../lib/dynamicIcons';

export interface NodeEditData {
  title: string;
  content: string;
  iconPath?: string;
}

export interface EditModalProps {
  isOpen: boolean;
  nodeData: NodeEditData;
  onSave: (data: NodeEditData) => void;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  nodeData,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<NodeEditData>(nodeData);
  const [availableIcons, setAvailableIcons] = useState<PublicIcon[]>([]);
  const [iconSearch, setIconSearch] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(nodeData);
      loadIcons();
    }
  }, [isOpen, nodeData]);

  const loadIcons = async () => {
    try {
      const icons = await publicIconService.getAllIcons();
      setAvailableIcons(icons);
    } catch (error) {
      console.error('Failed to load icons:', error);
    }
  };

  const filteredIcons = availableIcons.filter(icon =>
    icon.name.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.fileName.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleIconSelect = (icon: PublicIcon) => {
    setFormData(prev => ({ ...prev, iconPath: icon.path }));
    setShowIconPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-2xl bg-white-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Node</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter node title"
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder="Enter node content"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="space-y-2">
              {/* Current Icon Preview */}
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-md">
                {formData.iconPath ? (
                  <img 
                    src={formData.iconPath} 
                    alt="Current icon" 
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <span className="text-sm text-gray-600 flex-1">
                  {formData.iconPath ? 'Current icon' : 'No icon selected'}
                </span>
                <button
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {showIconPicker ? 'Cancel' : 'Choose Icon'}
                </button>
              </div>

              {/* Icon Picker */}
              {showIconPicker && (
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                  {/* Icon Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Search icons..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Icon Grid */}
                  <div className="max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                      {filteredIcons.slice(0, 36).map(icon => (
                        <button
                          key={icon.id}
                          onClick={() => handleIconSelect(icon)}
                          className="p-2 border border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          title={icon.name}
                        >
                          <img 
                            src={icon.path} 
                            alt={icon.name}
                            className="w-8 h-8 object-contain mx-auto"
                          />
                        </button>
                      ))}
                    </div>
                    {filteredIcons.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No icons found</p>
                    )}
                    {filteredIcons.length > 36 && (
                      <p className="text-center text-gray-500 text-sm mt-2">
                        Showing first 36 results. Use search to find more specific icons.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};