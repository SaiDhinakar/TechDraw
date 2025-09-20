
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateId } from './utils';
import { settingsService } from './settings';
import { publicIconService } from './dynamicIcons';
import type { Node, Edge } from '@xyflow/react';

export interface AIProvider {
  id: 'openrouter' | 'groq' | 'gemini';
  name: string;
  description: string;
  apiKeyRequired: boolean;
}

export interface DiagramGenerationRequest {
  description: string;
  provider: AIProvider['id'];
  model?: string;
  options?: {
    includeIcons?: boolean;
    diagramType?: 'container' | 'component' | 'deployment' | 'sequence' | 'flowchart' | 'architecture';
    complexity?: 'simple' | 'medium' | 'complex';
  };
}

export interface DiagramGenerationResponse {
  nodes: Node[];
  edges: Edge[];
  title: string;
  description: string;
  suggestions?: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models via OpenRouter API',
    apiKeyRequired: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference with Groq API',
    apiKeyRequired: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s Gemini AI model',
    apiKeyRequired: true,
  },
];

class AIService {
  private openrouterClient: OpenAI | null = null;
  private groqClient: OpenAI | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;

  initializeProvider(provider: AIProvider['id'], apiKey: string) {
    switch (provider) {
      case 'openrouter':
        this.openrouterClient = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          dangerouslyAllowBrowser: true,
        });
        break;
      case 'groq':
        this.groqClient = new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
          dangerouslyAllowBrowser: true,
        });
        break;
      case 'gemini':
        this.geminiClient = new GoogleGenerativeAI(apiKey);
        break;
    }
  }

  async generateDiagram(request: DiagramGenerationRequest): Promise<DiagramGenerationResponse> {
    const apiKey = settingsService.getAPIKey(request.provider);
    if (!apiKey) {
      throw new Error(`API key not found for ${request.provider}. Please configure your API key in settings.`);
    }

    this.initializeProvider(request.provider, apiKey);
    const availableIcons = await publicIconService.getAllIcons();
    const prompt = this.buildPrompt(request, availableIcons);
    
    try {
      let response: string;

      switch (request.provider) {
        case 'openrouter':
          response = await this.generateWithOpenRouter(prompt, request.model);
          break;
        case 'groq':
          response = await this.generateWithGroq(prompt, request.model);
          break;
        case 'gemini':
          response = await this.generateWithGemini(prompt, request.model);
          break;
        default:
          throw new Error(`Unsupported provider: ${request.provider}`);
      }

      console.log('AI Response:', response);
      const result = this.parseAIResponse(response, request.description);
      console.log('Parsed Result:', result);
      return result;
    } catch (error) {
      console.error('AI generation failed:', error);
      throw new Error(`Failed to generate diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(request: DiagramGenerationRequest, availableIcons: any[]): string {
    const { description, options = {} } = request;
    const { diagramType = 'container', complexity = 'medium' } = options;
    
    // Use more icons and prioritize common tech icons
    const allIconNames = availableIcons.map(icon => icon.name);
    const iconList = allIconNames.slice(0, 150).join(', ');
    console.log(`Using ${allIconNames.length} total icons, showing first 150 to AI:`, iconList);
    return `
Task: Generate a professional ${diagramType} diagram based on the given description.

Input:
- Description: "${description}"
- Diagram Type: ${diagramType}
- Complexity Level: ${complexity}
- Available Icons (must use exact names): ${iconList}

Output Requirements:
- Strictly return JSON only (no markdown, no extra text).
- Use the exact JSON schema defined below.
- Each node must have a unique ID, proper position, and use an available icon.
- Layout must follow container-style, clean architecture rules.

JSON Schema:
{
  "title": "Clear, professional diagram title",
  "description": "One-sentence overview of the system/process",
  "nodes": [
    {
      "id": "unique-id",
      "type": "custom",
      "position": {"x": number, "y": number},
      "data": {
        "title": "Component Name",
        "content": "Brief component role/function",
        "backgroundColor": "#hexcolor",
        "borderColor": "#hexcolor",
        "textColor": "#hexcolor",
        "iconPath": "/icons/exact-icon-name-from-available-list.png"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "smoothstep|straight|bezier",
      "label": "Data flow or relationship",
      "animated": true|false
    }
  ],
  "suggestions": [
    "Improvement suggestion 1",
    "Enhancement suggestion 2"
  ]
}

Diagram Style Guidelines:
1. **Node Rules**
   - Use only "custom" node type.
   - Each node must have a descriptive title and content.
   - Use appropriate background colors for different component types.
   - Include relevant icons from the available list.

2. **Layout Rules**
   - Arrange components in clear tiers: top-to-bottom or left-to-right.
   - Minimum spacing: 200px between nodes, 300px between layers.
   - Use consistent alignment and distribution.

3. **Edge Rules**
   - Show clear, labeled relationships with animated edges.
   - Use "smoothstep" for logical data flows unless otherwise required.
   - No orphan nodes; all must connect logically.

4. **Complexity Rules**
   - For "simple", include 3–5 nodes.  
   - For "medium", include 6–9 nodes.  
   - For "complex", include 10–15 nodes.  

5. **Professional Standards**
   - All IDs must be unique and consistent.  
   - Nodes must be descriptive but concise.
   - Use only properties defined in the schema.  

Final Instruction:
- Read the description carefully, map to correct diagram type, and generate only valid JSON output following the schema above.
- Ensure the diagram is visually balanced, semantically accurate, and ready to render in a diagramming canvas.
`;
  }

//   private getNodeCount(complexity: string): string {
//     switch (complexity) {
//       case 'simple': return '3-5';
//       case 'medium': return '5-8';
//       case 'complex': return '8-15';
//       default: return '5-8';
//     }
//   }



  private async generateWithOpenRouter(prompt: string, model?: string): Promise<string> {
    if (!this.openrouterClient) {
      throw new Error('OpenRouter client not initialized');
    }

    const completion = await this.openrouterClient.chat.completions.create({
      model: model || 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async generateWithGroq(prompt: string, model?: string): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const completion = await this.groqClient.chat.completions.create({
      model: model || 'llama-3.1-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async generateWithGemini(prompt: string, model?: string): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const modelInstance = this.geminiClient.getGenerativeModel({ model: model || 'gemini-2.5-pro' });
    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private parseAIResponse(response: string, originalDescription: string): DiagramGenerationResponse {
    try {
      // Extract JSON from response (in case it's wrapped in markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      console.log('JSON String to parse:', jsonString);
      
      const parsed = JSON.parse(jsonString);
      console.log('Parsed JSON:', parsed);

      // Validate and ensure required fields for professional container diagrams
      const nodes: any[] = [];
      
      (parsed.nodes || []).forEach((node: any, index: number) => {
        const nodeId = node.id || generateId();
        const position = node.position || { x: (index % 3) * 300 + 100, y: Math.floor(index / 3) * 200 + 100 };
        
        // Create container node with proper CustomNodeData structure
        const containerNode = {
          id: nodeId,
          type: 'custom',
          position,
          data: {
            title: node.data?.title || node.data?.label || `Component ${index + 1}`,
            content: node.data?.content || node.data?.description || 'Component description',
            backgroundColor: node.data?.backgroundColor || '#ffffff',
            borderColor: node.data?.borderColor || '#e5e7eb',
            textColor: node.data?.textColor || '#1f2937',
            iconPath: node.data?.iconPath || (node.data?.icon ? `/icons/${node.data.icon}.png` : undefined)
          },
        };
        nodes.push(containerNode);
      });
      
      const allNodes = nodes;

      const edges = (parsed.edges || []).map((edge: any, index: number) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'smoothstep',
        label: edge.label,
        animated: edge.animated || false,
      }));

      return {
        title: parsed.title || 'Generated Diagram',
        description: parsed.description || originalDescription,
        nodes: allNodes,
        edges,
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Return a fallback simple diagram
      return this.createFallbackDiagram(originalDescription);
    }
  }

  private createFallbackDiagram(description: string): DiagramGenerationResponse {
    const nodes: Node[] = [
      {
        id: 'start-1',
        type: 'custom',
        position: { x: 100, y: 50 },
        data: { 
          title: 'Start',
          content: 'Starting point'
        },
      },
      {
        id: 'process-1',
        type: 'custom',
        position: { x: 100, y: 150 },
        data: { 
          title: 'Process',
          content: description,
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          textColor: '#1f2937'
        },
      },
      {
        id: 'end-1',
        type: 'custom',
        position: { x: 100, y: 250 },
        data: { 
          title: 'End',
          content: 'Completion point'
        },
      },
    ];

    const edges: Edge[] = [
      {
        id: 'e1-2',
        source: 'start-1',
        target: 'process-1',
      },
      {
        id: 'e2-3',
        source: 'process-1',
        target: 'end-1',
      },
    ];

    return {
      title: 'Simple Diagram',
      description,
      nodes,
      edges,
      suggestions: ['Add more detail to your description for better results'],
    };
  }

  async refineDescription(description: string, provider: AIProvider['id'], apiKey?: string): Promise<string[]> {
    if (apiKey) {
      this.initializeProvider(provider, apiKey);
    }

    const prompt = `
Analyze this diagram description and suggest 3-5 clarifying questions to help create a better flowchart:

Description: "${description}"

Return a JSON array of questions that would help clarify:
- Missing steps or processes
- Decision points or conditions
- Input/output requirements
- User roles or actors involved
- Exception handling or error cases

Format: ["Question 1?", "Question 2?", "Question 3?"]
`;

    try {
      let response: string;

      switch (provider) {
        case 'openrouter':
          response = await this.generateWithOpenRouter(prompt);
          break;
        case 'groq':
          response = await this.generateWithGroq(prompt);
          break;
        case 'gemini':
          response = await this.generateWithGemini(prompt);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to refine description:', error);
      return [
        'What are the main steps in this process?',
        'Are there any decision points or conditions?',
        'Who are the main actors or users involved?',
        'What happens if something goes wrong?',
      ];
    }
  }
}

export const aiService = new AIService();