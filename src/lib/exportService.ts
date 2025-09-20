import { toPng, toSvg } from 'html-to-image';
import type { Node, Edge } from '@xyflow/react';

export interface ExportOptions {
  backgroundColor?: string;
  width?: number;
  height?: number;
  padding?: number;
}

class ExportService {
  /**
   * Export diagram as PNG
   */
  async exportToPNG(
    flowElement: HTMLElement,
    filename: string = 'diagram.png',
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      backgroundColor = '#ffffff',
      width,
      height
    } = options;

    try {
      // Generate PNG using html-to-image
      const dataUrl = await toPng(flowElement, {
        backgroundColor,
        width: width || flowElement.offsetWidth,
        height: height || flowElement.offsetHeight,
        style: {
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }
      });

      // Download the image
      this.downloadImage(dataUrl, filename);
    } catch (error) {
      console.error('Failed to export PNG:', error);
      throw new Error('Failed to export diagram as PNG');
    }
  }

  /**
   * Export diagram as SVG
   */
  async exportToSVG(
    flowElement: HTMLElement,
    filename: string = 'diagram.svg',
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      backgroundColor = '#ffffff',
      width,
      height
    } = options;

    try {
      // Generate SVG using html-to-image
      const dataUrl = await toSvg(flowElement, {
        backgroundColor,
        width: width || flowElement.offsetWidth,
        height: height || flowElement.offsetHeight,
        style: {
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }
      });

      // Download the SVG
      this.downloadImage(dataUrl, filename);
    } catch (error) {
      console.error('Failed to export SVG:', error);
      throw new Error('Failed to export diagram as SVG');
    }
  }

  /**
   * Download image data as file
   */
  private downloadImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export diagram as JSON
   */
  exportToJSON(
    nodes: Node[],
    edges: Edge[],
    filename: string = 'diagram.json'
  ): void {
    const diagramData = {
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const jsonString = JSON.stringify(diagramData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Copy diagram to clipboard as image
   */
  async copyToClipboard(flowElement: HTMLElement): Promise<void> {
    try {
      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#ffffff'
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      console.log('Diagram copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy diagram to clipboard');
    }
  }
}

export const exportService = new ExportService();
export default exportService;