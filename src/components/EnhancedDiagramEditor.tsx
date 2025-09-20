import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Panel,
  NodeToolbar,
  Position,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Undo, Redo, Type, Copy, Trash2, Edit3, Wand2, Download, Image, FileImage } from 'lucide-react';
import type { Diagram } from '../lib/storage';
import type { CustomNodeData } from './nodes/CustomNodes';
import { nodeTypes } from './nodes/CustomNodes';
import { historyManager } from '../lib/historyManager';
import { ContextMenu } from './ContextMenu';
import { EditModal } from './EditModal';
import type { NodeEditData } from './EditModal';
import { AIModifyModal } from './AIModifyModal';
import { aiService } from '../lib/ai';
import { exportService } from '../lib/exportService';


const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface EnhancedDiagramEditorProps {
  diagram: Diagram | null;
  onSave?: (diagram: Diagram) => void;
  onDiagramChange?: (diagram: { nodes: Node[]; edges: Edge[] }) => void;
  onAIModify?: (selectedNodes: Node[]) => void;
}

const EnhancedDiagramEditor: React.FC<EnhancedDiagramEditorProps> = ({ 
  diagram, 
  onSave, 
  onDiagramChange,
  onAIModify 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  
  // Modal states
  const [editModal, setEditModal] = useState<{ isOpen: boolean; nodeData: NodeEditData } | null>(null);
  const [aiModifyModal, setAIModifyModal] = useState<{
    isOpen: boolean;
    nodeId: string;
    nodeData: CustomNodeData;
  } | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Initialize diagram
  useEffect(() => {
    if (diagram) {
      historyManager.initialize(diagram.nodes || [], diagram.edges || []);
      setNodes(diagram.nodes || []);
      setEdges(diagram.edges || []);
    }
  }, [diagram, setNodes, setEdges]);

  // Update history state indicators
  const updateHistoryState = useCallback(() => {
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  }, []);

  // Save to history helper
  const saveToHistory = useCallback(() => {
    historyManager.saveState(nodes, edges);
    updateHistoryState();
  }, [nodes, edges, updateHistoryState]);

  // Update history state when initialized
  useEffect(() => {
    updateHistoryState();
  }, [updateHistoryState]);

  // Save state to history when nodes or edges change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      historyManager.saveState(nodes, edges);
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // Notify parent of changes
  useEffect(() => {
    onDiagramChange?.({ nodes, edges });
  }, [nodes, edges, onDiagramChange]);

  // Context menu handlers
  const handleShowContextMenu = useCallback((nodeId: string, x: number, y: number) => {
    setContextMenu({ x, y, nodeId });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Node action handlers
  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const nodeData = node.data as unknown as CustomNodeData;
      setEditModal({
        isOpen: true,
        nodeData: {
          title: nodeData.title || '',
          content: nodeData.content || '',
          iconPath: nodeData.iconPath
        }
      });
      setEditingNodeId(nodeId);
    }
    handleCloseContextMenu();
  }, [nodes, handleCloseContextMenu]);

  const handleCopyNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode = {
        ...node,
        id: generateId(),
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20
        }
      };
      
      saveToHistory();
      setNodes(prevNodes => [...prevNodes, newNode]);
    }
    handleCloseContextMenu();
  }, [nodes, setNodes, saveToHistory, handleCloseContextMenu]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    saveToHistory();
    setNodes(prevNodes => prevNodes.filter(n => n.id !== nodeId));
    setEdges(prevEdges => prevEdges.filter(e => e.source !== nodeId && e.target !== nodeId));
    handleCloseContextMenu();
  }, [setNodes, setEdges, saveToHistory, handleCloseContextMenu]);

  const handleAIModifyNode = useCallback(async (nodeId: string, prompt: string, provider: string, model?: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      const nodeData = node.data as unknown as CustomNodeData;
      
      // Create a request for AI modification using generateDiagram
      const modificationRequest = {
        description: `Modify this node: ${nodeData.title} - ${nodeData.content}. User request: ${prompt}`,
        provider: provider as 'openrouter' | 'groq' | 'gemini',
        model,
        options: {
          diagramType: 'container' as const,
          complexity: 'simple' as const,
          includeIcons: true
        }
      };

      const response = await aiService.generateDiagram(modificationRequest);
      // Use the first node from the response as the suggestion
      const suggestion = response.nodes[0];
      const suggestionData = suggestion?.data as unknown as CustomNodeData;

      // Apply suggestions
      saveToHistory();
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  title: suggestionData?.title || nodeData.title,
                  content: suggestionData?.content || nodeData.content,
                  iconPath: suggestionData?.iconPath || nodeData.iconPath
                } 
              }
            : n
        )
      );
      
      setAIModifyModal(null);
    } catch (error) {
      console.error('AI modification failed:', error);
    }
  }, [nodes, setNodes, saveToHistory]);

  const handleSaveEditModal = useCallback((data: NodeEditData) => {
    if (editingNodeId) {
      saveToHistory();
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === editingNodeId 
            ? { ...n, data: { ...n.data, ...data } }
            : n
        )
      );
    }
    setEditModal(null);
    setEditingNodeId(null);
  }, [editingNodeId, setNodes, saveToHistory]);

  // Add context menu callback to all nodes
  const nodesWithContextMenu = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onShowContextMenu: handleShowContextMenu
    }
  }));

  // Event handlers for custom node events
  useEffect(() => {
    const handleUpdateNodeData = (event: CustomEvent) => {
      const { id, data } = event.detail;
      setNodes(nodes => nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ));
    };

    const handleEditNode = (event: CustomEvent) => {
      const { id } = event.detail;
      startTextEditing(id);
    };

    const handleDeleteNode = (event: CustomEvent) => {
      const { id } = event.detail;
      setNodes(nodes => nodes.filter(node => node.id !== id));
    };

    const handleDuplicateNode = (event: CustomEvent) => {
      const { id, data } = event.detail;
      const originalNode = nodes.find(node => node.id === id);
      if (originalNode) {
        const newNode = {
          ...originalNode,
          id: generateId(),
          position: {
            x: originalNode.position.x + 50,
            y: originalNode.position.y + 50
          },
          data: { ...data }
        };
        setNodes(nodes => [...nodes, newNode]);
      }
    };

    window.addEventListener('updateNodeData', handleUpdateNodeData as EventListener);
    window.addEventListener('editNode', handleEditNode as EventListener);
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    window.addEventListener('duplicateNode', handleDuplicateNode as EventListener);

    return () => {
      window.removeEventListener('updateNodeData', handleUpdateNodeData as EventListener);
      window.removeEventListener('editNode', handleEditNode as EventListener);
      window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
      window.removeEventListener('duplicateNode', handleDuplicateNode as EventListener);
    };
  }, [nodes, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      saveToHistory();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, saveToHistory]
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
              label: icon.name
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
        return { title: 'Start', content: 'Entry point' };
      case 'end':
        return { title: 'End', content: 'Exit point' };
      case 'decision':
        return { title: 'Decision?', content: 'Decision logic' };
      default:
        return {
          title: 'New Node',
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          textColor: '#1f2937',
          content: 'Node description'
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

  // Undo functionality
  const handleUndo = () => {
    const prevState = historyManager.undo();
    if (prevState) {
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      updateHistoryState();
    }
  };

  // Redo functionality
  const handleRedo = () => {
    const nextState = historyManager.redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      updateHistoryState();
    }
  };

  // Delete selected nodes
  const handleDelete = () => {
    const selectedNodeIds = selectedNodes.map(node => node.id);
    saveToHistory();
    setNodes(nds => nds.filter(node => !selectedNodeIds.includes(node.id)));
    setEdges(eds => eds.filter(edge => 
      !selectedNodeIds.includes(edge.source) && 
      !selectedNodeIds.includes(edge.target)
    ));
    setSelectedNodes([]);
  };

  // Duplicate selected nodes
  const handleDuplicate = () => {
    if (selectedNodes.length === 0) return;
    
    const duplicatedNodes = selectedNodes.map(node => ({
      ...node,
      id: generateId(),
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      selected: false
    }));
    
    saveToHistory();
    setNodes(nodes => [...nodes, ...duplicatedNodes]);
    
    // Select the duplicated nodes
    setTimeout(() => {
      setNodes(nodes => nodes.map(node => 
        duplicatedNodes.some(dup => dup.id === node.id)
          ? { ...node, selected: true }
          : { ...node, selected: false }
      ));
    }, 0);
  };

  // Start text editing
  const startTextEditing = (nodeId: string) => {
    setEditingNodeId(nodeId);
    setIsTextEditing(true);
  };

  // Update node text
  const updateNodeText = (nodeId: string, newText: string) => {
    saveToHistory();
    setNodes(nds => nds.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, title: newText } }
        : node
    ));
    setIsTextEditing(false);
    setEditingNodeId(null);
  };

  // Handle node selection
  const onSelectionChange = useCallback((selection: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(selection.nodes);
  }, []);

  // Export handlers
  const handleExportPNG = useCallback(async () => {
    if (!reactFlowWrapper.current || nodes.length === 0) {
      alert('No diagram to export');
      return;
    }

    try {
      const filename = `diagram-${new Date().toISOString().slice(0, 10)}.png`;
      await exportService.exportToPNG(reactFlowWrapper.current, filename, {
        backgroundColor: '#ffffff',
        padding: 20
      });
    } catch (error) {
      console.error('Export to PNG failed:', error);
      alert('Failed to export PNG. Please try again.');
    }
  }, [nodes]);

  const handleExportSVG = useCallback(async () => {
    if (!reactFlowWrapper.current || nodes.length === 0) {
      alert('No diagram to export');
      return;
    }

    try {
      const filename = `diagram-${new Date().toISOString().slice(0, 10)}.svg`;
      await exportService.exportToSVG(reactFlowWrapper.current, filename, {
        backgroundColor: '#ffffff',
        padding: 20
      });
    } catch (error) {
      console.error('Export to SVG failed:', error);
      alert('Failed to export SVG. Please try again.');
    }
  }, [nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isTextEditing) return; // Don't handle shortcuts while editing text

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            handleRedo();
            break;
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'd':
            event.preventDefault();
            handleDuplicate();
            break;
          case 'e':
            event.preventDefault();
            if (selectedNodes.length === 1) {
              startTextEditing(selectedNodes[0].id);
            }
            break;
        }
      } else {
        switch (event.key) {
          case 'Delete':
            handleDelete();
            break;
          case 'Enter':
            if (selectedNodes.length === 1) {
              startTextEditing(selectedNodes[0].id);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNodes, isTextEditing, handleUndo, handleRedo, handleDelete, handleDuplicate]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Enhanced Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {diagram?.name || 'Untitled Diagram'}
          </h2>
          {selectedNodes.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {selectedNodes.length} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* History Controls */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={14} />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={14} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Edit Controls */}
          <button
            onClick={() => selectedNodes[0] && startTextEditing(selectedNodes[0].id)}
            disabled={selectedNodes.length !== 1}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit Text (Enter or Ctrl+E)"
          >
            <Type size={14} />
            Edit
          </button>

          <button
            onClick={handleDuplicate}
            disabled={selectedNodes.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate Selected (Ctrl+D)"
          >
            <Copy size={14} />
            Duplicate
          </button>

          <button
            onClick={handleDelete}
            disabled={selectedNodes.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Selected (Del)"
          >
            <Trash2 size={14} />
          </button>

          {/* AI Modify */}
          <button
            onClick={() => onAIModify?.(selectedNodes)}
            disabled={selectedNodes.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="AI Modify"
          >
            <Wand2 size={14} />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={handleSave}
            disabled={!diagram}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save (Ctrl+S)"
          >
            <Save size={16} />
            Save
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Export Options */}
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            title="Export as PNG"
          >
            <Image size={14} />
            PNG
          </button>

          <button
            onClick={handleExportSVG}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            title="Export as SVG"
          >
            <FileImage size={14} />
            SVG
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodesWithContextMenu}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectionChange={onSelectionChange}
          onPaneClick={handleCloseContextMenu}
          nodeTypes={nodeTypes as any}
          fitView
          attributionPosition="top-right"
          multiSelectionKeyCode="Shift"
          deleteKeyCode="Delete"
        >
          <Background />
          <Controls />
          <MiniMap />
          
          {/* Enhanced Info Panel */}
          <Panel position="top-left">
            <div className="bg-white rounded-lg shadow-lg p-3 text-sm max-w-xs">
              <div className="font-medium mb-2">Diagram Info</div>
              <div className="space-y-1 text-gray-600">
                <div>Nodes: {nodes.length}</div>
                <div>Edges: {edges.length}</div>
                <div>Selected: {selectedNodes.length}</div>
                {canUndo && <div className="text-xs text-blue-600">Ctrl+Z to undo</div>}
              </div>
            </div>
          </Panel>

          {/* Node Toolbars */}
          {nodes.map(node => (
            <NodeToolbar
              key={node.id}
              nodeId={node.id}
              isVisible={selectedNodes.some(n => n.id === node.id)}
              position={Position.Top}
            >
              <div className="flex items-center gap-1 bg-white rounded shadow-lg border px-2 py-1">
                <button
                  onClick={() => startTextEditing(node.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Edit Text"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => {
                    saveToHistory();
                    setNodes(nds => nds.filter(n => n.id !== node.id));
                    setEdges(eds => eds.filter(e => e.source !== node.id && e.target !== node.id));
                  }}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </NodeToolbar>
          ))}
        </ReactFlow>
      </div>

      {/* Text Editing Modal */}
      {isTextEditing && editingNodeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Node Text</h3>
            <input
              type="text"
              defaultValue={(nodes.find(n => n.id === editingNodeId)?.data as unknown as CustomNodeData)?.title || ''}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter node text..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateNodeText(editingNodeId, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setIsTextEditing(false);
                  setEditingNodeId(null);
                }
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  updateNodeText(editingNodeId, input.value);
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsTextEditing(false);
                  setEditingNodeId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onEdit={handleEditNode}
          onCopy={handleCopyNode}
          onDelete={handleDeleteNode}
          onAIModify={(nodeId) => {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              setAIModifyModal({
                isOpen: true,
                nodeId,
                nodeData: node.data as unknown as CustomNodeData
              });
            }
          }}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          isOpen={editModal.isOpen}
          nodeData={editModal.nodeData}
          onSave={handleSaveEditModal}
          onClose={() => {
            setEditModal(null);
            setEditingNodeId(null);
          }}
        />
      )}

      {/* AI Modify Modal */}
      {aiModifyModal && (
        <AIModifyModal
          isOpen={aiModifyModal.isOpen}
          nodeId={aiModifyModal.nodeId}
          currentTitle={aiModifyModal.nodeData.title || ''}
          currentContent={aiModifyModal.nodeData.content || ''}
          onModify={handleAIModifyNode}
          onClose={() => setAIModifyModal(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDiagramEditor;