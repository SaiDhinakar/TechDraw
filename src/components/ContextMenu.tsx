import React from 'react';
import { Edit3, Copy, Trash2, Sparkles, X } from 'lucide-react';

export interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onEdit: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onAIModify: (nodeId: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  onEdit,
  onCopy,
  onDelete,
  onAIModify,
  onClose
}) => {
  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px]"
      style={{ 
        left: Math.min(x, window.innerWidth - 160), 
        top: Math.min(y, window.innerHeight - 200) 
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 p-1 hover:bg-gray-100 rounded"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Menu items */}
      <button
        onClick={() => {
          onEdit(nodeId);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
      >
        <Edit3 className="w-4 h-4" />
        Edit
      </button>

      <button
        onClick={() => {
          onCopy(nodeId);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 transition-colors"
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>

      <button
        onClick={() => {
          onAIModify(nodeId);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        AI Modify
      </button>

      <div className="border-t border-gray-100 my-1"></div>

      <button
        onClick={() => {
          onDelete(nodeId);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};