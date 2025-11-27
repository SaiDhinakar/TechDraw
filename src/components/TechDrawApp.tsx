import React, { useState, useEffect } from 'react';
import {
  Plus,
  Settings,
  Wand2,
  FileText,
  Eye,
  EyeOff,
  X,
  Menu,
  Search,
  Folder,
  Image as ImageIcon
} from 'lucide-react';
import { settingsService } from '../lib/settings';
import DiagramEditor from './DiagramEditor';
import { IconLibrary } from './IconLibrary';
import { AIGenerator } from './AIGenerator';
import { storageManager, iconManager, type Diagram } from '../lib';
import type { DiagramGenerationResponse } from '../lib/ai';
import type { PublicIcon } from '../lib/dynamicIcons';
import { generateId, formatDate, cn } from '../lib/utils';

type TabType = 'diagrams' | 'icons' | 'ai' | 'settings';

export const TechDrawApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('diagrams');
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await storageManager.initialize();
      await iconManager.initialize();
      const allDiagrams = await storageManager.getAllDiagrams();
      setDiagrams(allDiagrams);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewDiagram = async () => {
    const newDiagram: Diagram = {
      id: generateId(),
      name: 'Untitled Diagram',
      description: '',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const savedDiagram = await storageManager.saveDiagram(newDiagram);
      setDiagrams(prev => [savedDiagram, ...prev]);
      setCurrentDiagram(savedDiagram);
      setActiveTab('diagrams');
    } catch (error) {
      console.error('Failed to create diagram:', error);
    }
  };

  const openDiagram = (diagram: Diagram) => {
    setCurrentDiagram(diagram);
    setActiveTab('diagrams');
  };

  const saveDiagram = async (diagram: Diagram) => {
    try {
      const saved = await storageManager.saveDiagram(diagram);
      setDiagrams(prev => prev.map(d => d.id === saved.id ? saved : d));
      setCurrentDiagram(saved);
    } catch (error) {
      console.error('Failed to save diagram:', error);
    }
  };

  const deleteDiagram = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this diagram?')) {
      try {
        await storageManager.deleteDiagram(id);
        setDiagrams(prev => prev.filter(d => d.id !== id));
        if (currentDiagram?.id === id) {
          setCurrentDiagram(null);
        }
      } catch (error) {
        console.error('Failed to delete diagram:', error);
      }
    }
  };

  const handleAIGeneration = async (result: DiagramGenerationResponse) => {
    const newDiagram: Diagram = {
      id: generateId(),
      name: result.title,
      description: result.description,
      nodes: result.nodes,
      edges: result.edges,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const saved = await storageManager.saveDiagram(newDiagram);
      setDiagrams(prev => [saved, ...prev]);
      setCurrentDiagram(saved);
      setActiveTab('diagrams');
    } catch (error) {
      console.error('Failed to save AI-generated diagram:', error);
    }
  };

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    diagram.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'diagrams' as TabType, label: 'Diagrams', icon: FileText },
    { id: 'icons' as TabType, label: 'Icons', icon: ImageIcon },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Tech Draw...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-80' : 'w-0',
        'md:relative absolute z-10 h-full'
      )}>
        {sidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Tech Draw</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
                {tabs.map(tab => {
                  const IconComponent = tab.icon as React.ComponentType<{ size: number }>;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <IconComponent size={14} />
                      <span className="hidden sm:block">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'diagrams' && (
                <DiagramsTab
                  diagrams={filteredDiagrams}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onCreateNew={createNewDiagram}
                  onOpenDiagram={openDiagram}
                  onDeleteDiagram={deleteDiagram}
                  currentDiagram={currentDiagram}
                />
              )}

              {activeTab === 'icons' && (
                <div className="h-full">
                  <IconLibrary
                    compact={false}
                    onIconSelect={(icon: PublicIcon) => {
                      // Optional: Handle icon selection
                      console.log('Selected icon:', icon.name);
                    }}
                  />
                </div>
              )}

              {activeTab === 'ai' && (
                <AITab onGenerateClick={() => setShowAIGenerator(true)} />
              )}

              {activeTab === 'settings' && (
                <SettingsTab />
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Menu size={20} />
            </button>
            {currentDiagram && (
              <div>
                <h2 className="font-semibold text-gray-900">{currentDiagram.name}</h2>
                <p className="text-sm text-gray-500">
                  Last updated {formatDate(currentDiagram.updatedAt)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIGenerator(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Wand2 size={16} />
              <span className="hidden sm:block">AI Generate</span>
            </button>
            <button
              onClick={createNewDiagram}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Plus size={16} />
              <span className="hidden sm:block">New Diagram</span>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1">
          {currentDiagram ? (
            <DiagramEditor
              diagram={currentDiagram}
              onSave={saveDiagram}
              onAIModify={(selectedNodes: any) => {
                // Handle AI modification of selected nodes
                console.log('AI modify requested for nodes:', selectedNodes);
                setShowAIGenerator(true);
              }}
            />
          ) : (
            <WelcomeScreen onCreateNew={createNewDiagram} onGenerateAI={() => setShowAIGenerator(true)} />
          )}
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIGenerator
          onDiagramGenerated={handleAIGeneration}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
};

// Sub-components
interface DiagramsTabProps {
  diagrams: Diagram[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
  onOpenDiagram: (diagram: Diagram) => void;
  onDeleteDiagram: (id: string) => void;
  currentDiagram: Diagram | null;
}

const DiagramsTab: React.FC<DiagramsTabProps> = ({
  diagrams,
  searchQuery,
  onSearchChange,
  onCreateNew,
  onOpenDiagram,
  onDeleteDiagram,
  currentDiagram
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search diagrams..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus size={16} />
          New Diagram
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {diagrams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="mx-auto mb-4" size={48} />
            <p className="mb-2">No diagrams found</p>
            <p className="text-sm">Create your first diagram to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {diagrams.map(diagram => (
              <div
                key={diagram.id}
                onClick={() => onOpenDiagram(diagram)}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  currentDiagram?.id === diagram.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="font-medium text-sm truncate">{diagram.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(diagram.updatedAt)}
                </div>
                {diagram.description && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {diagram.description}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {diagram.nodes?.length || 0} nodes
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDiagram(diagram.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AITab: React.FC<{ onGenerateClick: () => void }> = ({ onGenerateClick }) => {
  return (
    <div className="p-4 h-full flex flex-col justify-center text-center">
      <Wand2 className="mx-auto mb-4 text-purple-600" size={48} />
      <h3 className="text-lg font-semibold mb-2">AI Diagram Generator</h3>
      <p className="text-gray-600 text-sm mb-6">
        Describe your process and let AI create a diagram for you
      </p>
      <button
        onClick={onGenerateClick}
        className="mx-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        Generate Diagram
      </button>
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    groq: '',
    gemini: ''
  });
  const [showKeys, setShowKeys] = useState({
    openrouter: false,
    groq: false,
    gemini: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing API keys on component mount
  useEffect(() => {
    const loadApiKeys = async () => {
      await settingsService.initialize();
      const savedKeys = settingsService.getAllAPIKeys();
      setApiKeys({
        openrouter: savedKeys.openrouter || '',
        groq: savedKeys.groq || '',
        gemini: savedKeys.gemini || ''
      });
    };
    loadApiKeys();
  }, []);

  const handleSaveApiKey = async (provider: 'openrouter' | 'groq' | 'gemini', key: string) => {
    setLoading(true);
    try {
      if (key.trim()) {
        await settingsService.saveAPIKey(provider, key.trim());
        setMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved successfully!`);
      } else {
        await settingsService.removeAPIKey(provider);
        setMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key removed.`);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save API key. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (provider: 'openrouter' | 'groq' | 'gemini') => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2">Settings</h3>
        <p className="text-gray-600 text-sm">Configure your AI providers and application preferences</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      {/* API Configuration */}
      <div>
        <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Provider Configuration
        </h4>
        <div className="space-y-6">
          {/* OpenRouter */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">OR</span>
              </div>
              <div>
                <h5 className="font-medium">OpenRouter</h5>
                <p className="text-sm text-gray-600">Access multiple AI models via OpenRouter API</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys.openrouter ? 'text' : 'password'}
                    placeholder="Enter OpenRouter API key"
                    value={apiKeys.openrouter}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, openrouter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openrouter')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.openrouter ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey('openrouter', apiKeys.openrouter)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500">Get your API key from <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-600 hover:underline">OpenRouter Dashboard</a></p>
            </div>
          </div>

          {/* Groq */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">GQ</span>
              </div>
              <div>
                <h5 className="font-medium">Groq</h5>
                <p className="text-sm text-gray-600">Fast inference with Groq's hardware acceleration</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    placeholder="Enter Groq API key"
                    value={apiKeys.groq}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, groq: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('groq')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.groq ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey('groq', apiKeys.groq)}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500">Get your API key from <a href="https://console.groq.com/keys" target="_blank" className="text-blue-600 hover:underline">Groq Console</a></p>
            </div>
          </div>

          {/* Google Gemini */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">GM</span>
              </div>
              <div>
                <h5 className="font-medium">Google Gemini</h5>
                <p className="text-sm text-gray-600">Google's advanced AI model</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    placeholder="Enter Gemini API key"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSaveApiKey('gemini', apiKeys.gemini)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500">Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a></p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Preferences */}
      <div>
        <h4 className="text-lg font-medium mb-4">Application Preferences</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Appearance</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Dark mode</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Show grid</span>
              </label>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-2">Editor</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Auto-save</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Snap to grid</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen: React.FC<{ onCreateNew: () => void; onGenerateAI: () => void }> = ({
  onCreateNew,
  onGenerateAI
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <FileText className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Tech Draw</h2>
          <p className="text-gray-600">
            Create professional flow diagrams with AI assistance or start from scratch
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} />
            Create New Diagram
          </button>

          <button
            onClick={onGenerateAI}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Wand2 size={20} />
            Generate with AI
          </button>
        </div>
      </div>
    </div>
  );
};