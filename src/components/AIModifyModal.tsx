import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { AI_PROVIDERS } from '../lib/ai';

export interface AIModifyModalProps {
  isOpen: boolean;
  nodeId: string;
  currentTitle: string;
  currentContent: string;
  onModify: (nodeId: string, prompt: string, provider: string, model?: string) => Promise<void>;
  onClose: () => void;
}

export const AIModifyModal: React.FC<AIModifyModalProps> = ({
  isOpen,
  nodeId,
  currentTitle,
  currentContent,
  onModify,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [selectedModel, setSelectedModel] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await onModify(nodeId, prompt, selectedProvider, selectedModel || undefined);
      onClose();
      setPrompt('');
    } catch (error) {
      console.error('AI modification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableModels = (providerId: string) => {
    switch (providerId) {
      case 'openrouter':
        return [
          'anthropic/claude-3.5-sonnet',
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'meta-llama/llama-3.1-8b-instruct',
          'google/gemini-pro-1.5'
        ];
      case 'groq':
        return [
          'openai/gpt-oss-120b',
        ];
      case 'gemini':
        return ['gemini-3.1-pro-preview'];
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white-50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Modify Node</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Content Preview */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Current Node:</h4>
            <div className="text-sm text-gray-600">
              <div><strong>Title:</strong> {currentTitle}</div>
              <div><strong>Content:</strong> {currentContent}</div>
            </div>
          </div>

          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                setSelectedModel('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {AI_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model (optional)
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Default model</option>
              {getAvailableModels(selectedProvider).map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Modification Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How would you like to modify this node?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the changes you want to make... (e.g., 'Make it more technical', 'Add security considerations', 'Simplify the description', 'Change focus to performance')"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
            />
          </div>

          {/* Example prompts */}
          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Example prompts:</h4>
            <div className="space-y-1">
              {[
                'Make it more technical and detailed',
                'Add security best practices',
                'Focus on scalability aspects',
                'Simplify for beginners',
                'Add implementation details'
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="block text-xs text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Modifying...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
