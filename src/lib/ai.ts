
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
    diagramType?: 'container' | 'architecture' | 'flowchart';
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

    // Smart Arrow Detection: Check for workflow keywords
    const workflowKeywords = /workflow|process flow|flowchart|steps|procedure|sequential/i;
    const isWorkflowType = workflowKeywords.test(description);

    // Get type-specific configuration
    const typeConfig = this.getDiagramTypeConfig(diagramType);

    // Override animation based on keyword detection (unless it's already forced)
    let animatedEdges = typeConfig.animated;
    if (diagramType === 'container' && isWorkflowType) {
      // If container diagram but description mentions workflow, use solid arrows
      animatedEdges = false;
      console.log('Smart Arrow Detection: Detected workflow keywords, using solid arrows');
    } else if (diagramType === 'container' && !isWorkflowType) {
      // Standard container with no workflow mention, use animated
      animatedEdges = true;
      console.log('Smart Arrow Detection: No workflow keywords, using animated arrows');
    }

    return `
Task: Generate a professional ${diagramType} diagram based on the given description.

Input:
- Description: "${description}"
- Diagram Type: ${diagramType}
- Complexity Level: ${complexity}
- Available Icons (must use exact names): ${iconList}

${typeConfig.specificInstructions}

Output Requirements:
- Strictly return JSON only (no markdown, no extra text).
- Use the exact JSON schema defined below.
- Each node must have a unique ID, proper position, and use an available icon.
- Layout must follow ${typeConfig.layoutStyle}.

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
        "backgroundColor": "${typeConfig.colorScheme.background}",
        "borderColor": "${typeConfig.colorScheme.border}",
        "textColor": "${typeConfig.colorScheme.text}",
        "iconPath": "/icons/exact-icon-name-from-available-list.png"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "${typeConfig.edgeType}",
      "label": "${typeConfig.edgeLabel}",
      "animated": ${animatedEdges}
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
   - ${typeConfig.nodeRules}
   - Use appropriate background colors: ${typeConfig.colorScheme.background}
   - Include relevant icons from the available list.

2. **Layout Rules**
   - ${typeConfig.layoutRules}
   - Minimum spacing: 200px between nodes, 300px between layers.
   - Use consistent alignment and distribution.

3. **Edge Rules**
   - ${typeConfig.edgeRules}
   - ${typeConfig.animated ? 'Use animated edges to show flow' : 'Use solid edges (NO animation)'}
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

  private getDiagramTypeConfig(type: string) {
    const configs: Record<string, any> = {
      flowchart: {
        specificInstructions: `FLOWCHART SPECIFIC RULES:
- Use simple, clean node styling with minimal decoration
- Nodes should flow top-to-bottom or left-to-right
- Use only solid, straight edges - ABSOLUTELY NO ANIMATION
- Include decision points (diamond shapes can be simulated with styling)
- Keep icons simple and minimal`,
        layoutStyle: 'top-to-bottom or left-to-right flow with clear progression',
        layoutRules: 'Arrange in a clear sequential flow from start to end. Group related steps together. Use vertical or horizontal alignment.',
        nodeRules: 'Each node represents a step or decision. Use simple, clean styling. Minimal decoration.',
        edgeType: 'straight',
        edgeRules: 'Use solid, straight arrows showing direction of flow. Label each edge with action or condition.',
        edgeLabel: 'Action or condition',
        animated: false,
        colorScheme: {
          background: '#f0f9ff',
          border: '#3b82f6',
          text: '#1e40af'
        }
      },
      container: {
        specificInstructions: `CONTAINER DIAGRAM SPECIFIC RULES:
- Use large boxes representing containers/systems
- IMPORTANT: Show grouped stacks within containers (multiple components per container)
- Each container can hold multiple services/components
- Use clear visual grouping for stacks within containers
- Edges can be animated to show data flow
- Use professional blue/gray color scheme`,
        layoutStyle: 'grouped by containers with nested stacks inside',
        layoutRules: 'Group components into containers. Show container boundaries clearly. Nest multiple stacks/services within each container.',
        nodeRules: 'Each node is either a container (large box) or a service/stack within a container. Show hierarchy and grouping.',
        edgeType: 'smoothstep',
        edgeRules: 'Use smoothstep edges between containers and services. Show clear data/message flow between components.',
        edgeLabel: 'Data flow or API call',
        animated: true,
        colorScheme: {
          background: '#ffffff',
          border: '#6b7280',
          text: '#1f2937'
        }
      },
      architecture: {
        specificInstructions: `SYSTEM ARCHITECTURE SPECIFIC RULES:
- Show high-level system components and their relationships
- Use HIERARCHICAL layout - top-to-bottom or left-to-right
- NO CIRCULAR CONNECTIONS - only clear directional flows
- Show both brief overview and detailed component interactions
- Use clear, straight edges showing information flow direction`,
        layoutStyle: 'hierarchical top-to-bottom or left-to-right with clear directional flow',
        layoutRules: 'Arrange in strict hierarchy. Show clear information flow from sources to sinks. NO circular dependencies or connections.',
        nodeRules: 'Each node is a major subsystem or component. Show clear boundaries and responsibilities. Use large, prominent boxes.',
        edgeType: 'straight',
        edgeRules: 'Use only straight edges with clear directional arrows. Show unidirectional data/control flow. Label with data type or protocol.',
        edgeLabel: 'Data or control flow',
        animated: false,
        colorScheme: {
          background: '#f0fdfa',
          border: '#14b8a6',
          text: '#134e4a'
        }
      }
    };

    return configs[type] || configs.container;
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