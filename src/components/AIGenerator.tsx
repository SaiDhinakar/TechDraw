import React, { useState } from 'react';
import {
  Wand2,
  Send,
  Loader2,
  AlertCircle,

  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { aiService, AI_PROVIDERS, type DiagramGenerationRequest, type DiagramGenerationResponse } from '../lib/ai';
import { settingsService } from '../lib/settings';
import { cn } from '../lib/utils';

interface AIGeneratorProps {
  onDiagramGenerated: (result: DiagramGenerationResponse, diagramType?: string) => void;
  onClose: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  onDiagramGenerated,
  onClose
}) => {
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<'openrouter' | 'groq' | 'gemini'>('openrouter');
  const [model, setModel] = useState('');

  const [diagramType, setDiagramType] = useState<'container' | 'architecture' | 'flowchart'>('container');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [includeIcons, setIncludeIcons] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableApiKeys, setAvailableApiKeys] = useState<{ [key: string]: boolean }>({});

  // Load available API keys on component mount
  React.useEffect(() => {
    const loadApiKeys = async () => {
      await settingsService.initialize();
      const keys = {
        openrouter: settingsService.hasAPIKey('openrouter'),
        groq: settingsService.hasAPIKey('groq'),
        gemini: settingsService.hasAPIKey('gemini')
      };
      setAvailableApiKeys(keys);

      // Set default provider to first available one
      const firstAvailable = Object.entries(keys).find(([_, hasKey]) => hasKey)?.[0] as 'openrouter' | 'groq' | 'gemini';
      if (firstAvailable) {
        setProvider(firstAvailable);
      }
    };
    loadApiKeys();
  }, []);

  // Update model options when provider changes
  React.useEffect(() => {
    const defaultModels = {
      openrouter: 'anthropic/claude-3.5-sonnet',
      groq: 'openai/gpt-oss-120b',
      gemini: 'gemini-3.1-pro-preview'
    };
    setModel(defaultModels[provider]);
  }, [provider]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please provide a description for your diagram');
      return;
    }

    if (!availableApiKeys[provider]) {
      setError(`Please configure your ${provider} API key in Settings first`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: DiagramGenerationRequest = {
        description: description.trim(),
        provider,
        model: model || undefined,
        options: {
          diagramType,
          complexity,
          includeIcons,
        },
      };

      const result = await aiService.generateDiagram(request);
      onDiagramGenerated(result, diagramType);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate diagram';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!description.trim()) {
      setError('Please provide a description to get suggestions');
      return;
    }

    if (!availableApiKeys[provider]) {
      setError(`Please configure your ${provider} API key in Settings first`);
      return;
    }

    setShowSuggestions(true);
    try {
      const questions = await aiService.refineDescription(description.trim(), provider);
      setSuggestions(questions);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      setSuggestions([
        'What are the main steps in this process?',
        'Are there any decision points or conditions?',
        'Who are the main actors or users involved?',
        'What happens if something goes wrong?',
      ]);
    }
  };





  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-white-20 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wand2 className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold">AI Diagram Generator</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your diagram
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Create a user registration process for an e-commerce platform with email verification and profile setup..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {description.length}/500 characters
                </span>
                <button
                  onClick={handleGetSuggestions}
                  disabled={!description.trim() || !availableApiKeys[provider]}
                  className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                >
                  <HelpCircle size={16} />
                  Get Suggestions
                </button>
              </div>
            </div>

            {/* AI Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <div className="grid grid-cols-1 gap-2">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      'flex items-start gap-3 p-3 border rounded-lg text-left transition-colors',
                      provider === p.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      checked={provider === p.id}
                      onChange={() => setProvider(p.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-gray-600">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>



            {/* Generation Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagram Type
                </label>
                <select
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="flowchart">Flowchart</option>
                  <option value="container">Container Diagram</option>
                  <option value="architecture">System Architecture</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complexity
                </label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="simple">Simple (3-5 nodes)</option>
                  <option value="medium">Medium (5-8 nodes)</option>
                  <option value="complex">Complex (8-15 nodes)</option>
                </select>
              </div>
            </div>

            {/* Include Icons Option */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeIcons}
                  onChange={(e) => setIncludeIcons(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Suggest icons for nodes (experimental)
                </span>
              </label>
            </div>

            {/* Suggestions Panel */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="text-blue-600" size={16} />
                  <h4 className="font-medium text-blue-900">Suggestions to improve your diagram:</h4>
                </div>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-800">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim() || !availableApiKeys[provider]}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Generate Diagram
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
