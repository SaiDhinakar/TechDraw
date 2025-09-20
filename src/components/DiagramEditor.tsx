import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes, type CustomNodeData } from './nodes/CustomNodes';
import { Save } from 'lucide-react';
import { generateId } from '../lib/utils';
import type { Diagram } from '../lib/storage';

interface DiagramEditorProps {
  diagram?: Diagram;
  onDiagramChange?: (diagram: Partial<Diagram>) => void;
  onSave?: (diagram: Diagram) => void;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({
  diagram,
  onDiagramChange,
  onSave
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(diagram?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(diagram?.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);


  // Load diagram data when diagram prop changes
  useEffect(() => {
    if (diagram) {
      setNodes(diagram.nodes || []);
      setEdges(diagram.edges || []);
    }
  }, [diagram, setNodes, setEdges]);

  // Notify parent of changes
  useEffect(() => {
    onDiagramChange?.({ nodes, edges });
  }, [nodes, edges, onDiagramChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

            // Check if dropping an icon
      const iconData = event.dataTransfer.getData('application/icon');
      if (iconData) {
        try {
          const icon = JSON.parse(iconData);
          const newNode: Node = {
            id: generateId(),
            type: 'icon',
            position,
            data: {
              iconPath: icon.path,
              iconName: icon.name,
              size: 'lg'
            },
          };
          setNodes((nds) => nds.concat(newNode));
          return;
        } catch (error) {
          console.error('Failed to parse icon data:', error);
        }
      }

      // Check if dropping a regular node type
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const newNode: Node = {
        id: generateId(),
        type,
        position,
        data: getDefaultNodeData(type) as any,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const getDefaultNodeData = (type: string): CustomNodeData => {
    switch (type) {
      case 'start':
        return { title: 'Start', content: 'Start point' };
      case 'end':
        return { title: 'End', content: 'End point' };
      case 'decision':
        return { title: 'Decision?', content: 'Decision point' };
      default:
        return { 
          title: 'New Node', 
          content: 'Node description',
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          textColor: '#1f2937'
        };
    }
  };



  const handleSave = () => {
    if (!diagram) return;
    
    const updatedDiagram: Diagram = {
      ...diagram,
      nodes,
      edges,
      updatedAt: new Date(),
    };

    onSave?.(updatedDiagram);
  };

  // Listen for custom events from nodes
  useEffect(() => {
    const handleEditNode = (event: CustomEvent) => {
      const { id } = event.detail;
      // Emit event to parent or show edit dialog
      console.log('Edit node:', id);
    };

    const handleDeleteNode = (event: CustomEvent) => {
      const { id } = event.detail;
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    };

    const handleDuplicateNode = (event: CustomEvent) => {
      const { id } = event.detail;
      const originalNode = nodes.find((node) => node.id === id);
      if (!originalNode) return;

      const newNode: Node = {
        ...originalNode,
        id: generateId(),
        position: {
          x: originalNode.position.x + 20,
          y: originalNode.position.y + 20,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    };

    window.addEventListener('editNode', handleEditNode as EventListener);
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    window.addEventListener('duplicateNode', handleDuplicateNode as EventListener);

    return () => {
      window.removeEventListener('editNode', handleEditNode as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
      window.removeEventListener('duplicateNode', handleDuplicateNode as EventListener);
    };
  }, [nodes, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {diagram?.name || 'Untitled Diagram'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!diagram}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-b px-4 py-2">
        <div className="text-sm text-blue-700">
          💡 Drag icons from the sidebar to create nodes, or use AI to generate professional diagrams
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes as any}
          fitView
          attributionPosition="top-right"
        >
          <Background />
          <Controls />
          <MiniMap />
          
          {/* Custom Panel for additional info */}
          <Panel position="top-left">
            <div className="bg-white rounded-lg shadow-lg p-3 text-sm">
              <div className="font-medium mb-1">Diagram Info</div>
              <div className="text-gray-600">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

