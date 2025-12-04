import React, { memo, useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GripHorizontal } from 'lucide-react';

export interface CustomNodeData {
  title: string;
  content: string;
  iconPath?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  onShowContextMenu?: (nodeId: string, x: number, y: number) => void;
}

export const CustomNode: React.FC<NodeProps> = memo(({ data, id, selected }) => {
  // Type assertion for data
  const nodeData = data as unknown as CustomNodeData;
  const [isResizing, setIsResizing] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    // Only show context menu on direct node click, not on resize handles
    if (resizeRef.current?.contains(e.target as Node)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (nodeData.onShowContextMenu) {
      nodeData.onShowContextMenu(id, e.clientX, e.clientY);
    }
  }, [nodeData, id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (resizeRef.current && resizeRef.current.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = nodeData.width || 200;
      const startHeight = nodeData.height || 120;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(150, startWidth + (moveEvent.clientX - startX));
        const newHeight = Math.max(100, startHeight + (moveEvent.clientY - startY));

        // Dispatch custom event to update node data
        window.dispatchEvent(new CustomEvent('updateNodeSize', {
          detail: { id, width: newWidth, height: newHeight }
        }));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [nodeData.width, nodeData.height, id]);



  return (
    <div
      ref={nodeRef}
      className={`
        bg-white border-2 rounded-lg shadow-lg transition-all duration-200 relative group cursor-pointer
        ${selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'}
        ${isResizing ? 'select-none' : ''}
      `}
      style={{
        width: nodeData.width || 200,
        height: nodeData.height || 120,
        minWidth: 150,
        minHeight: 100,
        backgroundColor: nodeData.backgroundColor || '#ffffff',
        borderColor: nodeData.borderColor || (selected ? '#3b82f6' : '#e5e7eb'),
        color: nodeData.textColor || '#1f2937'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleNodeClick}
      title="Double-click to edit"
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Node Content */}
      <div className="flex items-start gap-3 p-3 h-full pointer-events-none">
        {/* Icon */}
        {nodeData.iconPath && (
          <div className="flex-shrink-0 mt-1">
            <img
              src={nodeData.iconPath}
              alt="Node icon"
              className="w-8 h-8 object-contain"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <div className="font-semibold text-sm leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {nodeData.title}
          </div>

          {/* Content */}
          <div className="text-xs opacity-80 leading-relaxed overflow-hidden line-clamp-3 break-words">
            {nodeData.content}
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      {selected && (
        <div
          ref={resizeRef}
          className={`
            absolute bottom-0 right-0 w-4 h-4 cursor-se-resize
            flex items-center justify-center text-gray-400 hover:text-gray-600
            ${isResizing ? 'text-blue-500' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          <GripHorizontal className="w-3 h-3 rotate-45" />
        </div>
      )}

      {/* Click indicator */}
      <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-200 pointer-events-none transition-colors" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

// Icon Node for displaying just icons
export interface IconNodeData {
  iconPath: string;
  iconName: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as IconNodeData;
  const sizes = {
    sm: { container: 'w-12 h-12', icon: 'w-8 h-8' },
    md: { container: 'w-16 h-16', icon: 'w-12 h-12' },
    lg: { container: 'w-20 h-20', icon: 'w-16 h-16' }
  };

  const size = sizes[nodeData.size || 'md'];

  return (
    <div
      className={`
        ${size.container} bg-white border-2 rounded-lg shadow-sm transition-all duration-200
        flex items-center justify-center cursor-grab active:cursor-grabbing
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-blue-500 !border !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-blue-500 !border !border-white"
      />

      <img
        src={nodeData.iconPath}
        alt={nodeData.iconName}
        className={`${size.icon} object-contain`}
        draggable={false}
      />
    </div>
  );
});

IconNode.displayName = 'IconNode';

// Export node types for React Flow
export const nodeTypes = {
  custom: CustomNode,
  icon: IconNode
};